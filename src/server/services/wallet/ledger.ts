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
    if (isMissingRelation(res.error, 'public.wallet_transactions')) {
      // Fallback for environments where wallet_transactions migration is not deployed yet.
      // Credits: wallet top-ups are stored as payment transactions with merchant_id + voucher_code null.
      // Debits: wallet-funded voucher purchases are stored with card_brand='WALLET'.
      const paymentsRes = await admin
        .from('payment_transactions')
        .select('amount,merchant_id,voucher_code,card_brand,payment_status')
        .eq('customer_id', customerId);

      if (paymentsRes.error) {
        if (isMissingRelation(paymentsRes.error, 'public.payment_transactions')) return 0;
        throw paymentsRes.error;
      }

      const rows = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      const credits = rows.reduce((sum: number, row: any) => {
        const status = String(row?.payment_status ?? '').toLowerCase();
        if (status && status !== 'completed') return sum;
        const isTopup = !row?.voucher_code && !row?.merchant_id;
        if (!isTopup) return sum;
        const amount = Number(row?.amount ?? 0);
        return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
      }, 0);

      const debits = rows.reduce((sum: number, row: any) => {
        const status = String(row?.payment_status ?? '').toLowerCase();
        if (status && status !== 'completed') return sum;
        const brand = String(row?.card_brand ?? '')
          .toUpperCase()
          .trim();
        if (brand !== 'WALLET') return sum;
        const amount = Number(row?.amount ?? 0);
        return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
      }, 0);

      return Number(Math.max(credits - debits, 0).toFixed(2));
    }
    throw res.error;
  }

  const rows = Array.isArray(res.data) ? res.data : [];
  let balance = 0;
  for (const row of rows) {
    const type = String(row?.type ?? '')
      .toLowerCase()
      .trim();
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
  // Non-fatal: if wallet_transactions table is not deployed, the payment_transactions
  // record with card_brand='WALLET' already serves as the debit record for balance derivation.
  if (res.error && !isMissingRelation(res.error, 'public.wallet_transactions')) {
    console.warn('[recordWalletDebit][non-fatal]', res.error?.message);
  }
}
