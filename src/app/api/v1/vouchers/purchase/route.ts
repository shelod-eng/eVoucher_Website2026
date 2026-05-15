import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PurchaseVoucherRequest } from '@/types/domain';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { createPaymentProvider } from '@/server/services/payment/payment-provider-factory';
import { DefaultVoucherService } from '@/server/services/voucher/default-voucher-service';
import { writeAuditEvent } from '@/server/utils/audit';
import { generateSecureVoucherCode, generateTransactionReference } from '@/server/utils/security';
import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { resolveBrandFromMerchantName, getBrandByKey } from '@/lib/merchant-brand-catalog';
import { getWalletBalance, recordWalletDebit } from '@/server/services/wallet/ledger';

const SUPPORTED_PAYMENT_METHODS = new Set([
  'visa_secure',
  'debit_credit',
  'payfast',
  'eft',
  'wallet',
]);

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`could not find the table '${relation}' in the schema cache`)
  );
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

function validate(body: PurchaseVoucherRequest): string | null {
  if (!body.merchantId?.trim()) return 'Merchant is required.';
  if (body.faceValue !== undefined && (!Number.isFinite(body.faceValue) || body.faceValue <= 0)) {
    return 'Face value must be > 0.';
  }
  if (body.faceValue !== undefined && body.faceValue > 10000)
    return 'Face value exceeds the allowed limit.';
  if (!body.productId && body.faceValue === undefined)
    return 'Either product or face value is required.';
  if (!body.paymentMethod) return 'Payment method is required.';
  if (!SUPPORTED_PAYMENT_METHODS.has(body.paymentMethod))
    return 'Unsupported payment method selected.';
  if (body.paymentMethod === 'payfast') {
    if (!String(body.payfastEmail ?? '').includes('@')) return 'PayFast email is required.';
  }
  if (body.paymentMethod === 'eft') {
    if (!String(body.eftReference ?? '').trim()) return 'EFT reference is required.';
    if (!String(body.eftProofName ?? '').trim()) return 'EFT proof of payment is required.';
  }
  if (body.paymentMethod === 'visa_secure' || body.paymentMethod === 'debit_credit') {
    if (!String(body.billingAddress ?? '').trim())
      return 'Billing address is required for card payments.';
    const lastFour = String(body.cardLastFour ?? '').trim();
    if (lastFour && !/^\d{4}$/.test(lastFour)) return 'Card last four must be 4 digits.';
  }
  return null;
}

function isMissingAdminEnvError(error: any) {
  return String(error?.message ?? '').includes(
    'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL'
  );
}

