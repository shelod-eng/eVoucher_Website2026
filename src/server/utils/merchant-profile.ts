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

export async function resolveMerchantForUser<T>(
  admin: any,
  user: AuthUser,
  selectColumns: string
): Promise<T | null> {
  const byUserId = await admin.from('merchants').select(selectColumns).eq('user_id', user.id).maybeSingle();
  if (!byUserId.error && byUserId.data) {
    return byUserId.data as T;
  }

  if (byUserId.error && !isUserIdTypeMismatch(byUserId.error)) {
    throw byUserId.error;
  }

  const email = normalizeEmail(user.email);
  if (!email) {
    return null;
  }

  const byEmail = await admin.from('merchants').select(selectColumns).eq('email', email).maybeSingle();
  if (byEmail.error) throw byEmail.error;
  return (byEmail.data as T | null) ?? null;
}
