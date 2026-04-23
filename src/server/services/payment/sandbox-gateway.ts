import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import { formatBankServBatch, serialiseBatchToFlatFile } from '@/lib/billing/bankserv-formatter';
import { ensureCompletedPurchaseArtifacts } from '@/server/services/billing/purchase-completion';
import { DefaultVoucherService } from '@/server/services/voucher/default-voucher-service';
import { generateSecureVoucherCode, generateTransactionReference, sha256 } from '@/server/utils/security';
import { recordWalletCredit } from '@/server/services/wallet/ledger';
import { writeAuditEvent } from '@/server/utils/audit';

export const SANDBOX_ALLOWED_ORIGIN = 'https://www.evoucher.co.za';
export const SANDBOX_WEBHOOK_CALLBACK = 'https://www.evoucher.co.za/api/payment-callback';
export const SANDBOX_SPONSOR_ACCOUNT = '620-001-2345';
export const SANDBOX_SETTLEMENT_CURRENCY = 'ZAR';

export type SandboxPaymentMethod = 'card_3ds' | 'debit_card' | 'eft' | 'payfast' | 'evoucher_wallet' | 'ussd';

type AnyRecord = Record<string, any>;

function round2(value: number) {
  return Number(Number(value || 0).toFixed(2));
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function truthyString(value: unknown) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  const bareRelation = relation.includes('.') ? (relation.split('.').at(-1) ?? relation) : relation;
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`relation "${bareRelation}" does not exist`) ||
    message.includes(`could not find the table '${relation}' in the schema cache`) ||
    message.includes(`could not find the table '${bareRelation}' in the schema cache`)
  );
}

function isMissingSchemaField(error: any, fieldName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const field = fieldName.toLowerCase();
  return (
    message.includes(`column "${field}" does not exist`) ||
    message.includes(`could not find the '${field}' column`) ||
    message.includes(`record "${field}" has no field`) ||
    message.includes('schema cache')
  );
}

async function insertPaymentTransactionWithFallback(
  admin: ReturnType<typeof createAdminClient>,
  row: Record<string, unknown>
) {
  let error = (await admin.from('payment_transactions').insert(row)).error;
  if (!error) return;

  const compatibilityFields = [
    'product_id',
    'face_value',
    'total_discount_pct',
    'consumer_benefit_pct',
    'evoucher_benefit_pct',
    'total_discount_amount',
    'consumer_benefit_amount',
    'evoucher_benefit_amount',
    'consumer_price',
    'merchant_receivable_after_total_discount',
    'merchant_receivable_after_evoucher_benefit',
    'merchant_id',
  ];

  if (!compatibilityFields.some((field) => isMissingSchemaField(error, field))) {
    throw error;
  }

  const fallbackRow = {
    customer_id: row.customer_id,
    amount: row.amount,
    card_last_four: row.card_last_four,
    card_brand: row.card_brand,
    payment_status: row.payment_status,
    voucher_code: row.voucher_code,
    transaction_reference: row.transaction_reference,
    ...(row.merchant_id === null || row.merchant_id === undefined
      ? {}
      : { merchant_id: row.merchant_id }),
  };

  error = (await admin.from('payment_transactions').insert(fallbackRow)).error;
  if (error) throw error;
}

export function jsonSandbox(data: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

export function getSandboxApiKey() {
  return String(
    process.env.SANDBOX_API_KEY ?? process.env.EVOUCHER_SANDBOX_API_KEY ?? process.env.BILLING_SANDBOX_API_KEY ?? ''
  ).trim();
}

function getAllowedOrigins() {
  const configured = String(process.env.SANDBOX_ALLOWED_ORIGINS ?? '').trim();
  const origins = new Set<string>([SANDBOX_ALLOWED_ORIGIN]);
  if (configured) {
    configured.split(',').map((value) => value.trim()).filter(Boolean).forEach((value) => origins.add(value));
  }
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:4028');
  }
  return origins;
}

