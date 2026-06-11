import crypto from 'node:crypto';
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

function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  const all = upper + lower + digits + symbols;
  const chars = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    symbols[crypto.randomInt(symbols.length)],
  ];
  while (chars.length < 16) chars.push(all[crypto.randomInt(all.length)]);
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }
  return chars.join('');
}

async function findAuthUserByEmail(admin, email) {
  const target = normalizeEmail(email);
  let page = 1;
  const perPage = 200;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((user) => normalizeEmail(user.email) === target);
    if (match) return match;
    if (users.length < perPage) return null;
    page += 1;
  }
  return null;
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
    review_notes: 'Bulk activation of pending merchants for sponsor UAT login readiness.',
  });
  if (insertError) throw insertError;
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: pendingMerchants, error } = await admin
    .from('merchants')
    .select('id,user_id,business_name,contact_name,email,phone,status,approved_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const results = [];
  for (const merchant of pendingMerchants ?? []) {
    const email = normalizeEmail(merchant.email);
    const password = generatePassword();
    const now = new Date().toISOString();

    await ensureApprovedKyc(admin, merchant.id);

    let authUserId = '';
    if (isUuid(merchant.user_id)) {
      const { data } = await admin.auth.admin.getUserById(merchant.user_id);
      if (data?.user?.id) authUserId = data.user.id;
    }
    if (!authUserId) {
      const existingUser = await findAuthUserByEmail(admin, email);
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
    }
    if (!authUserId) throw new Error(`Auth user could not be resolved for ${email}.`);

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
      status: 'active',
      userId: authUserId,
      temporaryPassword: password,
    });
  }

  const { count: remainingPending, error: countError } = await admin
    .from('merchants')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (countError) throw countError;

  console.log(
    JSON.stringify(
      {
        ok: true,
        activatedCount: results.length,
        remainingPending,
        merchants: results,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error?.message || String(error) }, null, 2));
  process.exitCode = 1;
});
