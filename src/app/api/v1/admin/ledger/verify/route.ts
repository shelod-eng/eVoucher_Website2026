import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import {
  recordLedgerVerificationCheck,
  verifyLedgerSplit,
} from '@/server/services/billing/ledger-verification';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function readAmount(searchParams: URLSearchParams, key: string) {
  const raw = searchParams.get(key);
  if (raw === null || raw === '') return undefined;
  return Number(raw);
}

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const faceValue = readAmount(searchParams, 'faceValue') ?? 1000;

  try {
    const result = verifyLedgerSplit({
      faceValue,
      merchantPayout: readAmount(searchParams, 'merchantPayout'),
      consumerBenefit: readAmount(searchParams, 'consumerBenefit'),
      platformRevenue: readAmount(searchParams, 'platformRevenue'),
      bankFee: readAmount(searchParams, 'bankFee'),
      tolerance: readAmount(searchParams, 'tolerance'),
    });

    return jsonNoStore({ success: true, data: result });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to verify ledger split.' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const { allowed, user } = await requirePortalUser(request, ['admin', 'finance_approver']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const admin = createAdminClient();
    const data = await recordLedgerVerificationCheck(admin, {
      faceValue: Number(body?.faceValue),
      merchantPayout: body?.merchantPayout,
      consumerBenefit: body?.consumerBenefit,
      platformRevenue: body?.platformRevenue,
      bankFee: body?.bankFee,
      tolerance: body?.tolerance,
      checkType: body?.checkType,
      notes: body?.notes,
      checkedBy: user?.id ?? null,
    });

    return jsonNoStore({ success: true, data });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to record ledger verification.' },
      { status: 400 }
    );
  }
}
