import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import { ensureCompletedPurchaseArtifacts } from '@/server/services/billing/purchase-completion';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import { generateSecureVoucherCode, generateTransactionReference } from '@/server/utils/security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SimulatorAction = 'purchase' | 'webhook' | 'failure' | 'settlement';

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isMissingSchemaField(error: any, fieldName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const field = fieldName.toLowerCase();
  return (
    message.includes(`column "${field}" does not exist`) ||
    message.includes(`could not find the '${field}' column`) ||
    message.includes('schema cache')
  );
}

function portalHeaders(request: Request, role: string | null) {
  const headers = new Headers();
  const userHeader = request.headers.get('x-portal-user');
  const roleHeader = request.headers.get('x-portal-role');
  const passcode = request.headers.get('x-portal-passcode');
  if (userHeader) headers.set('x-portal-user', userHeader);
  if (roleHeader) headers.set('x-portal-role', roleHeader);
  else if (role) headers.set('x-portal-role', role);
  if (passcode) headers.set('x-portal-passcode', passcode);
  headers.set('content-type', 'application/json');
  return headers;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function callInternalJson(
  request: Request,
  path: string,
  init: { method?: string; body?: unknown },
  role: string | null
) {
  const response = await fetch(new URL(path, request.url), {
    method: init.method ?? 'GET',
    headers: portalHeaders(request, role),
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(
      String(
        (data as { error?: string } | null)?.error ??
          (data as { raw?: string } | null)?.raw ??
          `Request failed (${response.status})`
      )
    );
  }
  return data;
}

async function resolveMerchant(admin: ReturnType<typeof createAdminClient>, merchantId?: string) {
  let query = admin
    .from('merchants')
    .select('id,business_name,parent_brand,status')
    .in('status', ['approved', 'active'])
    .order('business_name', { ascending: true })
    .limit(1);

  if (merchantId) {
    query = admin
      .from('merchants')
      .select('id,business_name,parent_brand,status')
      .eq('id', merchantId)
      .limit(1);
  }

  const { data, error } = await query;
  if (error) throw error;
  const merchant = Array.isArray(data) ? data[0] : null;
  if (!merchant) throw new Error('No active merchant found for simulation.');
  return merchant;
}

async function resolveCustomerId(
  admin: ReturnType<typeof createAdminClient>,
  preferredCustomerId?: string
) {
  if (preferredCustomerId) return preferredCustomerId;

  const paymentLookup = await admin
    .from('payment_transactions')
    .select('customer_id')
    .not('customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);
  if (!paymentLookup.error && paymentLookup.data?.[0]?.customer_id) {
    return String(paymentLookup.data[0].customer_id);
  }

  const voucherLookup = await admin
    .from('customer_vouchers')
    .select('customer_id')
    .not('customer_id', 'is', null)
    .order('issued_at', { ascending: false })
    .limit(1);
  if (!voucherLookup.error && voucherLookup.data?.[0]?.customer_id) {
    return String(voucherLookup.data[0].customer_id);
  }

  throw new Error('No customer records found. Create or sign in a consumer account first.');
}

async function simulatePurchase(
  request: Request,
  role: string | null,
  body: Record<string, unknown>
) {
  const admin = createAdminClient();
  const merchant = await resolveMerchant(admin, String(body.merchantId ?? '').trim() || undefined);
  const customerId = await resolveCustomerId(
    admin,
    String(body.customerId ?? '').trim() || undefined
  );

  const faceValue = safeNumber(body.faceValue, 100);
  const totalDiscountPct = safeNumber(body.totalDiscountPct, DEFAULT_TOTAL_DISCOUNT_PCT);
  const pricing = calculateDiscountPricing(faceValue, totalDiscountPct);
  const paymentMethod = String(body.paymentMethod ?? 'eft')
    .trim()
    .toLowerCase();
  const accessChannel = String(body.accessChannel ?? 'web')
    .trim()
    .toLowerCase();
  const transactionReference =
    String(body.transactionReference ?? '').trim() || generateTransactionReference('SIM');

  const requestedStatus = String(body.paymentStatus ?? '')
    .trim()
    .toLowerCase();
  const paymentStatus =
    requestedStatus === 'completed' || requestedStatus === 'failed' || requestedStatus === 'pending'
      ? requestedStatus
      : paymentMethod === 'eft'
        ? 'pending'
        : 'completed';

  const voucherCode = paymentStatus === 'completed' ? generateSecureVoucherCode('SIM') : null;
  const now = new Date().toISOString();

  const txPayload = {
    customer_id: customerId,
    merchant_id: merchant.id,
    product_id: null,
    amount: pricing.consumerPrice,
    payment_method: paymentMethod,
    access_channel: accessChannel,
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
    card_last_four: '4242',
    card_brand: paymentMethod.toUpperCase(),
    payment_status: paymentStatus,
    voucher_code: voucherCode,
    transaction_reference: transactionReference,
  };

  let { error: insertError } = await admin.from('payment_transactions').insert(txPayload);
  if (
    insertError &&
    (isMissingSchemaField(insertError, 'payment_method') ||
      isMissingSchemaField(insertError, 'access_channel'))
  ) {
    const {
      payment_method: _paymentMethod,
      access_channel: _accessChannel,
      ...legacyPayload
    } = txPayload as any;
    const legacyInsert = await admin.from('payment_transactions').insert(legacyPayload);
    insertError = legacyInsert.error;
  }
  if (insertError) throw insertError;

  let purchaseArtifacts: Awaited<ReturnType<typeof ensureCompletedPurchaseArtifacts>> | null = null;
  if (paymentStatus === 'completed') {
    purchaseArtifacts = await ensureCompletedPurchaseArtifacts(admin, {
      merchant: {
        id: String(merchant.id),
        business_name: String(merchant.business_name),
        parent_brand: merchant.parent_brand ?? merchant.business_name,
      },
      transaction: {
        customer_id: customerId,
        merchant_id: String(merchant.id),
        product_id: null,
        transaction_reference: transactionReference,
        voucher_code: voucherCode,
        face_value: pricing.faceValue,
        total_discount_pct: pricing.totalDiscountPct,
        consumer_price: pricing.consumerPrice,
        amount: pricing.consumerPrice,
      },
      occurredAt: now,
      metadata: {
        source: 'billing_simulator_purchase',
        paymentMethod,
        accessChannel,
      },
    });
  }

  return jsonNoStore({
    success: true,
    data: {
      action: 'purchase',
      transactionReference,
      paymentStatus,
      merchantId: merchant.id,
      customerId,
      pricing,
      checkoutUrl:
        paymentStatus === 'pending'
          ? `https://payments.local/checkout/${encodeURIComponent(transactionReference)}`
          : null,
      voucherCode: purchaseArtifacts?.voucherCode ?? voucherCode,
      nextSuggestedAction:
        paymentStatus === 'pending' ? 'webhook' : paymentStatus === 'failed' ? null : 'settlement',
    },
  });
}

async function simulateWebhookLikeEvent(
  request: Request,
  role: string | null,
  body: Record<string, unknown>,
  forcedStatus?: 'failed'
) {
  const transactionReference = String(body.transactionReference ?? '').trim();
  if (!transactionReference) {
    return jsonNoStore({ error: 'transactionReference is required.' }, { status: 400 });
  }

  const status =
    forcedStatus ??
    String(body.status ?? 'completed')
      .trim()
      .toLowerCase();
  const secret = String(process.env.PAYMENTS_WEBHOOK_SECRET ?? '').trim();
  if (!secret) {
    return jsonNoStore(
      { error: 'Missing PAYMENTS_WEBHOOK_SECRET for webhook simulation.' },
      { status: 500 }
    );
  }

  const payload = {
    eventId: generateTransactionReference('EVT'),
    transactionReference,
    status,
    settledAmount: safeNumber(body.settledAmount, safeNumber(body.amount, 0)),
  };
  const payloadText = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadText}`)
    .digest('hex');

  const response = await fetch(new URL('/api/v1/payments/webhook', request.url), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-signature': signature,
      'x-webhook-timestamp': timestamp,
      'x-payment-provider': 'simulator',
    },
    body: payloadText,
  });
  const data = await readJson(response);
  if (!response.ok) {
    return jsonNoStore(
      { error: String((data as { error?: string } | null)?.error ?? 'Webhook simulation failed.') },
      { status: response.status }
    );
  }

  return jsonNoStore({
    success: true,
    data: {
      action: forcedStatus === 'failed' ? 'failure' : 'webhook',
      transactionReference,
      webhook: data,
    },
  });
}

async function simulateSettlementCycle(
  request: Request,
  role: string | null,
  body: Record<string, unknown>
) {
  const admin = createAdminClient();
  const merchant = await resolveMerchant(admin, String(body.merchantId ?? '').trim() || undefined);

  const { data: events, error: eventsError } = await admin
    .from('billing_events')
    .select('occurred_at')
    .eq('merchant_id', merchant.id)
    .is('invoice_id', null)
    .order('occurred_at', { ascending: true })
    .limit(5000);
  if (eventsError) throw eventsError;
  if (!events || events.length === 0) {
    return jsonNoStore(
      { error: 'No uninvoiced billing events found for settlement simulation.' },
      { status: 422 }
    );
  }

  const periodStart =
    String(body.periodStart ?? '').trim() || String(events[0]?.occurred_at ?? '').slice(0, 10);
  const periodEnd =
    String(body.periodEnd ?? '').trim() ||
    String(events[events.length - 1]?.occurred_at ?? '').slice(0, 10);

  const invoice = await callInternalJson(
    request,
    '/api/billing/invoices',
    {
      method: 'POST',
      body: {
        merchantId: merchant.id,
        merchantName: merchant.business_name,
        periodStart,
        periodEnd,
      },
    },
    role
  );

  const engine = await callInternalJson(
    request,
    '/api/billing/run-engine',
    { method: 'POST', body: {} },
    role
  );

  const batchId = String((engine as { data?: { batchId?: string } })?.data?.batchId ?? '').trim();
  if (!batchId) {
    return jsonNoStore({
      success: true,
      data: {
        action: 'settlement',
        invoice,
        engine,
        note: 'Engine completed but did not create a settlement batch.',
      },
    });
  }

  const autoProgress = body.autoProgress !== false;
  let exported: unknown = null;
  if (autoProgress) {
    await callInternalJson(
      request,
      `/api/billing/settlement-batches/${batchId}/approve`,
      { method: 'POST', body: {} },
      role
    );
    exported = await fetch(
      new URL(`/api/billing/settlement-batches/${batchId}/export`, request.url),
      {
        method: 'POST',
        headers: portalHeaders(request, role),
      }
    );
    await callInternalJson(
      request,
      `/api/billing/settlement-batches/${batchId}/submit`,
      { method: 'POST', body: {} },
      role
    );
    await callInternalJson(
      request,
      `/api/billing/settlement-batches/${batchId}/confirm`,
      { method: 'POST', body: {} },
      role
    );
  }

  const batch = await callInternalJson(
    request,
    `/api/billing/settlement-batches/${batchId}`,
    { method: 'GET' },
    role
  );

  return jsonNoStore({
    success: true,
    data: {
      action: 'settlement',
      merchantId: merchant.id,
      invoice,
      engine,
      batch,
      exportStatus:
        exported && exported instanceof Response
          ? { ok: exported.ok, status: exported.status }
          : null,
    },
  });
}

export async function POST(request: Request) {
  const { allowed, role } = await requirePortalUser(request, ['admin', 'finance_approver']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action ?? 'purchase')
      .trim()
      .toLowerCase() as SimulatorAction;

    if (action === 'purchase') return await simulatePurchase(request, role, body);
    if (action === 'webhook') return await simulateWebhookLikeEvent(request, role, body);
    if (action === 'failure') {
      return await simulateWebhookLikeEvent(request, role, body, 'failed');
    }
    if (action === 'settlement') return await simulateSettlementCycle(request, role, body);

    return jsonNoStore(
      { error: 'Unsupported simulator action. Use purchase, webhook, failure, or settlement.' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Simulator request failed.' },
      { status: 500 }
    );
  }
}
