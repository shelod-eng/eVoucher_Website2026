import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';
import { processAllDueAckNckRecords } from '@/server/services/bankserv/ack-nck-retry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  const { allowed } = await requirePortalUser(request, ['admin']);
  if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403 });

  try {
    const admin = createAdminClient();
    const summary = await processAllDueAckNckRecords(admin);
    return jsonNoStore({ success: true, data: summary });
  } catch (error: any) {
    return jsonNoStore(
      { error: error?.message || 'Failed to process ACK/NCK records.' },
      { status: 500 }
    );
  }
}
