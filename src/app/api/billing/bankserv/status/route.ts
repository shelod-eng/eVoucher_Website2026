import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBankservAdaptorOverview, isBankservAdaptorCompatibilityError } from '@/server/services/bankserv/adaptor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function missingEnv(keys: string[]) {
  return keys.filter((k) => !String(process.env[k] ?? '').trim());
}

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const mode = String(process.env.BILLING_BANKSERV_MODE ?? 'mock').trim().toLowerCase();
    const partner = String(process.env.BILLING_SETTLEMENT_PARTNER ?? 'RMB / FNB CIB / VISA').trim();

    const required = ['FNB_CIB_API_URL', 'FNB_CIB_API_KEY', 'FNB_CIB_CLIENT_ID', 'FNB_SPONSOR_ACCOUNT'];
    const missing = mode === 'real' ? missingEnv(required) : [];

    let adaptorSummary = null;
    try {
      const admin = createAdminClient();
      const overview = await getBankservAdaptorOverview(admin);
      adaptorSummary = {
        summary: overview.summary,
        rails: overview.rails,
        recentBatchCount: overview.recentBatches.length,
      };
    } catch (error: any) {
      if (!isBankservAdaptorCompatibilityError(error)) {
        throw error;
      }
    }

    return jsonNoStore({
      success: true,
      data: {
        mode,
        partner,
        connected: mode !== 'real' ? false : missing.length === 0,
        missingEnv: missing,
        note:
          mode === 'real'
            ? missing.length === 0
              ? 'Real mode enabled and required env vars present.'
              : 'Real mode enabled but env vars are missing.'
            : 'Mock mode enabled (no bank submission).',
        cutOffs: {
          EFT: '14:00 SAST',
          CARD: '23:59 SAST',
          RTC: '23:59 SAST',
          NAEDO: '10:00 SAST',
          SAMOS: '17:00 SAST',
        },
        adaptorSummary,
      },
    });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to load BankServ status.' },
      { status: 500 }
    );
  }
}

