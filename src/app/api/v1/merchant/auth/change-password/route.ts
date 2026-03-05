import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { completeMerchantPasswordReset } from '@/server/utils/merchant-onboarding';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const password = String(body?.password ?? '').trim();
    const validationError = validatePassword(password);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentMetadata = user.user_metadata ?? {};
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        ...currentMetadata,
        must_change_password: false,
      },
    });
    if (updateError) throw updateError;

    await completeMerchantPasswordReset(user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update merchant password.' },
      { status: 500 }
    );
  }
}