export function authorizeSandboxRequest(request: Request) {
  const expectedKey = getSandboxApiKey();
  if (!expectedKey) return NextResponse.json({ error: 'Missing SANDBOX_API_KEY on server.' }, { status: 500 });

  const authHeader = String(request.headers.get('authorization') ?? '').trim();
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  if (!token || token !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized sandbox request.' }, { status: 401 });
  }

  const origin = truthyString(request.headers.get('origin'));
  if (origin && !getAllowedOrigins().has(origin)) {
    return NextResponse.json({ error: `Origin not allowed: ${origin}` }, { status: 403 });
  }

  return null;
}

export function normalizeSandboxPaymentMethod(value: unknown): SandboxPaymentMethod {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'card_3ds' || raw === 'visa_secure') return 'card_3ds';
  if (raw === 'debit_card' || raw === 'debit_credit') return 'debit_card';
  if (raw === 'eft' || raw === 'instant_eft') return 'eft';
  if (raw === 'payfast') return 'payfast';
  if (raw === 'evoucher_wallet' || raw === 'wallet') return 'evoucher_wallet';
  if (raw === 'ussd') return 'ussd';
  throw new Error('Unsupported sandbox payment method.');
}

function buildGatewayFee(amount: number, paymentMethod: SandboxPaymentMethod) {
  const rates: Record<SandboxPaymentMethod, number> = {
    card_3ds: 0.015,
    debit_card: 0.01,
    eft: 0,
    payfast: 0.02,
    evoucher_wallet: 0,
    ussd: 0,
  };
  return round2(amount * rates[paymentMethod]);
}

function buildCardBrand(paymentMethod: SandboxPaymentMethod) {
  if (paymentMethod === 'card_3ds') return 'VISA';
  if (paymentMethod === 'debit_card') return 'CARD';
  if (paymentMethod === 'evoucher_wallet') return 'WALLET';
  return paymentMethod.toUpperCase();
}

function requiresAuthorization(paymentMethod: SandboxPaymentMethod) {
  return paymentMethod === 'card_3ds' || paymentMethod === 'payfast' || paymentMethod === 'ussd';
}

async function resolveCustomer(admin: ReturnType<typeof createAdminClient>, body: AnyRecord) {
  const directId = truthyString(body.customer_id) ?? truthyString(body.customerId);
  if (directId) return { id: directId, email: truthyString(body.customer_email) ?? truthyString(body.customerEmail) };

  const paymentLookup = await admin.from('payment_transactions').select('customer_id').not('customer_id', 'is', null).order('created_at', { ascending: false }).limit(1);
  if (!paymentLookup.error && paymentLookup.data?.[0]?.customer_id) {
    return { id: String(paymentLookup.data[0].customer_id), email: truthyString(body.customer_email) ?? truthyString(body.customerEmail) };
  }

  const voucherLookup = await admin.from('customer_vouchers').select('customer_id').not('customer_id', 'is', null).order('issued_at', { ascending: false }).limit(1);
  if (!voucherLookup.error && voucherLookup.data?.[0]?.customer_id) {
    return { id: String(voucherLookup.data[0].customer_id), email: truthyString(body.customer_email) ?? truthyString(body.customerEmail) };
  }

  throw new Error('Provide customer_id for sandbox processing.');
}

async function resolveMerchant(admin: ReturnType<typeof createAdminClient>, body: AnyRecord) {
  const { data, error } = await admin
    .from('merchants')
    .select('id,business_name,parent_brand,default_total_discount_pct,branch_code,status')
    .in('status', ['approved', 'active'])
    .order('business_name', { ascending: true })
    .limit(50);
  if (error) throw error;
  const merchants = Array.isArray(data) ? data : [];
  if (merchants.length === 0) throw new Error('No active merchants available.');

  const requested = (truthyString(body.merchant_id) ?? truthyString(body.merchantId) ?? truthyString(body.merchant_name) ?? '').toLowerCase();
  const match = merchants.find((merchant: any) => {
    const id = String(merchant.id ?? '').toLowerCase();
    const name = String(merchant.business_name ?? '').toLowerCase();
    const brand = String(merchant.parent_brand ?? '').toLowerCase();
    return requested && (requested === id || requested === name || requested === brand);
  }) ?? merchants[0];

  return {
    id: String(match.id),
    business_name: String(match.business_name),
    parent_brand: truthyString(match.parent_brand),
    default_total_discount_pct: match.default_total_discount_pct === null ? null : Number(match.default_total_discount_pct),
    branch_code: truthyString(match.branch_code),
  };
}

