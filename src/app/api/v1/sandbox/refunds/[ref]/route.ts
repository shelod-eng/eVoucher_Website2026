import { authorizeSandboxRequest, jsonSandbox, refundSandboxTransaction } from '@/server/services/payment/sandbox-gateway';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function POST(request: Request, context: { params: { ref: string } }) {
  const authError = authorizeSandboxRequest(request);
  if (authError) return authError;
  try {
    const ref = String(context.params?.ref ?? '').trim();
    if (!ref) return jsonSandbox({ error: 'ref is required.' }, { status: 400 });
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return jsonSandbox(await refundSandboxTransaction(ref, body));
  } catch (error: any) {
    return jsonSandbox({ error: error?.message || 'Failed to refund sandbox transaction.' }, { status: 500 });
  }
}
