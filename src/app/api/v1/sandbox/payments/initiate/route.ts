import { authorizeSandboxRequest, createSandboxPurchase, jsonSandbox, SANDBOX_ALLOWED_ORIGIN } from '@/server/services/payment/sandbox-gateway';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function POST(request: Request) {
  const authError = authorizeSandboxRequest(request);
  if (authError) return authError;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const origin = String(body.origin ?? request.headers.get('origin') ?? '').trim();
    if (origin && origin !== SANDBOX_ALLOWED_ORIGIN && !origin.startsWith('http://localhost')) {
      return jsonSandbox({ error: `Origin not allowed: ${origin}` }, { status: 403 });
    }
    return jsonSandbox(await createSandboxPurchase(body));
  } catch (error: any) {
    return jsonSandbox({ error: error?.message || 'Failed to initiate sandbox payment.' }, { status: 500 });
  }
}