async function fetchTransaction(admin: ReturnType<typeof createAdminClient>, reference: string) {
  const { data, error } = await admin.from('payment_transactions').select('*').eq('transaction_reference', reference).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Transaction not found.');
  return data as AnyRecord;
}

async function recordSandboxEvent(admin: ReturnType<typeof createAdminClient>, input: { eventKey: string; eventType?: string; merchantId?: string | null; customerId?: string | null; voucherId?: string | null; grossAmount: number; occurredAt: string; metadata: Record<string, unknown>; }) {
  const existing = await admin.from('billing_events').select('id').eq('event_key', input.eventKey).maybeSingle();
  if (existing.error) {
    if (isMissingRelation(existing.error, 'public.billing_events')) return null;
    throw existing.error;
  }
  if (existing.data?.id) return existing.data;
  const { error } = await admin.from('billing_events').insert({
    event_key: input.eventKey,
    event_type: input.eventType ?? 'payment_transaction',
    merchant_id: input.merchantId ?? null,
    customer_id: input.customerId ?? null,
    voucher_id: input.voucherId ?? null,
    gross_amount: round2(input.grossAmount),
    merchant_payout_amount: 0,
    total_discount_pct: 0,
    total_discount_amount: 0,
    occurred_at: input.occurredAt,
    metadata: input.metadata,
  });
  if (error) {
    if (isMissingRelation(error, 'public.billing_events')) return null;
    if (!String(error.message ?? '').toLowerCase().includes('duplicate')) throw error;
  }
  return null;
}
async function dispatchWebhook(reference: string, status: 'completed' | 'failed') {
  const secret = String(process.env.PAYMENTS_WEBHOOK_SECRET ?? '').trim();
  if (!secret) return null;

  const payload = {
    eventId: generateTransactionReference('EVT'),
    transactionReference: reference,
    status,
  };
  const payloadText = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payloadText}`).digest('hex');

  await fetch(new URL('/api/payment-callback', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4028'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-signature': signature,
      'x-webhook-timestamp': timestamp,
      'x-payment-provider': 'sandbox',
    },
    body: payloadText,
  });

  return payload;
}

async function completeTransaction(admin: ReturnType<typeof createAdminClient>, transaction: AnyRecord, provider = 'sandbox') {
  const occurredAt = new Date().toISOString();
  const isWalletTopup = !transaction.merchant_id && !transaction.voucher_code;

  if (isWalletTopup) {
    await admin.from('payment_transactions').update({ payment_status: 'completed' }).eq('transaction_reference', transaction.transaction_reference);
    await recordWalletCredit(admin, {
      customerId: String(transaction.customer_id),
      userEmail: null,
      amount: Number(transaction.face_value ?? transaction.amount ?? 0),
      description: `Sandbox wallet top-up ${transaction.transaction_reference}`,
    });
    await recordSandboxEvent(admin, {
      eventKey: `sandbox-topup:${transaction.transaction_reference}`,
      customerId: String(transaction.customer_id),
      grossAmount: Number(transaction.face_value ?? transaction.amount ?? 0),
      occurredAt,
      metadata: { transactionType: 'wallet_topup', provider, transactionReference: transaction.transaction_reference },
    });
    return { voucherCode: null, kind: 'wallet_topup' };
  }

  const merchant = await resolveMerchant(admin, { merchant_id: transaction.merchant_id });
  const completed = await ensureCompletedPurchaseArtifacts(admin, {
    merchant: {
      id: String(merchant.id),
      business_name: String(merchant.business_name),
      parent_brand: merchant.parent_brand ?? merchant.business_name,
    },
    transaction: {
      customer_id: String(transaction.customer_id),
      merchant_id: String(transaction.merchant_id),
      product_id: transaction.product_id ?? null,
      transaction_reference: String(transaction.transaction_reference),
      voucher_code: truthyString(transaction.voucher_code),
      face_value: safeNumber(transaction.face_value, safeNumber(transaction.amount)),
      total_discount_pct: safeNumber(transaction.total_discount_pct, DEFAULT_TOTAL_DISCOUNT_PCT),
      consumer_price: safeNumber(transaction.consumer_price, safeNumber(transaction.amount)),
      amount: safeNumber(transaction.amount),
    },
    occurredAt,
    metadata: { provider, source: 'sandbox_gateway' },
  });
  return { voucherCode: completed.voucherCode, kind: 'purchase' };
}

export async function createSandboxPurchase(body: AnyRecord) {
  const admin = createAdminClient();
  const customer = await resolveCustomer(admin, body);
  const merchant = await resolveMerchant(admin, body);
  const paymentMethod = normalizeSandboxPaymentMethod(body.payment_method ?? body.paymentMethod ?? 'card_3ds');
  const faceValue = safeNumber(body.face_value ?? body.faceValue ?? body.amount, 100);
  const totalDiscountPct = safeNumber(body.total_discount_pct ?? body.totalDiscountPct, merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT);
  const pricing = calculateDiscountPricing(faceValue, totalDiscountPct);
  const gatewayFee = round2(safeNumber(body.gateway_fee ?? body.gatewayFee, buildGatewayFee(pricing.consumerPrice, paymentMethod)));
  const totalCharge = round2(safeNumber(body.total_charge ?? body.totalCharge, pricing.consumerPrice + gatewayFee));
  const transactionReference = truthyString(body.ref) ?? truthyString(body.order_ref) ?? generateTransactionReference('SBX');
  const paymentStatus = requiresAuthorization(paymentMethod) ? 'pending' : 'completed';
  const voucherCode = paymentStatus === 'completed' ? generateSecureVoucherCode('EVS') : null;

  const row = {
    customer_id: customer.id,
    merchant_id: merchant.id,
    product_id: null,
    amount: pricing.consumerPrice,
    face_value: pricing.faceValue,
    total_discount_pct: pricing.totalDiscountPct,
    consumer_benefit_pct: pricing.consumerBenefitPct,
    evoucher_benefit_pct: pricing.evoucherBenefitPct,
    total_discount_amount: pricing.totalDiscountAmount,
    consumer_benefit_amount: pricing.consumerBenefitAmount,
    evoucher_benefit_amount: pricing.evoucherBenefitAmount,
    consumer_price: pricing.consumerPrice,
    merchant_receivable_after_total_discount: pricing.merchantReceivableAfterTotalDiscount,
    merchant_receivable_after_evoucher_benefit: pricing.merchantReceivableAfterEvoucherBenefit,
    card_last_four: String(body.card_last_four ?? '1111').slice(-4).padStart(4, '0'),
    card_brand: buildCardBrand(paymentMethod),
    payment_status: paymentStatus,
    voucher_code: voucherCode,
    transaction_reference: transactionReference,
  };
  await insertPaymentTransactionWithFallback(admin, row);

  let completedVoucherCode: string | null = voucherCode;
  if (paymentStatus === 'completed') {
    const completed = await completeTransaction(admin, row);
    completedVoucherCode = completed.voucherCode;
  }

  await writeAuditEvent(admin, {
    actorId: customer.id,
    actorRole: 'customer',
    entityType: 'sandbox_payment',
    entityId: transactionReference,
    action: 'sandbox_payment_initiated',
    metadata: { flow: 'shop_checkout', paymentMethod, gatewayFee, totalCharge, merchantId: merchant.id },
    requestId: transactionReference,
  });

  return {
    status: 'authorized',
    ref: transactionReference,
    auth_code: `AUTH-${transactionReference.slice(-5).toUpperCase()}`,
    amount: totalCharge,
    gateway_fee: gatewayFee,
    fnb_account: SANDBOX_SPONSOR_ACCOUNT,
    payment_status: paymentStatus,
    sandbox: true,
    webhook: truthyString(body.webhook) ?? SANDBOX_WEBHOOK_CALLBACK,
    three_ds_required: paymentMethod === 'card_3ds',
    otp_challenge: paymentMethod === 'card_3ds' ? { status: 'pending', expires_in: 300 } : null,
    checkout_url: paymentStatus === 'pending' ? `https://payments.local/checkout/${encodeURIComponent(transactionReference)}` : null,
    voucher_code: completedVoucherCode,
    timestamp: new Date().toISOString(),
  };
}

