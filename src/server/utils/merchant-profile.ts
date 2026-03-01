type AuthUser = {
  id: string;
  email?: string | null;
};

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function isUserIdTypeMismatch(error: any) {
  const message = String(error?.message ?? '').toLowerCase();
  return (
    message.includes('invalid input syntax for type integer') &&
    message.includes('user_id')
  );
}

export async function resolveMerchantForUser<T>(
  admin: any,
  user: AuthUser,
  selectColumns: string
): Promise<T | null> {
  const byUserId = await admin.from('merchants').select(selectColumns).eq('user_id', user.id).maybeSingle();
  if (!byUserId.error) {
    return (byUserId.data as T | null) ?? null;
  }

  if (!isUserIdTypeMismatch(byUserId.error)) {
    throw byUserId.error;
  }

  const email = normalizeEmail(user.email);
  if (!email) {
    throw byUserId.error;
  }

  const byEmail = await admin.from('merchants').select(selectColumns).eq('email', email).maybeSingle();
  if (byEmail.error) throw byEmail.error;
  return (byEmail.data as T | null) ?? null;
}
