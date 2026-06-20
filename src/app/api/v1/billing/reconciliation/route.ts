import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import {
  reconcileBankServBatch,
  retryFailedSettlement,
  createManualReconciliationEntry,
  generateReconciliationReport,
  getBatchReconciliationStatus,
} from '@/server/services/bankserv-reconciliation';

function isPortalUser(role: string): boolean {
  return ['admin', 'finance_approver', 'auditor'].includes(role);
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    if (!isPortalUser(role)) {
      return NextResponse.json({ error: 'Portal access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'batchId required' }, { status: 400 });
    }

    const action = searchParams.get('action');

    if (action === 'status') {
      const result = await getBatchReconciliationStatus(batchId);
      return NextResponse.json(result);
    }

    if (action === 'report') {
      const result = await generateReconciliationReport(batchId);
      return NextResponse.json(result);
    }

    const result = await reconcileBankServBatch(batchId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Reconciliation failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role } = await resolveUserRole(supabase, user);
    if (!isPortalUser(role)) {
      return NextResponse.json({ error: 'Portal access required' }, { status: 403 });
    }

    const body = (await request.json()) as {
      action: 'retry' | 'manual_entry' | 'reconcile';
      batchId?: string;
      settlementId?: string;
      merchantId?: string;
      amount?: number;
      reason?: string;
    };

    if (body.action === 'retry') {
      if (!body.settlementId) {
        return NextResponse.json({ error: 'settlementId required' }, { status: 400 });
      }
      const result = await retryFailedSettlement(body.settlementId);
      return NextResponse.json(result);
    }

    if (body.action === 'manual_entry') {
      if (!body.settlementId || !body.merchantId || !body.amount || !body.reason) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const result = await createManualReconciliationEntry({
        settlementId: body.settlementId,
        merchantId: body.merchantId,
        amount: body.amount,
        reason: body.reason,
        authorizedBy: user.id,
      });
      return NextResponse.json(result);
    }

    if (body.action === 'reconcile') {
      if (!body.batchId) {
        return NextResponse.json({ error: 'batchId required' }, { status: 400 });
      }
      const result = await reconcileBankServBatch(body.batchId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Operation failed' }, { status: 500 });
  }
}