export async function createSandboxTopup(body: AnyRecord) {
  const admin = createAdminClient();
  const customer = await resolveCustomer(admin, body);
  const paymentMethod = normalizeSandboxPaymentMethod(body.payment_method ?? body.paymentMethod ?? 'eft');
  const faceValue = round2(safeNumber(body.amount ?? body.face_value ?? body.faceValue, 300));
  const savingsPct = round2(safeNumber(body.savings_pct ?? body.savingsPct, 2.5));
  const platformFeePct = round2(safeNumber(body.platform_fee_pct ?? body.platformFeePct, 2.5));
  const netAmount = round2(safeNumber(body.net_amount ?? body.netAmount, faceValue - faceValue * ((savingsPct + platformFeePct) / 100)));
  const transactionReference = truthyString(body.ref) ?? generateTransactionReference('TOP');
  const paymentStatus = requiresAuthorization(paymentMethod) ? 'pending' : 'completed';

  const row = {
    customer_id: customer.id,
    merchant_id: null,
    product_id: null,
    amount: faceValue,
    face_value: faceValue,
    total_discount_pct: 0,
    consumer_benefit_pct: 0,
    evoucher_benefit_pct: 0,
    total_discount_amount: 0,
    consumer_benefit_amount: 0,
    evoucher_benefit_amount: 0,
    consumer_price: netAmount,
    merchant_receivable_after_total_discount: null,
    merchant_receivable_after_evoucher_benefit: null,
    card_last_four: '0000',
    card_brand: buildCardBrand(paymentMethod),
    payment_status: paymentStatus,
    voucher_code: null,
    transaction_reference: transactionReference,
  };
  await insertPaymentTransactionWithFallback(admin, row);
  if (paymentStatus === 'completed') await completeTransaction(admin, row);

  return {
    status: paymentStatus,
    ref: transactionReference,
    amount: faceValue,
    net_amount: netAmount,
    savings_pct: savingsPct,
    platform_fee_pct: platformFeePct,
    checkout_url: paymentStatus === 'pending' ? `https://payments.local/checkout/${encodeURIComponent(transactionReference)}` : null,
    sandbox: true,
    timestamp: new Date().toISOString(),
  };
}

