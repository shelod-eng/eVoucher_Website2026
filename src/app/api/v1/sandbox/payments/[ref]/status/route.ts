import { authorizeSandboxRequest, getSandboxPaymentStatus, jsonSandbox } from '@/server/services/payment/sandbox-gateway';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET(request: Request, context: { params: { ref: string } }) {
  const authError = authorizeSandboxRequest(request);
  if (authError) return authError;
  try {
    const ref = String(context.params?.ref ?? '').trim();
    if (!ref) return jsonSandbox({ error: 'Payment ref is required.' }, { status: 400 });
    return jsonSandbox(await getSandboxPaymentStatus(ref));
  } catch (error: any) {
    return jsonSandbox({ error: error?.message || 'Failed to fetch sandbox payment status.' }, { status: 500 });
  }
}
