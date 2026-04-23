import { authorizeSandboxRequest, createSandboxTopup, jsonSandbox } from '@/server/services/payment/sandbox-gateway';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function POST(request: Request) {
  const authError = authorizeSandboxRequest(request);
  if (authError) return authError;
  try {
    return jsonSandbox(await createSandboxTopup((await request.json()) as Record<string, unknown>));
  } catch (error: any) {
    return jsonSandbox({ error: error?.message || 'Failed to initiate sandbox top-up.' }, { status: 500 });
  }
}
