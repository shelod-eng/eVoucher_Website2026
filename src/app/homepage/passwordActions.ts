'use server';

import 'server-only';

/**
 * Server-side function to securely hash passwords and update the database.
 * Server-only imports are loaded dynamically to avoid bundling them into client code.
 */
export async function updatePasswordHash(
  email: string,
  password: string,
  userType: 'consumer' | 'merchant'
) {
  if (!email || !password || !userType) {
    throw new Error('Email, password, and user type are required.');
  }

  // Dynamic imports keep these modules server-only (not pulled into client bundle)
  const bcrypt = (await import('bcryptjs')).default;
  const { createAdminClient } = await import('@/lib/supabase/admin');

  const admin = createAdminClient();
  const tableName = userType === 'consumer' ? 'users' : 'merchants';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { error, data } = await admin
      .from(tableName)
      .update({ password: hashedPassword })
      .eq('email', email.toLowerCase().trim())
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No account found with that email address.');
    
    console.info(`[password-action] Successfully updated ${userType} password for ${email}`);
  } catch (err: any) {
    console.error(`[password-action] Failed to update password:`, err.message);
    throw new Error(err.message || 'Internal server error during password update.');
  }
}