export async function authorizeSandboxPayment(body: AnyRecord) {
  const admin = createAdminClient();
  const reference = truthyString(body.ref) ?? truthyString(body.transactionReference);
  if (!reference) throw new Error('ref is required.');
  const challenge = truthyString(body.otp) ?? truthyString(body.pin) ?? 'approved';
  if (challenge === '000000' || challenge.toLowerCase() === 'fail') {
    await admin.from('payment_transactions').update({ payment_status: 'failed' }).eq('transaction_reference', reference);
    await recordSandboxEvent(admin, {
      eventKey: `sandbox-failure:${reference}`,
      grossAmount: 0,
      occurredAt: new Date().toISOString(),
      metadata: { transactionType: 'payment_failure', transactionReference: reference },
    });
    await dispatchWebhook(reference, 'failed');
    return { status: 'failed', ref: reference, sandbox: true };
  }

  const transaction = await fetchTransaction(admin, reference);
  const completed = await completeTransaction(admin, transaction);
  await dispatchWebhook(reference, 'completed');
  return {
    status: 'authorized',
    payment_status: 'completed',
    ref: reference,
    voucher_code: completed.voucherCode,
    sandbox: true,
    timestamp: new Date().toISOString(),
  };
}

export async function getSandboxPaymentStatus(reference: string) {
  const admin = createAdminClient();
  const transaction = await fetchTransaction(admin, reference);
  const paymentStatus = String(transaction.payment_status ?? 'pending').toLowerCase();
  return {
    ref: reference,
    status: paymentStatus === 'completed' ? 'authorized' : paymentStatus,
    payment_status: paymentStatus,
    voucher_code: truthyString(transaction.voucher_code),
    amount: round2(safeNumber(transaction.consumer_price, safeNumber(transaction.amount))),
    checkout_url: paymentStatus === 'pending' ? `https://payments.local/checkout/${encodeURIComponent(reference)}` : null,
    sandbox: true,
  };
}
export async function addVoucherToWallet(body: AnyRecord) {
  const admin = createAdminClient();
  const customer = await resolveCustomer(admin, body);
  const merchant = await resolveMerchant(admin, body);
  const voucherCode = truthyString(body.voucher_code) ?? truthyString(body.voucherCode) ?? generateSecureVoucherCode('WLT');
  const existing = await admin.from('customer_vouchers').select('id,voucher_code,face_value,expires_at').eq('customer_id', customer.id).eq('voucher_code', voucherCode).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) {
    return { status: 'active', voucher_code: existing.data.voucher_code, face_value: Number(existing.data.face_value ?? 0), expires_at: existing.data.expires_at ?? null, sandbox: true, duplicate: true };
  }

  const faceValue = round2(safeNumber(body.face_value ?? body.faceValue ?? body.amount, 100));
  const pricing = calculateDiscountPricing(faceValue, safeNumber(body.total_discount_pct ?? body.totalDiscountPct, merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT));
  const service = new DefaultVoucherService();
  const issued = await service.issueVoucher({
    customerId: customer.id,
    merchantId: merchant.id,
    merchantName: merchant.business_name,
    parentBrand: merchant.parent_brand ?? merchant.business_name,
    faceValue,
    discountPercent: pricing.consumerBenefitPct,
    pricing,
    voucherCode,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await recordSandboxEvent(admin, {
    eventKey: `sandbox-wallet-voucher:${voucherCode}`,
    merchantId: merchant.id,
    customerId: customer.id,
    voucherId: issued.voucherId,
    grossAmount: faceValue,
    occurredAt: new Date().toISOString(),
    metadata: { transactionType: 'wallet_voucher_add', voucherCode },
  });

  return { status: 'active', voucher_code: voucherCode, face_value: faceValue, voucher_id: issued.voucherId, sandbox: true };
}

function buildBatchNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BS-${stamp}-${suffix}`;
}

function buildSettlementReference(invoiceNumber: string) {
  const safeInvoice = String(invoiceNumber ?? 'INV').replace(/[^A-Za-z0-9-]/g, '').slice(0, 12);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EVS-${safeInvoice}-${suffix}`.slice(0, 20);
}

