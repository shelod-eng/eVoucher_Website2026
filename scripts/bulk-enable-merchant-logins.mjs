import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  const text = fs.readFileSync(path, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? '').trim()
  );
}

async function listAuthUsersByEmail(admin) {
  const usersByEmail = new Map();
  let page = 1;
  const perPage = 200;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const user of users) usersByEmail.set(normalizeEmail(user.email), user);
    if (users.length < perPage) break;
    page += 1;
  }
  return usersByEmail;
}

async function ensureApprovedKyc(admin, merchantId) {
  const { data, error } = await admin
    .from('merchant_kyc_reviews')
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('review_status', 'approved')
    .limit(1);
  if (error) throw error;
  if (Array.isArray(data) && data.length > 0) return;

  const { error: insertError } = await admin.from('merchant_kyc_reviews').insert({
    merchant_id: merchantId,
    review_status: 'approved',
    reviewed_by: null,
    review_notes: 'Bulk merchant login enablement for sponsor UAT.',
  });
  if (insertError) throw insertError;
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const password = process.env.BULK_MERCHANT_PASSWORD || 'eVoucher_Merchant@2026!';
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: merchants, error } = await admin
  .from('merchants')
  .select(
    'id,user_id,business_name,contact_name,email,phone,status,approved_at,must_reset_password'
  )
  .or('status.eq.pending,must_reset_password.eq.true')
  .order('created_at', { ascending: true });
if (error) throw error;

const usersByEmail = await listAuthUsersByEmail(admin);
const results = [];

for (const merchant of merchants ?? []) {
  const email = normalizeEmail(merchant.email);
  if (!email) continue;

  await ensureApprovedKyc(admin, merchant.id);

  let authUserId = isUuid(merchant.user_id) ? String(merchant.user_id) : '';
  if (!authUserId) {
    const existingUser = usersByEmail.get(email);
    if (existingUser?.id) authUserId = existingUser.id;
  }

  const metadata = {
    role: 'merchant',
    full_name: merchant.contact_name || merchant.business_name,
    phone: merchant.phone || '',
    must_change_password: true,
  };

  if (authUserId) {
    const { error: updateUserError } = await admin.auth.admin.updateUserById(authUserId, {
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (updateUserError) throw updateUserError;
  } else {
    const { data, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (createUserError) throw createUserError;
    authUserId = data?.user?.id;
    if (authUserId) usersByEmail.set(email, data.user);
  }
  if (!authUserId) throw new Error(`Auth user could not be resolved for ${email}.`);

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from('user_profiles').upsert(
    {
      id: authUserId,
      email,
      full_name: merchant.contact_name || merchant.business_name,
      phone: merchant.phone || null,
      role: 'merchant',
    },
    { onConflict: 'id' }
  );
  if (profileError) throw profileError;

  const { error: merchantUpdateError } = await admin
    .from('merchants')
    .update({
      user_id: authUserId,
      status: 'active',
      vetting_status: 'approved',
      approved_at: merchant.approved_at || now,
      onboarding_fee_paid: true,
      email_verified: true,
      phone_verified: true,
      must_reset_password: true,
      temporary_password_issued_at: now,
      onboarding_completed_at: now,
    })
    .eq('id', merchant.id);
  if (merchantUpdateError) throw merchantUpdateError;

  const { error: verificationError } = await admin.from('merchant_onboarding_verifications').upsert(
    {
      merchant_id: merchant.id,
      email_verified_at: now,
      sms_verified_at: now,
      credentials_sent_at: now,
      otp_attempts: 0,
    },
    { onConflict: 'merchant_id' }
  );
  if (verificationError) throw verificationError;

  results.push({
    businessName: merchant.business_name,
    email,
    previousStatus: merchant.status,
    status: 'active',
    userId: authUserId,
  });
}

const { count: remainingPending, error: pendingError } = await admin
  .from('merchants')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'pending');
if (pendingError) throw pendingError;

const { count: missingLinks, error: linkError } = await admin
  .from('merchants')
  .select('id', { count: 'exact', head: true })
  .or('status.eq.active,status.eq.approved')
  .is('user_id', null);
if (linkError) throw linkError;

const sample = results.slice(0, 10);
console.log(
  JSON.stringify(
    {
      ok: true,
      enabledCount: results.length,
      remainingPending,
      activeOrApprovedMissingAuthLinks: missingLinks,
      sharedTemporaryPassword: password,
      sample,
    },
    null,
    2
  )
);
