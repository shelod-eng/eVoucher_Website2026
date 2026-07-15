import { NextResponse } from 'next/server';
import { listUssdDemoAuditEvidence } from '@/server/services/ussd/ussd-demo-ledger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? 50)));
  const auditLogs = await listUssdDemoAuditEvidence(limit);

  return NextResponse.json(
    {
      success: true,
      auditLogs,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