export async function submitSandboxSettlement(body: AnyRecord) {
  const admin = createAdminClient();
  let batchId = truthyString(body.batch_id) ?? truthyString(body.batchId);

  if (!batchId) {
    const invoiceQuery = await admin.from('billing_invoices').select('id,invoice_number,merchant_id,net_payable_to_merchant,status').eq('status', 'approved').is('settlement_batch_id', null).limit(2000);
    if (invoiceQuery.error) throw invoiceQuery.error;
    const invoices = invoiceQuery.data ?? [];
    if (invoices.length === 0) throw new Error('No approved invoices are available for sandbox settlement submission.');

    const merchantIds = Array.from(new Set(invoices.map((invoice: any) => String(invoice.merchant_id))));
    const totalAmount = round2(invoices.reduce((sum: number, invoice: any) => sum + Number(invoice.net_payable_to_merchant ?? 0), 0));
    const batchInsert = await admin.from('billing_settlement_batches').insert({ batch_number: buildBatchNumber(), status: 'pending_approval', total_amount: totalAmount, merchant_count: merchantIds.length, notes: 'Created by sandbox gateway settlement submit.' }).select('*').single();
    if (batchInsert.error || !batchInsert.data) throw batchInsert.error ?? new Error('Failed to create settlement batch.');
    batchId = String(batchInsert.data.id);

    const merchantsLookup = await admin.from('merchants').select('id,business_name,bank_name,branch_code,account_number,contact_name').in('id', merchantIds);
    if (merchantsLookup.error) throw merchantsLookup.error;
    const merchantMap = new Map((merchantsLookup.data ?? []).map((entry: any) => [String(entry.id), entry]));

    const linkageLookup = await admin.from('billing_bank_linkages').select('id,merchant_id,merchant_bank_name,branch_code,account_type,account_holder_name,account_number_enc,account_number_last4,verification_status,is_active').in('merchant_id', merchantIds).eq('is_active', true).eq('verification_status', 'verified');
    if (linkageLookup.error) throw linkageLookup.error;
    const linkageMap = new Map((linkageLookup.data ?? []).map((entry: any) => [String(entry.merchant_id), entry]));

    const settlementRows = invoices.map((invoice: any) => {
      const merchant = merchantMap.get(String(invoice.merchant_id));
      const linkage = linkageMap.get(String(invoice.merchant_id));
      const last4 = linkage?.account_number_last4 ? String(linkage.account_number_last4) : String(merchant?.account_number ?? '').slice(-4);
      const settlementReference = buildSettlementReference(String(invoice.invoice_number ?? invoice.id));
      return {
        batch_id: batchId,
        merchant_id: invoice.merchant_id,
        amount: round2(Number(invoice.net_payable_to_merchant ?? 0)),
        bank_name: linkage?.merchant_bank_name ?? merchant?.bank_name ?? 'FNB',
        branch_code: linkage?.branch_code ?? merchant?.branch_code ?? '250655',
        account_number: last4 ? `****${last4}` : null,
        account_holder: linkage?.account_holder_name ?? merchant?.contact_name ?? merchant?.business_name ?? null,
        reference: settlementReference,
        status: 'pending',
        settlement_reference: settlementReference,
        invoice_id: invoice.id,
        currency: SANDBOX_SETTLEMENT_CURRENCY,
        reconciliation_status: 'pending',
        bank_linkage_id: linkage?.id ?? null,
        initiated_at: new Date().toISOString(),
        instruction_json: {},
        status_history_json: [{ at: new Date().toISOString(), status: 'initiated', note: 'Created by sandbox settlement submission.' }],
      };
    });
    const settlementsInsert = await admin.from('billing_settlements').insert(settlementRows);
    if (settlementsInsert.error) throw settlementsInsert.error;
    const invoiceUpdate = await admin.from('billing_invoices').update({ settlement_batch_id: batchId, settled_at: new Date().toISOString(), status: 'exported' }).in('id', invoices.map((invoice: any) => invoice.id));
    if (invoiceUpdate.error) throw invoiceUpdate.error;
  }

  const batchLookup = await admin.from('billing_settlement_batches').select('*').eq('id', batchId).single();
  if (batchLookup.error || !batchLookup.data) throw batchLookup.error ?? new Error('Batch not found.');
  const settlementsLookup = await admin.from('billing_settlements').select('*').eq('batch_id', batchId).order('created_at', { ascending: true }).limit(5000);
  if (settlementsLookup.error) throw settlementsLookup.error;
  const settlements = settlementsLookup.data ?? [];
  if (settlements.length === 0) throw new Error('No settlements found for batch.');

  const invoiceIds = Array.from(new Set(settlements.map((entry: any) => String(entry.invoice_id)).filter(Boolean)));
  const linkageIds = Array.from(new Set(settlements.map((entry: any) => String(entry.bank_linkage_id)).filter(Boolean)));
  const invoicesLookup = await admin.from('billing_invoices').select('id,invoice_number').in('id', invoiceIds);
  if (invoicesLookup.error) throw invoicesLookup.error;
  const linkagesLookup = linkageIds.length > 0 ? await admin.from('billing_bank_linkages').select('id,branch_code,account_type,account_holder_name,account_number_enc').in('id', linkageIds) : { data: [], error: null };
  if (linkagesLookup.error) throw linkagesLookup.error;
  const invoiceMap = new Map((invoicesLookup.data ?? []).map((entry: any) => [String(entry.id), entry]));
  const linkageMap = new Map((linkagesLookup.data ?? []).map((entry: any) => [String(entry.id), entry]));

  const rows = settlements.map((entry: any) => {
    const invoice = invoiceMap.get(String(entry.invoice_id));
    const linkage = linkageMap.get(String(entry.bank_linkage_id));
    if (!invoice || !linkage) return null;
    return {
      settlementId: String(entry.id),
      settlementReference: String(entry.settlement_reference ?? '').trim(),
      amount: Number(entry.amount ?? 0),
      invoiceId: String(entry.invoice_id),
      invoiceNumber: String(invoice.invoice_number ?? invoice.id),
      merchantId: String(entry.merchant_id),
      linkage: {
        branchCode: String(linkage.branch_code ?? '250655'),
        accountType: String(linkage.account_type ?? 'current'),
        accountHolderName: String(linkage.account_holder_name ?? ''),
        accountNumberEnc: String(linkage.account_number_enc ?? ''),
      },
    };
  }).filter(Boolean) as any[];

  const flatFile = serialiseBatchToFlatFile(formatBankServBatch(rows));
  const now = new Date().toISOString();
  await admin.from('billing_settlement_batches').update({ status: 'approved' }).eq('id', batchId);
  await admin.from('billing_settlements').update({ status: 'approved' }).eq('batch_id', batchId);
  await admin.from('billing_settlement_batches').update({ status: 'exported', exported_at: now }).eq('id', batchId);
  await admin.from('billing_settlements').update({ status: 'exported' }).eq('batch_id', batchId);

  const bankservBatchId = `BSIM-${String(batchLookup.data.batch_number ?? batchId).slice(-8)}`;
  await admin.from('billing_settlement_batches').update({ status: 'submitted_to_bank', submitted_at: now }).eq('id', batchId);
  await admin.from('billing_settlements').update({ status: 'submitted_to_bank', bankserv_batch_id: bankservBatchId, initiated_at: now }).eq('batch_id', batchId);
  await admin.from('billing_settlement_batches').update({ status: 'confirmed', confirmed_at: now }).eq('id', batchId);
  await admin.from('billing_settlements').update({ status: 'confirmed', confirmed_at: now, reconciliation_status: 'matched' }).eq('batch_id', batchId);
  await admin.from('billing_invoices').update({ status: 'paid', paid_at: now, payment_reference: String(batchLookup.data.batch_number ?? '').slice(0, 120) || null }).eq('settlement_batch_id', batchId);

  await recordSandboxEvent(admin, { eventKey: `sandbox-settlement:${batchId}`, eventType: 'manual_adjustment', grossAmount: round2(settlements.reduce((sum: number, entry: any) => sum + Number(entry.amount ?? 0), 0)), occurredAt: now, metadata: { transactionType: 'settlement_batch', batchId, batchNumber: batchLookup.data.batch_number, bankservBatchId, settlementCount: settlements.length } });

  return { batch_id: batchId, batch_number: batchLookup.data.batch_number, batch_status: 'confirmed', bankserv_batch_id: bankservBatchId, settlement_count: settlements.length, total_amount: round2(settlements.reduce((sum: number, entry: any) => sum + Number(entry.amount ?? 0), 0)), file_preview: flatFile.split('\n').slice(0, 5), sandbox: true };
}

