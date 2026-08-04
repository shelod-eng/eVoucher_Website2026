import { createAdminClient } from '@/lib/supabase/admin';
import { jsonNoStore } from '@/server/services/billing/no-store';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Portal-Passcode, X-Portal-User, X-Portal-Role',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const passcode = request.headers.get('X-Portal-Passcode') ?? '';
  const envPasscode = process.env.PORTAL_ADMIN_PASSCODE ?? '';
  const passcodeValid = envPasscode && passcode === envPasscode;
  if (!passcodeValid) {
    const { allowed } = await requirePortalUser(request, ['admin', 'finance_approver']);
    if (!allowed) return jsonNoStore({ error: 'Forbidden' }, { status: 403, headers: CORS });
  }

  const admin = createAdminClient();
  const runDate = new Date().toISOString().split('T')[0];

  // Count billing_events vs billing_ledger_entries
  const [eventsRes, ledgerRes, payoutsRes] = await Promise.all([
    admin.from('billing_events').select('id, gross_amount', { count: 'exact' }),
    admin.from('billing_ledger_entries').select('id, amount', { count: 'exact' }),
    admin.from('merchant_payouts').select('id, amount').eq('status', 'pending'),
  ]);

  const ws1Count = eventsRes.count ?? 0;
  const ledgerCount = ledgerRes.count ?? 0;
  const ws1Value = (eventsRes.data ?? []).reduce((s: number, r: any) => s + Number(r.gross_amount ?? 0), 0);
  const ledgerValue = (ledgerRes.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
  const variance = Math.abs(ws1Value - ledgerValue);
  const exceptionCount = variance > 0.01 ? 1 : 0;

  const { data: run, error } = await admin
    .from('reconciliation_runs')
    .insert({
      run_date: runDate,
      status: exceptionCount > 0 ? 'exceptions' : 'completed',
      ws1_tx_count: ws1Count,
      ledger_count: ledgerCount,
      matched_count: Math.min(ws1Count, ledgerCount),
      exception_count: exceptionCount,
      total_ws1_value: Number(ws1Value.toFixed(2)),
      total_ledger_value: Number(ledgerValue.toFixed(2)),
      variance: Number(variance.toFixed(2)),
      completed_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    if (error.message?.includes('does not exist')) {
      return jsonNoStore({
        success: true,
        data: { ws1Count, ledgerCount, ws1Value, ledgerValue, variance, exceptionCount },
        note: 'reconciliation_runs table not yet created',
      }, { headers: CORS });
    }
    return jsonNoStore({ error: error.message }, { status: 500, headers: CORS });
  }

  return jsonNoStore({ success: true, data: run }, { headers: CORS });
}
