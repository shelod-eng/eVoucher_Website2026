export const KALAPENG_MERCHANT_ID = 'm_kalapeng';
export const KALAPENG_MERCHANT_NAME = 'Kalapeng Pharmacy Group';
export const KALAPENG_BRANCH_TARGET = 35;

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function mapPurchaseToBillingEvent(input) {
  const purchase = input || {};
  const transactionRef = String(
    purchase.transactionReference || purchase.transaction_ref || purchase.reference || ''
  ).trim();

  return {
    merchantId: KALAPENG_MERCHANT_ID,
    merchantName: KALAPENG_MERCHANT_NAME,
    transactionReference: transactionRef || `KLP-TXN-${Date.now()}`,
    branchCode: String(purchase.branchCode || purchase.branch_code || '').trim() || null,
    voucherCode: String(purchase.voucherCode || purchase.voucher_code || '').trim() || null,
    faceValue: toNumber(purchase.faceValue || purchase.face_value),
    consumerPrice: toNumber(purchase.consumerPrice || purchase.consumer_price),
    occurredAt: purchase.occurredAt || purchase.created_at || new Date().toISOString(),
  };
}

export function buildKalapengInvoiceRequest({
  periodStart,
  periodEnd,
  purchases = [],
  branchCount = KALAPENG_BRANCH_TARGET,
}) {
  const normalizedPurchases = purchases.map(mapPurchaseToBillingEvent);
  const totalFaceValue = normalizedPurchases.reduce((sum, row) => sum + toNumber(row.faceValue), 0);
  const totalConsumerPrice = normalizedPurchases.reduce(
    (sum, row) => sum + toNumber(row.consumerPrice),
    0
  );

  return {
    merchantId: KALAPENG_MERCHANT_ID,
    merchantName: KALAPENG_MERCHANT_NAME,
    periodStart,
    periodEnd,
    branchCount,
    lineItemCount: normalizedPurchases.length,
    totals: {
      totalFaceValue: Number(totalFaceValue.toFixed(2)),
      totalConsumerPrice: Number(totalConsumerPrice.toFixed(2)),
    },
    metadata: {
      integration: 'kalapeng-enterprise',
      loyaltyProgram: 'kalapeng-client-loyalty-v1',
      source: 'evoucher.co.za',
      branchTarget: branchCount,
    },
    purchases: normalizedPurchases,
  };
}

export function buildKalapengLoyaltyAccrualEvent(input) {
  const payload = input || {};
  const consumerPrice = toNumber(payload.consumerPrice || payload.consumer_price);
  const pointsPerRand = toNumber(payload.pointsPerRand, 1);
  const pointsEarned = Math.max(0, Math.round(consumerPrice * pointsPerRand));

  return {
    merchantId: KALAPENG_MERCHANT_ID,
    consumerId: String(payload.consumerId || payload.customer_id || '').trim(),
    branchCode: String(payload.branchCode || payload.branch_code || '').trim() || null,
    transactionReference: String(payload.transactionReference || payload.transaction_ref || '').trim(),
    pointsEarned,
    accrualRule: {
      pointsPerRand,
      loyaltyProgram: 'kalapeng-client-loyalty-v1',
    },
    occurredAt: payload.occurredAt || payload.created_at || new Date().toISOString(),
  };
}