export async function getSandboxSettlement(batchId: string) {
  const admin = createAdminClient();
  const batch = await admin.from('billing_settlement_batches').select('*').eq('id', batchId).maybeSingle();
  if (batch.error) throw batch.error;
  if (!batch.data) throw new Error('Settlement batch not found.');
  const settlements = await admin.from('billing_settlements').select('*').eq('batch_id', batchId).order('created_at', { ascending: true }).limit(5000);
  if (settlements.error) throw settlements.error;
  return { batch: batch.data, settlements: settlements.data ?? [], sandbox: true };
}

export async function refundSandboxTransaction(reference: string, body: AnyRecord) {
  const admin = createAdminClient();
  const transaction = await fetchTransaction(admin, reference);
  const now = new Date().toISOString();
  const refundAmount = round2(safeNumber(body.amount, safeNumber(transaction.amount)));
  await admin.from('payment_transactions').update({ payment_status: 'failed' }).eq('transaction_reference', reference);

  const isWalletTopup = !transaction.merchant_id && !transaction.voucher_code;
  if (isWalletTopup) {
    await admin.from('wallet_transactions').insert({ customer_id: transaction.customer_id, user_email: null, type: 'adjustment_debit', amount: refundAmount, description: `Sandbox refund ${reference}`, savings: 0 });
  } else if (transaction.voucher_code) {
    await admin.from('customer_vouchers').update({ is_active: false, current_balance: 0 }).eq('customer_id', transaction.customer_id).eq('voucher_code', transaction.voucher_code);
  }

  await recordSandboxEvent(admin, { eventKey: `sandbox-refund:${reference}`, eventType: 'manual_adjustment', merchantId: truthyString(transaction.merchant_id), customerId: truthyString(transaction.customer_id), grossAmount: refundAmount, occurredAt: now, metadata: { transactionType: 'refund', originalReference: reference, reason: truthyString(body.reason) ?? 'sandbox_refund', isWalletTopup } });
  return { ref: reference, status: 'refunded', amount: refundAmount, reversed_at: now, sandbox: true };
}
