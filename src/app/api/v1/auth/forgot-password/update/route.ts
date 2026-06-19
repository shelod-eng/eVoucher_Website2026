import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/admin';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeIdentifier(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '');
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  return null;
}

async function findAuthUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  let page = 1;
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((user) => String(user.email ?? '').toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function sendPasswordUpdatedEmail(args: { email: string; name: string }) {
  const apiKey = String(process.env.SENDGRID_API_KEY ?? '').trim();
  const subject = 'Your eVoucher password has been updated';
  const name = args.name || 'there';
  const text = `Hello ${name}, your password was successfully updated on eVoucher. If this wasn't you, please contact support immediately.`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.55;">
      <h2 style="margin:0 0 12px;">Your eVoucher password has been updated</h2>
      <p>Hello ${name}, your password was successfully updated on eVoucher.</p>
      <p style="color:#b91c1c;"><strong>If this wasn't you, please contact support immediately.</strong></p>
    </div>
  `.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SENDGRID_API_KEY is not configured.');
    }
    console.info('[password-updated-email][dev]', { to: args.email, subject, text });
    return;
  }

  const fromAddress = String(
    process.env.SENDGRID_FROM_EMAIL ?? process.env.RESEND_FROM ?? 'security@evoucher.co.za'
  ).trim();

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: args.email }] }],
      from: { email: fromAddress.includes('<') ? 'security@evoucher.co.za' : fromAddress },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SendGrid email failed (${response.status}): ${body}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}) as any);
    const accountType =
      String(body?.userType ?? 'consumer') === 'merchant' ? 'merchant' : 'consumer';
    const identifier = normalizeIdentifier(body?.identifier ?? body?.email);
    const password = String(body?.password ?? '').trim();
    const confirmPassword = String(body?.confirmPassword ?? '').trim();

    if (!identifier) {
      return NextResponse.json({ error: 'Email or phone is required.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }
    const validationError = validatePassword(password);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const admin = createAdminClient();
    const isEmail = EMAIL_REGEX.test(identifier);
    const normalizedPhone = normalizePhone(identifier);

    let authUserId = '';
    let email = isEmail ? identifier : '';
    let displayName = '';

    if (accountType === 'merchant') {
      const query = admin
        .from('merchants')
        .select('id,user_id,business_name,contact_name,email,phone')
        .limit(1);
      const { data: merchant, error: merchantError } = await (isEmail
        ? query.eq('email', identifier).maybeSingle()
        : query.eq('phone', normalizedPhone).maybeSingle());

      if (merchantError) throw merchantError;
      if (!merchant) {
        return NextResponse.json(
          { error: 'No merchant account found for those details.' },
          { status: 404 }
        );
      }

      authUserId = String(merchant.user_id ?? '').trim();
      email = String(merchant.email ?? email)
        .trim()
        .toLowerCase();
      displayName = String(merchant.contact_name ?? merchant.business_name ?? '').trim();

      if (!authUserId && email) {
        const authUser = await findAuthUserByEmail(admin, email);
        authUserId = String(authUser?.id ?? '').trim();
      }

      if (!authUserId) {
        return NextResponse.json(
          { error: 'Merchant auth user is not linked yet.' },
          { status: 409 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await admin
        .from('merchants')
        .update({ must_reset_password: false, password_hash: passwordHash })
        .eq('id', merchant.id)
        .then(async ({ error }) => {
          if (!error) return;
          await admin
            .from('merchants')
            .update({ must_reset_password: false })
            .eq('id', merchant.id);
        });
    } else if (isEmail) {
      const { data: profile } = await admin
        .from('user_profiles')
        .select('id,email,full_name')
        .eq('email', identifier)
        .maybeSingle();

      authUserId = String(profile?.id ?? '').trim();
      email = String(profile?.email ?? identifier)
        .trim()
        .toLowerCase();
      displayName = String(profile?.full_name ?? '').trim();

      if (!authUserId) {
        const authUser = await findAuthUserByEmail(admin, identifier);
        authUserId = String(authUser?.id ?? '').trim();
        email = String(authUser?.email ?? email)
          .trim()
          .toLowerCase();
        displayName = String(authUser?.user_metadata?.full_name ?? '').trim();
      }
    } else {
      const { data: profile, error: profileError } = await admin
        .from('user_profiles')
        .select('id,email,full_name,phone')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (profileError) throw profileError;
      authUserId = String(profile?.id ?? '').trim();
      email = String(profile?.email ?? '')
        .trim()
        .toLowerCase();
      displayName = String(profile?.full_name ?? '').trim();
    }

    if (!authUserId || !email) {
      return NextResponse.json({ error: 'No account found for those details.' }, { status: 404 });
    }

    const { data: currentAuthUser } = await admin.auth.admin.getUserById(authUserId);
    const currentMetadata = currentAuthUser.user?.user_metadata ?? {};
    const { error: updateError } = await admin.auth.admin.updateUserById(authUserId, {
      password,
      user_metadata: {
        ...currentMetadata,
        must_change_password: false,
      },
    });
    if (updateError) throw updateError;

    try {
      await sendPasswordUpdatedEmail({
        email,
        name: displayName || email.split('@')[0],
      });
    } catch (emailError: any) {
      console.warn('[forgot-password-update][email-warning]', emailError?.message || emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update password.' },
      { status: 500 }
    );
  }
}
