import { jsonSandbox } from '@/server/services/payment/sandbox-gateway';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET() {
  return jsonSandbox({ success: true, sandbox: true, status: 'ok', service: 'evoucher-payment-gateway' });
}
