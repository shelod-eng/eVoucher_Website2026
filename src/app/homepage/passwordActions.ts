'use server';

import bcrypt from 'bcryptjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Server-side function to securely hash passwords and update the database.
 * This prevents bcryptjs from being bundled in the client-side code.
 */
export async function updatePasswordHash(
  email: string,
  password: string,
  userType: 'consumer' | 'merchant'
) {
  const supabase = createServerComponentClient({ cookies });
  const tableName = userType === 'consumer' ? 'users' : 'merchants';
  
  // Hash the password securely on the server
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const { error } = await supabase
    .from(tableName)
    .update({ password: hashedPassword })
    .eq('email', email);
  
  if (error) throw error;
}