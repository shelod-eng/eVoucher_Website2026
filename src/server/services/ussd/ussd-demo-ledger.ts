import { createCipheriv, createHash, randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export type UssdAuditEventType =
  | 'ussd_session_started'
  | 'shop_selected'
  | 'voucher_purchased'
  | 'wallet_updated'
  | 'voucher_redeemed'
  | 'session_closed';

export type DemoShop = {
  id: string;
  displayName: string;
  branchCount: number;
  menuOrder: number;
};

export const USSD_DEMO_SHOPS: DemoShop[] = [
  { id: 'shoprite', displayName: 'Shoprite', branchCount: 560, menuOrder: 1 },
  { id: 'pick-n-pay', displayName: 'Pick n Pay', branchCount: 1200, menuOrder: 2 },
  { id: 'pep', displayName: 'Pep', branchCount: 2200, menuOrder: 3 },
  { id: 'mr-price', displayName: 'Mr Price', branchCount: 1900, menuOrder: 4 },
  { id: 'woolworths', displayName: 'Woolworths', branchCount: 490, menuOrder: 5 },
  { id: 'boxer', displayName: 'Boxer', branchCount: 470, menuOrder: 6 },
  { id: 'checkers', displayName: 'Checkers', branchCount: 1, menuOrder: 7 },
  { id: 'clicks', displayName: 'Clicks', branchCount: 1, menuOrder: 8 },
  { id: 'game', displayName: 'Game', branchCount: 150, menuOrder: 9 },
  { id: 'engen', displayName: 'Engen', branchCount: 1, menuOrder: 10 },
  { id: 'usave', displayName: 'uSave', branchCount: 340, menuOrder: 11 },
  {
    id: 'kalapeng-pharmacy-group',
    displayName: 'Kalapeng Pharmacy Group',
    branchCount: 35,
    menuOrder: 12,
  },
  {
    id: 'super-precast-concrete',
    displayName: 'Super Precast Concrete',
    branchCount: 1,
    menuOrder: 13,
  },
];

type AdminClient = ReturnType<typeof createAdminClient>;

const memoryWallets = new Map<string, number>();
const memoryCases = new Map<string, { id: string; msisdn: string; sessionId: string }>();
const memoryAuditLogs: any[] = [];

function normalizeMsisdn(msisdn: string) {
  const digits = String(msisdn ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('27')) return digits;
  if (digits.startsWith('0')) return `27${digits.slice(1)}`;
  return digits;
}

function getAdminClient(): AdminClient | null {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

function encryptionKey() {
  return createHash('sha256')
    .update(process.env.USSD_DEMO_ENCRYPTION_KEY || 'evoucher-ussd-demo-local-key')
    .digest();
}

function encryptValue(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function last4(value: string) {
  const cleaned = String(value ?? '').replace(/\s/g, '');
  return cleaned.slice(Math.max(0, cleaned.length - 4));
}

function nowCaseId(sessionId: string) {
  const hash = createHash('sha1').update(sessionId).digest('hex').slice(0, 12);
  return `mem-${hash}`;
}

function makeVoucherCode(shopId: string) {
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  const prefix = shopId
    .split('-')
    .map((part) => part[0])
    .join('')
    .slice(0, 4)
    .toUpperCase();
  return `EV-${prefix}-${suffix}`;
}

async function insertAudit(
  admin: AdminClient | null,
  input: {
    eventType: UssdAuditEventType;
    sessionId: string;
    msisdn: string;
    caseId?: string | null;
    shopId?: string | null;
    shopName?: string | null;
    voucherCode?: string | null;
    walletBalance?: number | null;
    payload?: Record<string, unknown>;
  }
) {
  const balance =
    input.walletBalance === null || input.walletBalance === undefined
      ? null
      : Number(input.walletBalance.toFixed(2));
  const encryptedVoucher = input.voucherCode ? encryptValue(input.voucherCode) : null;
  const encryptedBalance = balance === null ? null : encryptValue(balance.toFixed(2));
  const payload = {
    event_type: input.eventType,
    msisdn: normalizeMsisdn(input.msisdn),
    session_id: input.sessionId,
    case_id: input.caseId ?? null,
    shop_id: input.shopId ?? null,
    shop_name: input.shopName ?? null,
    encrypted_voucher_code: encryptedVoucher,
    voucher_code_last4: input.voucherCode ? last4(input.voucherCode) : null,
    encrypted_wallet_balance: encryptedBalance,
    wallet_balance_amount: balance,
    event_payload: input.payload ?? {},
  };

  if (!admin) {
    memoryAuditLogs.push({ ...payload, created_at: new Date().toISOString() });
    return;
  }

  const { error } = await admin.from('evoucher_audit_logs').insert(payload);
  if (error) {
    memoryAuditLogs.push({ ...payload, created_at: new Date().toISOString(), db_error: error.message });
  }
}

export async function getUssdDemoShops(): Promise<DemoShop[]> {
  const admin = getAdminClient();
  if (!admin) return USSD_DEMO_SHOPS;

  const { data, error } = await admin
    .from('evoucher_shops')
    .select('id,display_name,branch_count,menu_order,is_active')
    .eq('is_active', true)
    .order('menu_order', { ascending: true });

  if (error || !data?.length) return USSD_DEMO_SHOPS;

  return data.map((row: any) => ({
    id: String(row.id),
    displayName: String(row.display_name),
    branchCount: Number(row.branch_count ?? 0),
    menuOrder: Number(row.menu_order ?? 0),
  }));
}

export async function getUssdWalletBalance(msisdn: string) {
  const key = normalizeMsisdn(msisdn);
  const admin = getAdminClient();
  if (!admin) return memoryWallets.get(key) ?? 0;

  const { data, error } = await admin
    .from('evoucher_wallets')
    .select('balance_amount')
    .eq('msisdn', key)
    .maybeSingle();

  if (error || !data) return memoryWallets.get(key) ?? 0;
  return Number(data.balance_amount ?? 0);
}

export async function recordUssdSessionStarted(input: {
  sessionId: string;
  msisdn: string;
  serviceCode?: string;
  networkCode?: string;
  provider?: string;
}) {
  const key = normalizeMsisdn(input.msisdn);
  const admin = getAdminClient();
  let caseId: string | null = memoryCases.get(input.sessionId)?.id ?? null;

  if (admin) {
    const { data, error } = await admin
      .from('evoucher_cases')
      .insert({
        session_id: input.sessionId,
        msisdn: key,
        status: 'started',
        metadata: {
          serviceCode: input.serviceCode ?? null,
          networkCode: input.networkCode ?? null,
          provider: input.provider ?? 'simulator',
        },
      })
      .select('id')
      .single();

    if (!error && data?.id) caseId = String(data.id);
  }

  if (!caseId) {
    caseId = nowCaseId(input.sessionId);
  }
  memoryCases.set(input.sessionId, { id: caseId, msisdn: key, sessionId: input.sessionId });

  await insertAudit(admin, {
    eventType: 'ussd_session_started',
    sessionId: input.sessionId,
    msisdn: key,
    caseId,
    payload: {
      serviceCode: input.serviceCode ?? null,
      networkCode: input.networkCode ?? null,
      provider: input.provider ?? 'simulator',
    },
  });

  return { caseId };
}

export async function recordShopSelected(input: {
  sessionId: string;
  msisdn: string;
  shopId: string;
  shopName: string;
}) {
  const key = normalizeMsisdn(input.msisdn);
  const caseId = memoryCases.get(input.sessionId)?.id ?? null;
  const admin = getAdminClient();

  if (admin && caseId && !caseId.startsWith('mem-')) {
    await admin
      .from('evoucher_cases')
      .update({
        status: 'purchase_pending',
        shop_id: input.shopId,
        shop_name: input.shopName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId);
  }

  await insertAudit(admin, {
    eventType: 'shop_selected',
    sessionId: input.sessionId,
    msisdn: key,
    caseId,
    shopId: input.shopId,
    shopName: input.shopName,
  });
}

export async function purchaseUssdVoucher(input: {
  sessionId: string;
  msisdn: string;
  shopId: string;
  shopName: string;
  productName: string;
  amount: number;
}) {
  const key = normalizeMsisdn(input.msisdn);
  const caseId = memoryCases.get(input.sessionId)?.id ?? null;
  const admin = getAdminClient();
  const voucherCode = makeVoucherCode(input.shopId);
  const previousBalance = await getUssdWalletBalance(key);
  const nextBalance = Number((previousBalance + input.amount).toFixed(2));
  const encryptedBalance = encryptValue(nextBalance.toFixed(2));
  const encryptedVoucher = encryptValue(voucherCode);

  memoryWallets.set(key, nextBalance);

  if (admin) {
    await admin.from('evoucher_wallets').upsert({
      msisdn: key,
      encrypted_balance: encryptedBalance,
      balance_amount: nextBalance,
      last_case_id: caseId && !caseId.startsWith('mem-') ? caseId : null,
      updated_at: new Date().toISOString(),
    });

    if (caseId && !caseId.startsWith('mem-')) {
      await admin
        .from('evoucher_cases')
        .update({
          status: 'purchased',
          shop_id: input.shopId,
          shop_name: input.shopName,
          encrypted_voucher_code: encryptedVoucher,
          voucher_code_last4: last4(voucherCode),
          encrypted_wallet_balance: encryptedBalance,
          wallet_balance_amount: nextBalance,
          metadata: { productName: input.productName, amount: input.amount },
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseId);
    }
  }

  await insertAudit(admin, {
    eventType: 'voucher_purchased',
    sessionId: input.sessionId,
    msisdn: key,
    caseId,
    shopId: input.shopId,
    shopName: input.shopName,
    voucherCode,
    walletBalance: nextBalance,
    payload: { productName: input.productName, amount: input.amount },
  });
  await insertAudit(admin, {
    eventType: 'wallet_updated',
    sessionId: input.sessionId,
    msisdn: key,
    caseId,
    shopId: input.shopId,
    shopName: input.shopName,
    voucherCode,
    walletBalance: nextBalance,
    payload: { reason: 'voucher_purchased' },
  });

  return { voucherCode, walletBalance: nextBalance, caseId };
}

export async function redeemUssdVoucher(input: {
  sessionId: string;
  msisdn: string;
  shopId: string;
  shopName: string;
  voucherCode: string;
  amount: number;
}) {
  const key = normalizeMsisdn(input.msisdn);
  const admin = getAdminClient();
  const caseId = memoryCases.get(input.sessionId)?.id ?? null;
  const previousBalance = await getUssdWalletBalance(key);
  const nextBalance = Number(Math.max(0, previousBalance - input.amount).toFixed(2));
  const encryptedBalance = encryptValue(nextBalance.toFixed(2));

  memoryWallets.set(key, nextBalance);

  if (admin) {
    await admin.from('evoucher_wallets').upsert({
      msisdn: key,
      encrypted_balance: encryptedBalance,
      balance_amount: nextBalance,
      last_case_id: caseId && !caseId.startsWith('mem-') ? caseId : null,
      updated_at: new Date().toISOString(),
    });

    if (caseId && !caseId.startsWith('mem-')) {
      await admin
        .from('evoucher_cases')
        .update({
          status: 'redeemed',
          shop_id: input.shopId,
          shop_name: input.shopName,
          encrypted_wallet_balance: encryptedBalance,
          wallet_balance_amount: nextBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseId);
    }
  }

  await insertAudit(admin, {
    eventType: 'voucher_redeemed',
    sessionId: input.sessionId,
    msisdn: key,
    caseId,
    shopId: input.shopId,
    shopName: input.shopName,
    voucherCode: input.voucherCode,
    walletBalance: nextBalance,
    payload: { amount: input.amount },
  });
  await insertAudit(admin, {
    eventType: 'wallet_updated',
    sessionId: input.sessionId,
    msisdn: key,
    caseId,
    shopId: input.shopId,
    shopName: input.shopName,
    voucherCode: input.voucherCode,
    walletBalance: nextBalance,
    payload: { reason: 'voucher_redeemed' },
  });

  return { walletBalance: nextBalance, caseId };
}

export async function recordUssdSessionClosed(input: {
  sessionId: string;
  msisdn: string;
  reason: 'exit' | 'timeout' | 'completed';
}) {
  const key = normalizeMsisdn(input.msisdn);
  const caseId = memoryCases.get(input.sessionId)?.id ?? null;
  const admin = getAdminClient();

  if (admin && caseId && !caseId.startsWith('mem-')) {
    await admin
      .from('evoucher_cases')
      .update({
        status: input.reason === 'timeout' ? 'timeout' : 'closed',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId);
  }

  await insertAudit(admin, {
    eventType: 'session_closed',
    sessionId: input.sessionId,
    msisdn: key,
    caseId,
    payload: { reason: input.reason },
  });
}

export async function listUssdDemoAuditEvidence(limit = 50) {
  const admin = getAdminClient();
  if (!admin) {
    return memoryAuditLogs.slice(-limit).reverse();
  }

  const { data, error } = await admin
    .from('evoucher_audit_logs')
    .select(
      'id,event_type,msisdn,session_id,case_id,shop_name,voucher_code_last4,wallet_balance_amount,event_payload,created_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return memoryAuditLogs.slice(-limit).reverse();
  return data ?? [];
}