function buildQrCodeUrl(voucherCode: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(voucherCode)}`;
}

function normalizeBrandLabel(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

async function sendPurchaseReceiptEmail(payload: {
  to: string;
  merchantName: string;
  voucherCode: string;
  faceValue: number;
  amountPaid: number;
  savings: number;
  expiry: string | null;
  paymentMethod: string;
}) {
  const resendApiKey = String(process.env.RESEND_API_KEY ?? '').trim();
  const fromAddress = String(
    process.env.RESEND_FROM ?? 'eVoucher Receipts <receipts@evoucher.co.za>'
  ).trim();
  const subject = `eVoucher purchase receipt - ${payload.merchantName}`;
  const text = [
    'eVoucher Purchase Receipt',
    '',
    `Merchant: ${payload.merchantName}`,
    `Voucher Code: ${payload.voucherCode}`,
    `Face Value: R${payload.faceValue.toFixed(2)}`,
    `Amount Paid: R${payload.amountPaid.toFixed(2)}`,
    `Savings: R${payload.savings.toFixed(2)}`,
    `Expiry: ${payload.expiry ?? 'N/A'}`,
    `Payment Method: ${payload.paymentMethod}`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin-bottom:10px;">Purchase Receipt</h2>
      <p>Your voucher purchase completed successfully.</p>
      <table style="border-collapse:collapse;width:100%;max-width:680px;">
        <tr><td style="padding:8px;border:1px solid #dbe3ec;font-weight:600;">Merchant</td><td style="padding:8px;border:1px solid #dbe3ec;">${payload.merchantName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #dbe3ec;font-weight:600;">Voucher Code</td><td style="padding:8px;border:1px solid #dbe3ec;">${payload.voucherCode}</td></tr>
        <tr><td style="padding:8px;border:1px solid #dbe3ec;font-weight:600;">Face Value</td><td style="padding:8px;border:1px solid #dbe3ec;">R${payload.faceValue.toFixed(2)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #dbe3ec;font-weight:600;">Amount Paid</td><td style="padding:8px;border:1px solid #dbe3ec;">R${payload.amountPaid.toFixed(2)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #dbe3ec;font-weight:600;">Savings</td><td style="padding:8px;border:1px solid #dbe3ec;">R${payload.savings.toFixed(2)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #dbe3ec;font-weight:600;">Expiry</td><td style="padding:8px;border:1px solid #dbe3ec;">${payload.expiry ?? 'N/A'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #dbe3ec;font-weight:600;">Payment Method</td><td style="padding:8px;border:1px solid #dbe3ec;">${payload.paymentMethod}</td></tr>
      </table>
    </div>
  `.trim();

  try {
    if (!resendApiKey) {
      console.info('[purchase-receipt][console-fallback]', { to: payload.to, subject, text });
      return;
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [payload.to],
        subject,
        text,
        html,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error('[purchase-receipt][resend-error]', response.status, body);
    }
  } catch (error: any) {
    console.error('[purchase-receipt][send-failed]', error?.message || error);
  }
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in to view payment status.', code: 'unauthenticated' },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        {
          error: 'Only signed-in consumers can view voucher purchase status.',
          code: 'consumer_only_purchase',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionReference = searchParams.get('transactionReference');
    if (!transactionReference) {
      return NextResponse.json(
        { error: 'transactionReference is required.', code: 'missing_reference' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: transaction, error } = await admin
      .from('payment_transactions')
      .select('transaction_reference,payment_status,voucher_code')
      .eq('transaction_reference', transactionReference)
      .eq('customer_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found for this account.', code: 'transaction_not_found' },
        { status: 404 }
      );
    }

    const status = String(transaction.payment_status || 'pending').toLowerCase();
    let issuedVouchers: Array<{ code: string; faceValue: number; expiresAt?: string | null }> = [];
    if (transaction.voucher_code) {
      const { data: voucherRow } = await admin
        .from('customer_vouchers')
        .select('voucher_code,face_value,expires_at')
        .eq('voucher_code', transaction.voucher_code)
        .eq('customer_id', user.id)
        .maybeSingle();
      if (voucherRow) {
        issuedVouchers = [
          {
            code: String(voucherRow.voucher_code),
            faceValue: Number(voucherRow.face_value ?? 0),
            expiresAt: voucherRow.expires_at ?? null,
          },
        ];
      }
    }

    return NextResponse.json({
      transactionReference: transaction.transaction_reference,
      status,
      voucherCode: transaction.voucher_code ?? null,
      issuedVouchers,
      checkoutUrl:
        status === 'pending'
          ? `https://payments.local/checkout/${encodeURIComponent(transaction.transaction_reference)}`
          : null,
    });
  } catch (error: any) {
    if (isMissingAdminEnvError(error)) {
      return NextResponse.json(
        {
          error:
            'Server is missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. Add them to run purchases.',
          code: 'missing_admin_env',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'Failed to fetch purchase status.',
        code: 'purchase_status_failed',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in to buy vouchers.', code: 'unauthenticated' },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        {
          error: 'Only signed-in consumers can buy vouchers.',
          code: 'consumer_only_purchase',
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as PurchaseVoucherRequest;
    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: 'invalid_purchase_input' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const paymentProvider = createPaymentProvider('production');
    const voucherService = new DefaultVoucherService();
    const transactionReference = generateTransactionReference();
    const accessChannel = String((body as any).accessChannel ?? 'web')
      .trim()
      .toLowerCase();

    const { data: merchant, error: merchantError } = await admin
      .from('merchants')
      .select(
        'id,business_name,status,default_total_discount_pct,parent_brand,branch_name,branch_code,city,province'
      )
      .eq('id', body.merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not available.', code: 'merchant_not_available' },
        { status: 404 }
      );
    }

    let productId: string | null = null;
    let productParentBrand: string | null = null;
    let productRedemptionScope: 'all_branches' | 'specific_branch' | 'province_wide' | 'national' =
      'all_branches';
    let productValidProvinces: string[] = [];
    let productValidBranchIds: string[] = [];
    let selectedBranchContext:
      | {
          id: string;
          business_name: string;
          parent_brand: string | null;
          branch_name: string | null;
          city: string | null;
          province: string | null;
        }
      | null = null;
    let pricing: ReturnType<typeof calculateDiscountPricing>;

    if (body.productId) {
      const { data: product, error: productError } = await admin
        .from('merchant_products')
        .select(
          'id,merchant_id,face_value,total_discount_pct,consumer_benefit_pct,evoucher_benefit_pct,total_discount_amount,consumer_benefit_amount,evoucher_benefit_amount,consumer_price,merchant_receivable_after_total_discount,merchant_receivable_after_evoucher_benefit,parent_brand,redemption_scope,valid_provinces,valid_branch_ids,is_active'
        )
        .eq('id', body.productId)
        .eq('merchant_id', merchant.id)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Selected product is not available.', code: 'product_not_available' },
          { status: 404 }
        );
      }

      productId = product.id;
      productParentBrand =
        String(product.parent_brand ?? '').trim() ||
        String(merchant.parent_brand ?? '').trim() ||
        null;
      const scope = String(product.redemption_scope ?? '')
        .trim()
        .toLowerCase();
      if (
        scope === 'all_branches' ||
        scope === 'specific_branch' ||
        scope === 'province_wide' ||
        scope === 'national'
      ) {
        productRedemptionScope = scope;
      }
      productValidProvinces = Array.isArray(product.valid_provinces)
        ? product.valid_provinces.map((province: unknown) => String(province))
        : [];
      productValidBranchIds = Array.isArray(product.valid_branch_ids)
        ? product.valid_branch_ids.map((branchId: unknown) => String(branchId))
        : [];

      pricing = calculateDiscountPricing(
        Number(product.face_value),
        Number(
          product.total_discount_pct ??
            merchant.default_total_discount_pct ??
            DEFAULT_TOTAL_DISCOUNT_PCT
        )
      );
    } else {
      if (body.faceValue === undefined) {
        return NextResponse.json(
          {
            error: 'Face value is required when no product is selected.',
            code: 'missing_face_value',
          },
          { status: 400 }
        );
      }
      pricing = calculateDiscountPricing(
        body.faceValue,
        Number(merchant.default_total_discount_pct ?? DEFAULT_TOTAL_DISCOUNT_PCT)
      );
    }

    const payment = await paymentProvider.createPayment({
      amount: pricing.consumerPrice,
      paymentMethod: body.paymentMethod,
      reference: transactionReference,
    });
    const devForceSuccess = process.env.NODE_ENV === 'development';
    const paymentStatus = devForceSuccess ? 'completed' : payment.status;
    const checkoutUrl = devForceSuccess ? null : (payment.checkoutUrl ?? null);

    let voucherCode: string | null = null;
    if (paymentStatus === 'completed') {
      voucherCode = generateSecureVoucherCode();
    }

    const mappedBrand = resolveBrandFromMerchantName(merchant.business_name);
    const mappedBrandDisplayName = mappedBrand ? getBrandByKey(mappedBrand)?.displayName : null;
    const resolvedParentBrand =
      productParentBrand ||
      String(merchant.parent_brand ?? '').trim() ||
      mappedBrandDisplayName ||
      merchant.business_name;

    if (body.selectedBranchId) {
      const { data: selectedBranch, error: selectedBranchError } = await admin
        .from('merchants')
        .select('id,business_name,parent_brand,branch_name,city,province,status')
        .eq('id', body.selectedBranchId)
        .in('status', ['approved', 'active'])
        .maybeSingle();

      if (selectedBranchError || !selectedBranch) {
        return NextResponse.json(
          { error: 'Selected branch is not available.', code: 'branch_not_available' },
          { status: 404 }
        );
      }

      const selectedBranchBrand =
        normalizeBrandLabel(selectedBranch.parent_brand) ||
        normalizeBrandLabel(selectedBranch.business_name);
      const requestedBrand = normalizeBrandLabel(resolvedParentBrand || merchant.business_name);
      const resolvedBrand = normalizeBrandLabel(resolvedParentBrand || merchant.business_name);

      if (
        selectedBranchBrand &&
        requestedBrand &&
        selectedBranchBrand !== requestedBrand &&
        selectedBranchBrand !== resolvedBrand
      ) {
        return NextResponse.json(
          {
            error: 'Selected branch does not belong to the requested merchant network.',
            code: 'branch_brand_mismatch',
          },
          { status: 409 }
        );
      }

      if (
        productRedemptionScope === 'specific_branch' &&
        productValidBranchIds.length > 0 &&
        !productValidBranchIds.includes(String(selectedBranch.id))
      ) {
        return NextResponse.json(
          {
            error: 'Selected branch is not allowed for this product.',
            code: 'branch_not_allowed_for_product',
          },
          { status: 409 }
        );
      }

      selectedBranchContext = {
        id: String(selectedBranch.id),
        business_name: String(selectedBranch.business_name ?? ''),
        parent_brand: selectedBranch.parent_brand ?? null,
        branch_name: selectedBranch.branch_name ?? null,
        city: selectedBranch.city ?? null,
        province: selectedBranch.province ?? null,
      };

      // Consumer branch choice should pin redemption to that chosen branch.
      productRedemptionScope = 'specific_branch';
      productValidBranchIds = [selectedBranchContext.id];
    }

    if (productRedemptionScope === 'specific_branch' && productValidBranchIds.length === 0) {
      productValidBranchIds = [String(merchant.id)];
    }

    if (body.paymentMethod === 'wallet') {
      let walletBalance = await getWalletBalance(admin, user.id);
      if (walletBalance === null) {
        // Backward-compatible fallback when wallet ledger table is not deployed yet.
        const { data: walletVoucherRows, error: walletBalanceError } = await admin
          .from('customer_vouchers')
          .select('current_balance,is_active')
          .eq('customer_id', user.id);
        if (walletBalanceError) throw walletBalanceError;
        walletBalance = (walletVoucherRows ?? []).reduce((sum: number, voucher: any) => {
          const balance = Number(voucher.current_balance ?? 0);
          return voucher.is_active && Number.isFinite(balance) ? sum + balance : sum;
        }, 0);
      }
      if (pricing.consumerPrice > walletBalance) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance.', code: 'insufficient_wallet_balance' },
          { status: 400 }
        );
      }
    }

    const cardBrand =
      body.paymentMethod === 'visa_secure'
        ? 'VISA'
        : body.paymentMethod === 'debit_credit'
          ? String(body.cardBrand ?? 'CARD').slice(0, 20)
          : body.paymentMethod.toUpperCase();
    const cardLastFour =
      body.paymentMethod === 'visa_secure' || body.paymentMethod === 'debit_credit'
        ? String(body.cardLastFour ?? '0000')
            .slice(-4)
            .padStart(4, '0')
        : '0000';

    const transactionInsertPayload = {
      customer_id: user.id,
      merchant_id: merchant.id,
      product_id: productId,
      amount: pricing.consumerPrice,
      payment_method: body.paymentMethod,
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
      card_last_four: cardLastFour,
      card_brand: cardBrand,
      payment_status: paymentStatus,
      voucher_code: voucherCode,
      transaction_reference: transactionReference,
    };

    let { error: transactionError } = await admin
      .from('payment_transactions')
      .insert(transactionInsertPayload);

    if (
      transactionError &&
      (isMissingSchemaField(transactionError, 'payment_method') ||
        isMissingSchemaField(transactionError, 'access_channel'))
    ) {
      const { payment_method: _paymentMethod, access_channel: _accessChannel, ...legacyPayload } =
        transactionInsertPayload as any;
      const legacyInsert = await admin.from('payment_transactions').insert(legacyPayload);
      transactionError = legacyInsert.error;
    }

    if (transactionError) throw transactionError;

    if (paymentStatus === 'completed' && body.paymentMethod === 'wallet') {
      await recordWalletDebit(admin, {
        customerId: user.id,
        userEmail: user.email ?? null,
        amount: pricing.consumerPrice,
        description: `Wallet debit for voucher purchase ${transactionReference}`,
      });
    }

    let issuedVouchers: Array<{ code: string; faceValue: number; expiresAt?: string | null }> = [];
    if (paymentStatus === 'completed' && voucherCode) {
      const issued = await voucherService.issueVoucher({
        customerId: user.id,
        merchantId: merchant.id,
        productId: productId ?? undefined,
        merchantName: merchant.business_name,
        parentBrand: resolvedParentBrand,
        redemptionScope: productRedemptionScope,
        validProvinces: productValidProvinces,
        validBranchIds: productValidBranchIds,
        qrCodeUrl: buildQrCodeUrl(voucherCode),
        faceValue: pricing.faceValue,
        discountPercent: pricing.consumerBenefitPct,
        pricing,
        voucherCode,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const { data: voucherRow } = await admin
        .from('customer_vouchers')
        .select('voucher_code,face_value,expires_at')
        .eq('id', issued.voucherId)
        .maybeSingle();

      if (voucherRow) {
        issuedVouchers = [
          {
            code: String(voucherRow.voucher_code),
            faceValue: Number(voucherRow.face_value ?? pricing.faceValue),
            expiresAt: voucherRow.expires_at ?? null,
          },
        ];
      } else {
        issuedVouchers = [{ code: voucherCode, faceValue: pricing.faceValue, expiresAt: null }];
      }

      const receiptEmail = String(body.payfastEmail ?? user.email ?? '').trim();
      if (receiptEmail) {
        await sendPurchaseReceiptEmail({
          to: receiptEmail,
          merchantName: String(merchant.business_name),
          voucherCode,
          faceValue: pricing.faceValue,
          amountPaid: pricing.consumerPrice,
          savings: pricing.consumerBenefitAmount,
          expiry: issuedVouchers[0]?.expiresAt ?? null,
          paymentMethod: body.paymentMethod,
        });
      }

    }

    await writeAuditEvent(admin, {
      actorId: user.id,
      actorRole: 'customer',
      entityType: 'payment_transaction',
      entityId: transactionReference,
      action:
        paymentStatus === 'completed' ? 'voucher_purchase_completed' : 'voucher_purchase_pending',
      metadata: {
        merchantId: merchant.id,
        selectedBranchId: selectedBranchContext?.id ?? null,
        selectedBranchName:
          selectedBranchContext?.branch_name ??
          selectedBranchContext?.business_name ??
          body.selectedBranchName ??
          null,
        selectedBranchCity: selectedBranchContext?.city ?? body.selectedBranchCity ?? null,
        selectedBranchProvince:
          selectedBranchContext?.province ?? body.selectedBranchProvince ?? null,
        faceValue: pricing.faceValue,
        consumerPrice: pricing.consumerPrice,
        totalDiscountPct: pricing.totalDiscountPct,
        consumerBenefitPct: pricing.consumerBenefitPct,
        evoucherBenefitPct: pricing.evoucherBenefitPct,
        paymentMethod: body.paymentMethod,
        accessChannel,
        voucherCode,
        issuedVouchers,
      },
      requestId: transactionReference,
    });

    return NextResponse.json({
      transactionReference,
      status: paymentStatus,
      checkoutUrl,
      voucherCode,
      issuedVouchers,
      pricing,
    });
  } catch (error: any) {
    return NextResponse.json(
      isMissingAdminEnvError(error)
        ? {
            error:
              'Server is missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. Add them to run purchases.',
            code: 'missing_admin_env',
          }
        : {
            error: error?.message || 'Failed to process voucher purchase.',
            code: 'purchase_failed',
          },
      { status: 500 }
    );
  }
}
