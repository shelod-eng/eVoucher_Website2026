'use server';

/**
 * Server-side function to securely hash passwords and update the database.
 * Server-only imports are loaded dynamically to avoid bundling them into client code.
 */
export async function updatePasswordHash(
  email: string,
  password: string,
  userType: 'consumer' | 'merchant'
) {
  // Dynamic imports keep these modules server-only (not pulled into client bundle)
  const bcrypt = (await import('bcryptjs')).default;
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
  const { cookies } = await import('next/headers');

  const supabase = createServerComponentClient({ cookies });
  const tableName = userType === 'consumer' ? 'users' : 'merchants';

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from(tableName)
    .update({ password: hashedPassword })
    .eq('email', email);

  if (error) throw error;
}
