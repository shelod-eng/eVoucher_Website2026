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
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 1. Find the user/merchant to get their Auth User ID
    const { data: record, error: findError } = await admin
      .from(tableName)
      .select('id, user_id')
      .eq('email', normalizedEmail)
      .single();

    if (findError || !record) {
      throw new Error('No account found with that email address.');
    }

    // 2. Update Supabase Auth credentials if a user_id exists
    const authUserId = record.user_id || (userType === 'consumer' ? record.id : null);
    if (authUserId) {
      const { error: authError } = await admin.auth.admin.updateUserById(authUserId, {
        password: password,
      });
      if (authError) console.warn('[password-action] Auth update warning:', authError.message);
    }

    // 3. Update the custom table with hashed password for legacy/local check compatibility
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: dbError } = await admin
      .from(tableName)
      .update({ password: hashedPassword })
      .eq('email', normalizedEmail);

    if (dbError) throw dbError;

    console.info(`[password-action] Successfully reset credentials for ${userType}: ${normalizedEmail}`);
  } catch (err: any) {
    console.error(`[password-action] Failed to update password:`, err.message);
    throw new Error(err.message || 'Internal server error during password update.');
  }
}
