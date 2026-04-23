import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';
import { addVoucherToWallet } from '@/server/services/payment/sandbox-gateway';

function validate(body: any): string | null {
  const voucherCode = String(body?.voucherCode ?? '').trim();
  if (!voucherCode) return 'Voucher code is required.';

  const amount = Number(body?.amount ?? 100);
  if (!Number.isFinite(amount) || amount <= 0) return 'Voucher amount must be greater than zero.';
  if (amount > 100000) return 'Voucher amount exceeds the allowed limit.';

  return null;
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in to add a voucher.', code: 'unauthenticated' },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        {
          error: 'Only signed-in consumers can add vouchers to wallet.',
          code: 'consumer_only_wallet_add_voucher',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: 'invalid_wallet_add_voucher' },
        { status: 400 }
      );
    }

    const result = await addVoucherToWallet({
      customer_id: user.id,
      customer_email: user.email ?? null,
      merchant_id: body?.merchantId ?? null,
      voucher_code: String(body.voucherCode).trim().toUpperCase(),
      face_value: Number(body.amount ?? 100),
      amount: Number(body.amount ?? 100),
      origin: 'https://www.evoucher.co.za',
    });

    return NextResponse.json({
      status: result.status,
      voucherCode: result.voucher_code ?? null,
      faceValue: Number(result.face_value ?? body.amount ?? 100),
      sandbox: true,
      duplicate: Boolean(result.duplicate),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to add voucher to wallet.',
        code: 'wallet_add_voucher_failed',
      },
      { status: 500 }
    );
  }
}
