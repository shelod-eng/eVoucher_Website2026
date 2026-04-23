import { authorizeSandboxRequest, getSandboxSettlement, jsonSandbox } from '@/server/services/payment/sandbox-gateway';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET(request: Request, context: { params: { batch_id: string } }) {
  const authError = authorizeSandboxRequest(request);
  if (authError) return authError;
  try {
    const batchId = String(context.params?.batch_id ?? '').trim();
    if (!batchId) return jsonSandbox({ error: 'batch_id is required.' }, { status: 400 });
    return jsonSandbox(await getSandboxSettlement(batchId));
  } catch (error: any) {
    return jsonSandbox({ error: error?.message || 'Failed to fetch sandbox settlement batch.' }, { status: 500 });
  }
}
