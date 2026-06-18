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
    // 1. Find the user in the database table first to get the mapped user_id
    const { data: profile, error: findError } = await admin
      .from(tableName)
      .select('id, user_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (findError || !profile) {
      console.warn(`[password-action] Profile lookup failed for: ${normalizedEmail}`, findError);
      throw new Error('No account found with that email address.');
    }

    // 2. Resolve the Auth User ID
    // In your schema, merchants usually have a user_id, while consumers might use the id directly
    const authUserId = profile.user_id || profile.id;

    // 3. Update Supabase Auth credentials (The "Source of Truth")
    const { error: authError } = await admin.auth.admin.updateUserById(authUserId, {
      password: password,
    });

    if (authError) {
      console.error(`[password-action] Supabase Auth update failed:`, authError.message);
      throw new Error(`Authentication system error: ${authError.message}`);
    }

    // 4. Sync hashed password to custom table for legacy compatibility
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: dbError } = await admin
      .from(tableName)
      .update({ 
        password: hashedPassword,
        must_reset_password: false 
      })
      .eq('id', profile.id);

    if (dbError) {
      // Log but don't fail the whole action if Auth already succeeded
      console.warn(`[password-action] DB sync failed (Auth succeeded):`, dbError.message);
    }

    console.info(`[password-action] Successfully reset credentials for ${userType}: ${normalizedEmail}`);
    return { success: true };
  } catch (err: any) {
    const errorMessage = err.message || 'An unexpected error occurred during password reset.';
    console.error(`[password-action] Reset failed:`, errorMessage);
    throw new Error(errorMessage);
  }
}
