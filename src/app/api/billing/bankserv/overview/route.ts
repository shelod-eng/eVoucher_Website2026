import { createAdminClient } from '@/lib/supabase/admin';
import { getBankservAdaptorOverview, isBankservAdaptorCompatibilityError } from '@/server/services/bankserv/adaptor';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const admin = createAdminClient();
    const overview = await getBankservAdaptorOverview(admin);

    return jsonNoStore({
      success: true,
      data: {
        cutOffs: {
          EFT: '14:00 SAST',
          CARD: '23:59 SAST',
          RTC: '23:59 SAST',
          NAEDO: '10:00 SAST',
          SAMOS: '17:00 SAST',
        },
        ...overview,
      },
    });
  } catch (error: any) {
    if (isBankservAdaptorCompatibilityError(error)) {
      return jsonNoStore(
        {
          success: true,
          warning: 'BankServ adaptor schema is not deployed yet.',
          code: 'bankserv_adaptor_schema_missing',
          data: null,
        },
        { status: 200 }
      );
    }

    return jsonNoStore(
      { error: error?.message || 'Failed to load BankServ adaptor overview.' },
      { status: 500 }
    );
  }
}
