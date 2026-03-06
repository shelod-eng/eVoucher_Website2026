type AuthUser = {
  id: string;
  email?: string | null;
};

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function isUserIdTypeMismatch(error: any) {
  const code = String(error?.code ?? '').trim().toLowerCase();
  const message = String(error?.message ?? '').toLowerCase();
  return (
    code === '22p02' ||
    message.includes('invalid input syntax for type integer') ||
    message.includes('invalid input syntax for type bigint') ||
    message.includes('operator does not exist: integer =') ||
    message.includes('operator does not exist: bigint =')
  );
}

function isForcedAutoApprovalMode() {
  const raw = String(
    process.env.FORCE_MERCHANT_AUTO_APPROVAL ??
      process.env.NEXT_PUBLIC_FORCE_MERCHANT_AUTO_APPROVAL ??
      ''
  )
    .trim()
    .toLowerCase();
  if (!raw) return true;
  return ['true', '1', 'yes', 'on'].includes(raw);
}

async function autoApprovePendingMerchantsForUser(admin: any, user: AuthUser) {
  if (!isForcedAutoApprovalMode()) return;

  const approvedAt = new Date().toISOString();
  const baseUpdate = {
    status: 'approved',
    vetting_status: 'auto_approved',
    approved_at: approvedAt,
    onboarding_fee_paid: true,
    email_verified: true,
    phone_verified: true,
  };

  const byUserId = await admin
    .from('merchants')
    .update(baseUpdate)
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (byUserId.error && !isUserIdTypeMismatch(byUserId.error)) {
    throw byUserId.error;
  }

  const email = normalizeEmail(user.email);
  if (!email) return;

  const byEmail = await admin
    .from('merchants')
    .update(baseUpdate)
    .eq('email', email)
    .eq('status', 'pending');
  if (byEmail.error) throw byEmail.error;
}

export async function resolveMerchantForUser<T>(
  admin: any,
  user: AuthUser,
  selectColumns: string
): Promise<T | null> {
  await autoApprovePendingMerchantsForUser(admin, user);

  const byUserId = await admin
    .from('merchants')
    .select(selectColumns)
    .eq('user_id', user.id)
    .order('status', { ascending: true })
    .order('approved_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(10);
  if (!byUserId.error && Array.isArray(byUserId.data) && byUserId.data.length > 0) {
    return byUserId.data[0] as T;
  }

  if (byUserId.error && !isUserIdTypeMismatch(byUserId.error)) {
    throw byUserId.error;
  }

  const email = normalizeEmail(user.email);
  if (!email) {
    return null;
  }

  const byEmail = await admin
    .from('merchants')
    .select(selectColumns)
    .eq('email', email)
    .order('status', { ascending: true })
    .order('approved_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(10);
  if (byEmail.error) throw byEmail.error;
  if (Array.isArray(byEmail.data) && byEmail.data.length > 0) {
    return byEmail.data[0] as T;
  }
  return null;
}
