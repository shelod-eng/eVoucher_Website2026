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
    // 1. Find the user in the database table first to get the mapped user_id (e.g., from 'merchants' or 'users')
    const { data: profile, error: findError } = await admin
      .from(tableName)
      .select('id, user_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (findError) {
      console.error(`[password-action] DB profile lookup error for ${normalizedEmail}:`, findError.message);
      throw new Error('Database error during profile lookup.');
    }
    if (!profile) {
      console.warn(`[password-action] No profile found for email: ${normalizedEmail}`);
      throw new Error('No account found with that email address.');
    }

    // 2. Resolve the Auth User ID
    // In your schema, merchants usually have a user_id, while consumers might use the id directly
    const authUserId = profile.user_id || profile.id;
    if (!authUserId) {
      console.error(`[password-action] Resolved authUserId is null for profile ID: ${profile.id}`);
      throw new Error('Could not resolve authentication user ID.');
    }

    // 3. Update Supabase Auth credentials (The "Source of Truth")
    const { error: authError } = await admin.auth.admin.updateUserById(authUserId, {
      password: password,
    });

    if (authError) {
      console.error(`[password-action] Supabase Auth update failed for ${authUserId}:`, authError.message);
      throw new Error(`Authentication system error: ${authError.message}. Please contact support.`);
    }

    // 4. Sync hashed password to custom table for legacy compatibility and must_reset_password flag
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: dbError, count } = await admin
      .from(tableName)
      .update({ 
        password: hashedPassword,
        must_reset_password: false 
      })
      .eq('id', profile.id)
      .select('id', { count: 'exact' }); // Use select with count for robustness

    if (dbError && dbError.code !== '42703') { // 42703 is "undefined_column"
      console.error(`[password-action] Critical DB sync error (Auth succeeded):`, dbError.message);
      throw new Error(`Database sync failed: ${dbError.message}`); // Still throw for critical DB errors
    } else if (dbError && dbError.code === '42703') {
      console.warn(`[password-action] DB sync warning (missing column, Auth succeeded):`, dbError.message);
    }

    console.info(`[password-action] Successfully reset credentials for ${userType}: ${normalizedEmail}`);
    return { success: true };
  } catch (err: any) {
    const errorMessage = err.message || 'An unexpected error occurred during password reset.';
    console.error(`[password-action] Reset failed:`, errorMessage);
    throw new Error(errorMessage);
  }
}
