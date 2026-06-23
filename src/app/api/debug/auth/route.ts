import { NextResponse } from 'next/server';
import { requirePortalUser } from '@/server/services/billing/portal-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const headers = {
    passcode: request.headers.get('x-portal-passcode'),
    user: request.headers.get('x-portal-user'),
  };

  const result = await requirePortalUser(request, ['admin', 'finance_approver', 'auditor']);

  return NextResponse.json({
    headers,
    auth: {
      isAuthenticated: result.isAuthenticated,
      allowed: result.allowed,
      role: result.role,
      userId: result.user?.id,
      userEmail: result.user?.email,
    },
  });
}
