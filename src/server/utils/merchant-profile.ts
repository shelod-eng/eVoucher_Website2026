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
  const byUserId = await admin.from('merchants').select(selectColumns).eq('user_id', user.id).limit(1);
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

  const byEmail = await admin.from('merchants').select(selectColumns).eq('email', email).limit(1);
  if (byEmail.error) throw byEmail.error;
  if (Array.isArray(byEmail.data) && byEmail.data.length > 0) {
    return byEmail.data[0] as T;
  }
  return null;
}
