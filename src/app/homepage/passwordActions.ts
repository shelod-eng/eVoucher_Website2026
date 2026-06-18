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
    // 1. Find the Supabase Auth user ID by email
    // This ensures we are targeting the actual login identity.
    const { data: authUser, error: authUserError } = await admin.auth.admin.getUserByEmail(normalizedEmail);

    if (authUserError || !authUser?.user) {
      console.warn(`[password-action] Auth user lookup failed for: ${normalizedEmail}`);
      throw new Error('No account found with that email address.');
    }

    const authUserId = authUser.user.id;

    // 2. Update Supabase Auth credentials (the primary credential update)
    const { error: authError } = await admin.auth.admin.updateUserById(authUserId, {
      password: password,
    });

    if (authError) {
      console.error(`[password-action] Auth update failed for ${authUserId}:`, authError.message);
      throw new Error(`Credential update failed: ${authError.message}`);
    }

    // 3. Sync the hashed password to the custom table for legacy/compatibility reasons
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: dbError, count } = await admin
      .from(tableName)
      .update({ password: hashedPassword })
      .eq('email', normalizedEmail)
      .select('id', { count: 'exact' });

    if (dbError) throw dbError;
    if (count === 0) {
      console.warn(`[password-action] Auth updated but custom table record not found for: ${normalizedEmail}`);
    }

    console.info(`[password-action] Successfully reset credentials for ${userType}: ${normalizedEmail}`);
  } catch (err: any) {
    console.error(`[password-action] Failed to update password:`, err.message);
    throw new Error(err.message || 'Internal server error during password update.');
  }
}
