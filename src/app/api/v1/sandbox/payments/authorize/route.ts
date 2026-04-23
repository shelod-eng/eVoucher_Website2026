import { authorizeSandboxPayment, authorizeSandboxRequest, jsonSandbox } from '@/server/services/payment/sandbox-gateway';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function POST(request: Request) {
  const authError = authorizeSandboxRequest(request);
  if (authError) return authError;
  try {
    return jsonSandbox(await authorizeSandboxPayment((await request.json()) as Record<string, unknown>));
  } catch (error: any) {
    return jsonSandbox({ error: error?.message || 'Failed to authorize sandbox payment.' }, { status: 500 });
  }
}
