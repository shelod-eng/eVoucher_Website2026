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

const CREDIT_TYPES = new Set(['topup', 'refund', 'adjustment_credit']);
const DEBIT_TYPES = new Set(['wallet_purchase', 'withdrawal', 'adjustment_debit']);

export async function getWalletBalance(admin: any, customerId: string): Promise<number | null> {
  const res = await admin
    .from('wallet_transactions')
    .select('type,amount')
    .eq('customer_id', customerId);

  if (res.error) {
    if (isMissingRelation(res.error, 'public.wallet_transactions')) return null;
    throw res.error;
  }

  const rows = Array.isArray(res.data) ? res.data : [];
  let balance = 0;
  for (const row of rows) {
    const type = String(row?.type ?? '').toLowerCase().trim();
    const amount = Number(row?.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (CREDIT_TYPES.has(type)) {
      balance += amount;
    } else if (DEBIT_TYPES.has(type)) {
      balance -= amount;
    }
  }

  return Number(Math.max(balance, 0).toFixed(2));
}

export async function recordWalletCredit(
  admin: any,
  input: { customerId: string; userEmail?: string | null; amount: number; description: string }
) {
  const res = await admin.from('wallet_transactions').insert({
    customer_id: input.customerId,
    user_email: input.userEmail ?? null,
    type: 'topup',
    amount: Number(input.amount.toFixed(2)),
    description: input.description,
    savings: 0,
  });
  if (res.error && !isMissingRelation(res.error, 'public.wallet_transactions')) {
    throw res.error;
  }
}

export async function recordWalletDebit(
  admin: any,
  input: { customerId: string; userEmail?: string | null; amount: number; description: string }
) {
  const res = await admin.from('wallet_transactions').insert({
    customer_id: input.customerId,
    user_email: input.userEmail ?? null,
    type: 'wallet_purchase',
    amount: Number(input.amount.toFixed(2)),
    description: input.description,
    savings: 0,
  });
  if (res.error && !isMissingRelation(res.error, 'public.wallet_transactions')) {
    throw res.error;
  }
}
