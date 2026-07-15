import { NextResponse } from 'next/server';
import { handleUssdRequest } from '@/server/services/ussd/ussd-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function readUssdRequestBody(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }
  return request.json().catch(() => ({}));
}

export async function POST(request: Request) {
  try {
    const body = await readUssdRequestBody(request);
    const result = await handleUssdRequest({
      sessionId: String(body?.sessionId ?? body?.session_id ?? body?.sessionID ?? '').trim(),
      msisdn: String(body?.msisdn ?? body?.phoneNumber ?? body?.phone_number ?? body?.mobile ?? '')
        .trim(),
      text: String(body?.text ?? '').trim(),
      networkCode:
        String(body?.networkCode ?? body?.network_code ?? body?.network ?? '').trim() || undefined,
      serviceCode: String(body?.serviceCode ?? body?.service_code ?? '').trim() || undefined,
      provider: String(body?.provider ?? 'simulator').trim(),
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'USSD session request failed.' },
      { status: 400 }
    );
  }
}
