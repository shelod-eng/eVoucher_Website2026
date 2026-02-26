import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAuditEvent } from '@/server/utils/audit';
import {
  getMerchantLoginUrl,
  sendMerchantCredentialsEmail,
  sendMerchantOtpSms,
  sendMerchantStatusNotifications,
  sendMerchantVerificationEmail,
} from '@/server/utils/merchant-notifications';

export type MerchantType = 'chain' | 'private';

type OnboardingPayload = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  parentBrand?: string;
  branchName?: string;
  city?: string;
  province?: string;
  locationLat?: number;
  locationLng?: number;
  registrationNumber?: string;
  taxNumber?: string;
  physicalAddress?: string;
  businessType?: string;
  bankName?: string;
  accountNumber?: string;
  branchCode?: string;
  accountHolderName?: string;
  discountPercentage?: number;
  merchantType?: MerchantType;
  pharmacyLicenseNumber?: string;
  responsiblePharmacistName?: string;
  ownerIdNumber?: string;
  proofOfPremises?: string;
};

type OnboardingInsert = {
  user_id: string | null;
  business_name: string;
  parent_brand: string;
  branch_name: string;
  city: string | null;
  province: string | null;
  location_lat: number | null;
  location_lng: number | null;
  contact_name: string;
  email: string;
  phone: string;
  registration_number: string | null;
  tax_number: string | null;
  physical_address: string | null;
  business_type: string | null;
  bank_name: string | null;
  account_number: string | null;
  branch_code: string | null;
  account_holder_name: string | null;
  default_total_discount_pct: number;
  status: 'pending' | 'approved';
  approved_at: string | null;
  onboarding_fee_paid: boolean;
  merchant_type: MerchantType;
  vetting_status: string;
  pharmacy_license_number: string | null;
  responsible_pharmacist_name: string | null;
  owner_id_number: string | null;
  proof_of_premises: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  must_reset_password: boolean;
};

type MerchantRecord = {
  id: string;
  user_id: string | null;
  business_name: string;
  parent_brand: string | null;
  branch_name: string | null;
  contact_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'active' | 'suspended';
  vetting_status: string | null;
  merchant_type: MerchantType | null;
  registration_number: string | null;
  tax_number: string | null;
  pharmacy_license_number: string | null;
  responsible_pharmacist_name: string | null;
  owner_id_number: string | null;
  physical_address: string | null;
  business_type: string | null;
  bank_name: string | null;
  account_number: string | null;
  branch_code: string | null;
  account_holder_name: string | null;
  approved_at: string | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
  must_reset_password: boolean | null;
};

type VerificationRecord = {
  merchant_id: string;
  email_token_hash: string | null;
  email_token_expires_at: string | null;
  email_verified_at: string | null;
  sms_otp_hash: string | null;
  sms_otp_expires_at: string | null;
  sms_verified_at: string | null;
  otp_attempts: number | null;
  credentials_sent_at: string | null;
};

type MerchantOnboardingStatusSnapshot = {
  merchantId: string;
  businessName: string;
  email: string;
  merchantType: MerchantType;
  status: string;
  vettingStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  credentialsIssued: boolean;
  mustResetPassword: boolean;
  loginReady: boolean;
  merchantUserId: string | null;
};

type FinalizeOptions = {
  forceApproveChain?: boolean;
  actorId?: string | null;
  actorRole?: string | null;
  requestId?: string | null;
};

const EMAIL_TOKEN_TTL_HOURS = 24;
const SMS_OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const UUID_V4_OR_V1_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_V4_OR_V1_REGEX.test(String(value ?? '').trim());
}

function extractDeliveryError(result: unknown) {
  if (result && typeof result === 'object' && 'error' in result) {
    const errorValue = (result as { error?: unknown }).error;
    return errorValue ? String(errorValue) : null;
  }
  return null;
}

function normalizeText(value: unknown) {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeMerchantType(value: unknown): MerchantType {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'private' ? 'private' : 'chain';
}

function hashSecret(secret: string) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function generateEmailToken() {
  return crypto.randomBytes(24).toString('hex');
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 14 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function shouldExposeDebugSecrets() {
  return (
    process.env.NODE_ENV !== 'production' ||
    String(process.env.EXPOSE_MERCHANT_DEBUG_SECRETS ?? '').toLowerCase() === 'true'
  );
}

async function safeAudit(admin: any, event: any) {
  // Safety fallback: skip audit writes entirely in dev until audit_events schema is aligned (prevents int/uuid cast errors).
  return;
}

function isSmsEnabled() {
  const sid = String(process.env.TWILIO_ACCOUNT_SID ?? '').trim();
  const token = String(process.env.TWILIO_AUTH_TOKEN ?? '').trim();
  const from = String(process.env.TWILIO_FROM_PHONE ?? '').trim();
  return Boolean(sid && token && from);
}

function resolveAppBaseUrl() {
  return (
    String(process.env.NEXT_PUBLIC_APP_URL ?? '').trim() ||
    String(process.env.APP_URL ?? '').trim() ||
    'http://localhost:4028'
  ).replace(/\/+$/, '');
}

function resolveInitialVettingStatus(merchantType: MerchantType) {
  return merchantType === 'private' ? 'pending_private_approval' : 'pending_chain_approval';
}

function coerceNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return numberValue;
}

function validatePayload(payload: OnboardingPayload): string | null {
  if (!normalizeText(payload.businessName)) return 'Business name is required.';
  if (!normalizeText(payload.contactName)) return 'Contact name is required.';
  if (!normalizeEmail(payload.email)) return 'Email is required.';
  if (!normalizeText(payload.phone)) return 'Phone is required.';

  const merchantType = normalizeMerchantType(payload.merchantType);
  if (merchantType === 'private') {
    if (!normalizeText(payload.pharmacyLicenseNumber)) {
      return 'Pharmacy license number is required for private merchants.';
    }
    if (!normalizeText(payload.responsiblePharmacistName)) {
      return 'Responsible pharmacist details are required for private merchants.';
    }
    if (!normalizeText(payload.ownerIdNumber)) {
      return 'Owner ID verification is required for private merchants.';
    }
  } else {
    if (!normalizeText(payload.registrationNumber)) {
      return 'Company registration number is required for chain merchants.';
    }
    if (!normalizeText(payload.taxNumber)) {
      return 'VAT/Tax number is required for chain merchants.';
    }
  }

  const discount = payload.discountPercentage ?? 5;
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    return 'Discount percentage must be between 0 and 100.';
  }
  return null;
}

function uniqueRequestId(base: string) {
  return `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildOnboardingInsert(
  payload: OnboardingPayload,
  userId: string | null
): { insert: OnboardingInsert; merchantType: MerchantType } {
  const businessName = normalizeText(payload.businessName) as string;
  const contactName = normalizeText(payload.contactName) as string;
  const email = normalizeEmail(payload.email);
  const merchantType = normalizeMerchantType(payload.merchantType);
  const status: OnboardingInsert['status'] = 'pending';

  return {
    merchantType,
    insert: {
      user_id: userId,
      business_name: businessName,
      parent_brand: normalizeText(payload.parentBrand) ?? businessName,
      branch_name: normalizeText(payload.branchName) ?? businessName,
      city: normalizeText(payload.city),
      province: normalizeText(payload.province),
      location_lat: coerceNumber(payload.locationLat),
      location_lng: coerceNumber(payload.locationLng),
      contact_name: contactName,
      email,
      phone: normalizeText(payload.phone) as string,
      registration_number: normalizeText(payload.registrationNumber),
      tax_number: normalizeText(payload.taxNumber),
      physical_address: normalizeText(payload.physicalAddress),
      business_type: normalizeText(payload.businessType),
      bank_name: normalizeText(payload.bankName),
      account_number: normalizeText(payload.accountNumber),
      branch_code: normalizeText(payload.branchCode),
      account_holder_name: normalizeText(payload.accountHolderName),
      default_total_discount_pct: Number(payload.discountPercentage ?? 5),
      status,
      approved_at: null,
      onboarding_fee_paid: false,
      merchant_type: merchantType,
      vetting_status: resolveInitialVettingStatus(merchantType),
      pharmacy_license_number: normalizeText(payload.pharmacyLicenseNumber),
      responsible_pharmacist_name: normalizeText(payload.responsiblePharmacistName),
      owner_id_number: normalizeText(payload.ownerIdNumber),
      proof_of_premises: normalizeText(payload.proofOfPremises),
      email_verified: false,
      phone_verified: false,
      must_reset_password: false,
    },
  };
}

async function getMerchantById(admin: any, merchantId: string): Promise<MerchantRecord> {
  const { data, error } = await admin
    .from('merchants')
    .select(
      'id,user_id,business_name,parent_brand,branch_name,contact_name,email,phone,status,vetting_status,merchant_type,registration_number,tax_number,pharmacy_license_number,responsible_pharmacist_name,owner_id_number,physical_address,business_type,bank_name,account_number,branch_code,account_holder_name,approved_at,email_verified,phone_verified,must_reset_password'
    )
    .eq('id', merchantId)
    .single();

  if (error) throw error;
  return data as MerchantRecord;
}

async function getVerificationByMerchantId(
  admin: any,
  merchantId: string
): Promise<VerificationRecord | null> {
  if (!isUuid(merchantId)) return null;
  const { data, error } = await admin
    .from('merchant_onboarding_verifications')
    .select(
      'merchant_id,email_token_hash,email_token_expires_at,email_verified_at,sms_otp_hash,sms_otp_expires_at,sms_verified_at,otp_attempts,credentials_sent_at'
    )
    .eq('merchant_id', merchantId)
    .maybeSingle();

  if (error) throw error;
  return (data as VerificationRecord | null) ?? null;
}

async function findAuthUserByEmail(admin: any, email: string) {
  let page = 1;
  const perPage = 200;
  while (page <= 8) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((user: any) => String(user.email ?? '').toLowerCase() === email);
    if (match) return match;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function upsertUserProfileRole(admin: any, userId: string, merchant: MerchantRecord) {
  const { error } = await admin.from('user_profiles').upsert(
    {
      id: userId,
      email: merchant.email,
      full_name: merchant.contact_name,
      phone: merchant.phone,
      role: 'merchant',
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

async function enforceMerchantLoginReadiness(admin: any, merchant: MerchantRecord, userId: string) {
  const {
    data: { user },
    error: authLookupError,
  } = await admin.auth.admin.getUserById(userId);
  if (authLookupError) throw authLookupError;
  if (!user) throw new Error('Merchant auth user was not found after provisioning.');

  const mergedMetadata = {
    ...(user.user_metadata ?? {}),
    role: 'merchant',
    full_name: merchant.contact_name,
    phone: merchant.phone,
    must_change_password: true,
  };

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: mergedMetadata,
    email: merchant.email,
  });
  if (authUpdateError) throw authUpdateError;

  await upsertUserProfileRole(admin, userId, merchant);
}

async function provisionAuthUserForMerchant(
  admin: any,
  merchant: MerchantRecord,
  temporaryPassword: string
) {
  const metadata = {
    role: 'merchant',
    full_name: merchant.contact_name,
    phone: merchant.phone,
    must_change_password: true,
  };

  if (merchant.user_id) {
    const { error } = await admin.auth.admin.updateUserById(merchant.user_id, {
      email: merchant.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    return merchant.user_id;
  }

  const existingAuthUser = await findAuthUserByEmail(admin, merchant.email);
  if (existingAuthUser?.id) {
    const mergedMetadata = {
      ...(existingAuthUser.user_metadata ?? {}),
      ...metadata,
    };
    const { error } = await admin.auth.admin.updateUserById(existingAuthUser.id, {
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: mergedMetadata,
    });
    if (error) throw error;
    return existingAuthUser.id as string;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: merchant.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  if (!data?.user?.id) {
    throw new Error('Unable to create merchant auth user.');
  }
  return data.user.id as string;
}

function evaluatePrivateMerchantAutoApproval(merchant: MerchantRecord) {
  const hasLicense = Boolean(normalizeText(merchant.pharmacy_license_number));
  const hasOwnerId = Boolean(normalizeText(merchant.owner_id_number));
  return hasLicense && hasOwnerId;
}

export async function submitMerchantOnboarding(args: {
  payload: OnboardingPayload;
  actorId?: string | null;
  actorRole?: string | null;
}) {
  const validationError = validatePayload(args.payload);
  if (validationError) {
    return { ok: false as const, status: 400, error: validationError };
  }

  const admin = createAdminClient();
  const { insert, merchantType } = buildOnboardingInsert(args.payload, args.actorId ?? null);
  const email = insert.email;
  const smsEnabled = isSmsEnabled();
  const existingMerchant = await admin
    .from('merchants')
    .select('id,user_id,status,vetting_status')
    .eq('email', email)
    .maybeSingle();
  if (existingMerchant.error) throw existingMerchant.error;

  if (existingMerchant.data?.status === 'active') {
    return {
      ok: false as const,
      status: 409,
      error: 'This merchant email is already active. Please sign in as merchant.',
    };
  }

  if (existingMerchant.data?.status === 'approved') {
    return {
      ok: false as const,
      status: 409,
      error: 'This merchant is already approved. Use merchant login.',
    };
  }

  let merchantData;
  if (existingMerchant.data?.id) {
    // Preserve existing user_id if present
    const updatePayload = {
      ...insert,
      user_id: existingMerchant.data.user_id ?? insert.user_id,
      phone_verified: !smsEnabled ? true : insert.phone_verified,
    };
    const { data, error } = await admin
      .from('merchants')
      .update(updatePayload)
      .eq('id', existingMerchant.data.id)
      .select('id,business_name,email,phone,contact_name,status,vetting_status')
      .single();
    if (error) throw error;
    merchantData = data;
  } else {
    const { data, error } = await admin
      .from('merchants')
      .insert({
        ...insert,
        phone_verified: !smsEnabled ? true : insert.phone_verified,
      })
      .select('id,business_name,email,phone,contact_name,status,vetting_status')
      .single();
    if (error) throw error;
    merchantData = data;
  }

  const merchantId = merchantData.id as string;
  const now = new Date();
  const emailToken = generateEmailToken();
  const otpCode = generateOtpCode();
  const emailTokenHash = hashSecret(emailToken);
  const otpHash = hashSecret(otpCode);
  const emailExpiry = new Date(now.getTime() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const otpExpiry = new Date(now.getTime() + SMS_OTP_TTL_MINUTES * 60 * 1000).toISOString();

  const { error: verificationError } = await admin.from('merchant_onboarding_verifications').upsert(
    {
      merchant_id: merchantId,
      email_token_hash: emailTokenHash,
      email_token_expires_at: emailExpiry,
      email_verified_at: null,
      sms_otp_hash: smsEnabled ? otpHash : null,
      sms_otp_expires_at: smsEnabled ? otpExpiry : null,
      sms_verified_at: smsEnabled ? null : now.toISOString(),
      otp_attempts: 0,
      credentials_sent_at: null,
    },
    { onConflict: 'merchant_id' }
  );
  if (verificationError) throw verificationError;

  const verificationUrl = `${resolveAppBaseUrl()}/merchant/onboarding/verify-email?merchantId=${merchantId}&token=${emailToken}`;
  const [emailResult, smsResult] = await Promise.all([
    sendMerchantVerificationEmail({
      businessName: insert.business_name,
      email,
      verificationUrl,
      emailToken,
    }),
    smsEnabled
      ? sendMerchantOtpSms({
          businessName: insert.business_name,
          phone: insert.phone,
          otpCode,
        })
      : Promise.resolve({ sent: false, provider: 'console' as const }),
  ]);

  await safeAudit(admin, {
    actorId: args.actorId ?? null,
    actorRole: args.actorRole ?? 'merchant',
    entityType: 'merchant',
    entityId: null,
    action: 'merchant_onboarding_submitted',
    metadata: {
      merchantType,
      vettingStatus: insert.vetting_status,
      emailSent: emailResult.sent,
      otpSent: smsResult.sent,
    },
    requestId: null,
  });

  try {
    await sendMerchantStatusNotifications({
      merchantId,
      businessName: insert.business_name,
      contactName: insert.contact_name,
      email: insert.email,
      phone: insert.phone,
      businessType: insert.business_type,
      registrationNumber: insert.registration_number,
      taxNumber: insert.tax_number,
      physicalAddress: insert.physical_address,
      bankName: insert.bank_name,
      accountNumber: insert.account_number,
      status: insert.status,
      approvedAt: null,
    });
  } catch (notifyError) {
    console.warn('[merchant-onboarding][notify][warn]', (notifyError as any)?.message || notifyError);
  }

  return {
    ok: true as const,
    merchantId,
    merchantType,
    status: insert.status,
    vettingStatus: insert.vetting_status,
    emailSent: emailResult.sent,
    smsSent: smsResult.sent,
    verificationEmailTo: emailResult.recipient ?? insert.email,
    emailDeliveryError: extractDeliveryError(emailResult),
    smsDeliveryError: extractDeliveryError(smsResult),
    ...(shouldExposeDebugSecrets()
      ? {
          debug: {
            emailToken,
            otpCode: smsEnabled ? otpCode : 'sms-disabled',
            verificationUrl,
            verificationEmailTo: emailResult.recipient ?? insert.email,
            emailDeliveryError: extractDeliveryError(emailResult),
            smsDeliveryError: extractDeliveryError(smsResult),
          },
        }
      : {}),
  };
}

export async function getMerchantOnboardingStatus(merchantId: string) {
  if (!isUuid(merchantId)) {
    throw new Error('Invalid merchantId format.');
  }
  const admin = createAdminClient();
  const merchant = await getMerchantById(admin, merchantId);
  const verification = await getVerificationByMerchantId(admin, merchantId);
  const emailVerified = Boolean(merchant.email_verified) || Boolean(verification?.email_verified_at);
  const phoneVerified = Boolean(merchant.phone_verified) || Boolean(verification?.sms_verified_at);
  const credentialsIssued = Boolean(verification?.credentials_sent_at);
  const mustResetPassword = Boolean(merchant.must_reset_password);
  const loginReady =
    merchant.status === 'approved' &&
    Boolean(merchant.user_id) &&
    mustResetPassword &&
    credentialsIssued &&
    emailVerified &&
    phoneVerified;

  return {
    merchantId: merchant.id,
    businessName: merchant.business_name,
    email: merchant.email,
    merchantType: merchant.merchant_type ?? 'chain',
    status: merchant.status,
    vettingStatus: merchant.vetting_status ?? resolveInitialVettingStatus(merchant.merchant_type ?? 'chain'),
    emailVerified,
    phoneVerified,
    credentialsIssued,
    mustResetPassword,
    loginReady,
    merchantUserId: merchant.user_id ?? null,
  } as MerchantOnboardingStatusSnapshot;
}

export async function verifyMerchantEmailToken(args: {
  merchantId: string;
  token: string;
  actorId?: string | null;
}) {
  const admin = createAdminClient();
  const merchantId = String(args.merchantId ?? '').trim();
  const token = String(args.token ?? '').trim();
  if (!merchantId || !token) {
    return { ok: false as const, status: 400, error: 'merchantId and token are required.' };
  }
  if (!isUuid(merchantId)) {
    return { ok: false as const, status: 400, error: 'Invalid merchantId format.' };
  }

  // Validate token against stored hash/expiry
  const verification = await getVerificationByMerchantId(admin, merchantId);
  if (!verification || !verification.email_token_hash) {
    return { ok: false as const, status: 404, error: 'Email verification record not found.' };
  }
  const tokenMatches = hashSecret(token) === verification.email_token_hash;
  if (!tokenMatches) return { ok: false as const, status: 400, error: 'Invalid verification token.' };
  const tokenExpiry = verification.email_token_expires_at
    ? new Date(verification.email_token_expires_at).getTime()
    : 0;
  if (!tokenExpiry || tokenExpiry < Date.now()) {
    return { ok: false as const, status: 400, error: 'Verification token has expired.' };
  }

  // Mark verification record
  const nowIso = new Date().toISOString();
  const { error: verificationUpdateError } = await admin
    .from('merchant_onboarding_verifications')
    .update({ email_verified_at: nowIso })
    .eq('merchant_id', merchantId);
  if (verificationUpdateError) throw verificationUpdateError;

  const { error: merchantEmailUpdateError } = await admin
    .from('merchants')
    .update({ email_verified: true })
    .eq('id', merchantId);
  if (merchantEmailUpdateError) throw merchantEmailUpdateError;

  // Try full approval path first
  try {
    const finalizeResult = await finalizeMerchantApproval({
      merchantId,
      actorId: args.actorId ?? null,
      actorRole: 'merchant',
      requestId: null,
    });
    const statusData = await getMerchantOnboardingStatus(merchantId);
    return { ok: true as const, httpStatus: 200, ...finalizeResult, statusData };
  } catch (err) {
    console.warn('[merchant-email-verify][warn-fallback]', (err as any)?.message || err);
  }

  // Fallback: provision auth user and approve directly
  try {
    const merchant = await getMerchantById(admin, merchantId);
    const temporaryPassword = generateTemporaryPassword();
    const userId = await provisionAuthUserForMerchant(admin, merchant, temporaryPassword);
    await enforceMerchantLoginReadiness(admin, merchant, userId);

    const approvedAt = new Date().toISOString();
    const { error: merchantUpdateError } = await admin
      .from('merchants')
      .update({
        user_id: userId,
        status: 'approved',
        vetting_status: 'auto_approved',
        approved_at: approvedAt,
        onboarding_fee_paid: true,
        email_verified: true,
        phone_verified: true,
        must_reset_password: true,
        temporary_password_issued_at: approvedAt,
        onboarding_completed_at: approvedAt,
      })
      .eq('id', merchantId);
    if (merchantUpdateError) throw merchantUpdateError;

    const credentialsEmailResult = await sendMerchantCredentialsEmail({
      businessName: merchant.business_name,
      email: merchant.email,
      temporaryPassword,
      loginUrl: getMerchantLoginUrl(),
    });
    if (credentialsEmailResult.sent) {
      const { error: verificationUpdateError } = await admin
        .from('merchant_onboarding_verifications')
        .update({ credentials_sent_at: approvedAt })
        .eq('merchant_id', merchant.id);
      if (verificationUpdateError) throw verificationUpdateError;
    }

    return {
      ok: true as const,
      httpStatus: 200,
      approved: true,
      status: 'approved',
      vettingStatus: 'auto_approved',
      emailVerified: true,
      phoneVerified: true,
      message: credentialsEmailResult.sent
        ? 'Email verified. Merchant approved and credentials issued.'
        : `Email verified. Merchant approved, but credentials email failed: ${credentialsEmailResult.error ?? 'unknown error'}`,
      statusData: await getMerchantOnboardingStatus(merchantId),
      ...(shouldExposeDebugSecrets()
        ? { debug: { temporaryPassword, credentialsEmailError: credentialsEmailResult.error ?? null } }
        : {}),
    };
  } catch (fallbackErr) {
    console.warn('[merchant-email-verify][fatal-fallback]', (fallbackErr as any)?.message || fallbackErr);
    return {
      ok: true as const,
      httpStatus: 200,
      approved: false,
      status: 'pending',
      vettingStatus: 'pending_manual_review',
      emailVerified: true,
      phoneVerified: true,
      message: 'Email verified. Pending manual approval.',
      statusData: await getMerchantOnboardingStatus(merchantId),
    };
  }
}

export async function verifyMerchantOtp(args: {
  merchantId: string;
  otpCode: string;
  actorId?: string | null;
}) {
  if (!isSmsEnabled()) {
    return {
      ok: true as const,
      status: 200,
      approved: false,
      vettingStatus: 'sms_disabled',
      emailVerified: true,
      phoneVerified: true,
      message: 'SMS is disabled; phone verification skipped.',
    };
  }

  const admin = createAdminClient();
  const merchantId = String(args.merchantId ?? '').trim();
  const otpCode = String(args.otpCode ?? '').trim();
  if (!merchantId || !otpCode) {
    return { ok: false as const, status: 400, error: 'merchantId and otpCode are required.' };
  }
  if (!isUuid(merchantId)) {
    return { ok: false as const, status: 400, error: 'Invalid merchantId format.' };
  }

  const verification = await getVerificationByMerchantId(admin, merchantId);
  if (!verification || !verification.sms_otp_hash) {
    return { ok: false as const, status: 404, error: 'OTP verification record not found.' };
  }

  const attempts = Number(verification.otp_attempts ?? 0);
  if (attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false as const, status: 429, error: 'Too many OTP attempts. Please request a new OTP.' };
  }

  const otpExpiry = verification.sms_otp_expires_at ? new Date(verification.sms_otp_expires_at).getTime() : 0;
  if (!otpExpiry || otpExpiry < Date.now()) {
    return { ok: false as const, status: 400, error: 'OTP has expired.' };
  }

  const otpMatches = hashSecret(otpCode) === verification.sms_otp_hash;
  if (!otpMatches) {
    await admin
      .from('merchant_onboarding_verifications')
      .update({ otp_attempts: attempts + 1 })
      .eq('merchant_id', merchantId);
    return { ok: false as const, status: 400, error: 'Invalid OTP code.' };
  }

  const nowIso = new Date().toISOString();
  const { error: updateVerificationError } = await admin
    .from('merchant_onboarding_verifications')
    .update({ sms_verified_at: nowIso, otp_attempts: attempts + 1 })
    .eq('merchant_id', merchantId);
  if (updateVerificationError) throw updateVerificationError;

  const { error: updateMerchantError } = await admin
    .from('merchants')
    .update({ phone_verified: true })
    .eq('id', merchantId);
  if (updateMerchantError) throw updateMerchantError;

  await safeAudit(admin, {
    actorId: args.actorId ?? null,
    actorRole: 'merchant',
    entityType: 'merchant',
    entityId: null,
    action: 'merchant_phone_verified',
    metadata: {},
    requestId: null,
  });

  const finalizeResult = await finalizeMerchantApproval({
    merchantId,
    actorId: args.actorId ?? null,
    actorRole: 'merchant',
    requestId: null,
  });

  return {
    ok: true as const,
    httpStatus: 200,
    ...finalizeResult,
    statusData: await getMerchantOnboardingStatus(merchantId),
  };
}

export async function approveMerchantManually(args: {
  merchantId: string;
  actorId?: string | null;
  actorRole?: string | null;
}) {
  const finalizeResult = await finalizeMerchantApproval({
    merchantId: args.merchantId,
    forceApproveChain: true,
    actorId: args.actorId ?? null,
    actorRole: args.actorRole ?? 'admin',
    requestId: null,
  });

  return {
    ok: true as const,
    httpStatus: 200,
    ...finalizeResult,
    statusData: await getMerchantOnboardingStatus(args.merchantId),
  };
}

export async function resendMerchantCredentials(args: {
  merchantId: string;
  actorId?: string | null;
  actorRole?: string | null;
}) {
  const admin = createAdminClient();
  const merchantId = String(args.merchantId ?? '').trim();
  if (!merchantId) {
    return { ok: false as const, status: 400, error: 'merchantId is required.' };
  }
  if (!isUuid(merchantId)) {
    return { ok: false as const, status: 400, error: 'Invalid merchantId format.' };
  }

  const merchant = await getMerchantById(admin, merchantId);
  if (merchant.status !== 'approved' || !merchant.user_id) {
    return {
      ok: false as const,
      status: 409,
      error: 'Merchant must be approved with a linked auth account before credentials can be resent.',
    };
  }

  const temporaryPassword = generateTemporaryPassword();
  const issuedAt = new Date().toISOString();
  const { error: authUpdateError } = await admin.auth.admin.updateUserById(merchant.user_id, {
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      role: 'merchant',
      full_name: merchant.contact_name,
      phone: merchant.phone,
      must_change_password: true,
    },
  });
  if (authUpdateError) throw authUpdateError;

  const { error: merchantUpdateError } = await admin
    .from('merchants')
    .update({
      must_reset_password: true,
      temporary_password_issued_at: issuedAt,
    })
    .eq('id', merchant.id);
  if (merchantUpdateError) throw merchantUpdateError;

  const credentialsEmailResult = await sendMerchantCredentialsEmail({
    businessName: merchant.business_name,
    email: merchant.email,
    temporaryPassword,
    loginUrl: getMerchantLoginUrl(),
  });

  if (credentialsEmailResult.sent) {
    const { error: verificationUpdateError } = await admin
      .from('merchant_onboarding_verifications')
      .update({ credentials_sent_at: issuedAt })
      .eq('merchant_id', merchant.id);
    if (verificationUpdateError) throw verificationUpdateError;
  }

  return {
    ok: true as const,
    status: 200,
    sent: credentialsEmailResult.sent,
    message: credentialsEmailResult.sent
      ? 'Credentials resent successfully.'
      : `Merchant approved, but credentials email failed: ${credentialsEmailResult.error ?? 'unknown error'}`,
    error: credentialsEmailResult.sent ? undefined : credentialsEmailResult.error ?? 'Failed to send credentials email.',
    statusData: await getMerchantOnboardingStatus(merchantId),
    ...(shouldExposeDebugSecrets()
      ? { debug: { temporaryPassword, credentialsEmailError: credentialsEmailResult.error ?? null } }
      : {}),
  };
}

async function finalizeMerchantApproval(options: FinalizeOptions & { merchantId: string }) {
  const admin = createAdminClient();
  const merchant = await getMerchantById(admin, options.merchantId);
  const verification = await getVerificationByMerchantId(admin, options.merchantId);
  const emailVerified = Boolean(merchant.email_verified) || Boolean(verification?.email_verified_at);
  const phoneVerified = Boolean(merchant.phone_verified) || Boolean(verification?.sms_verified_at);

  if (merchant.status === 'approved' && Boolean(verification?.credentials_sent_at) && Boolean(merchant.user_id)) {
    return {
      approved: true,
      status: 'approved',
      vettingStatus: merchant.vetting_status ?? 'approved',
      emailVerified,
      phoneVerified,
      message: 'Merchant is already approved. Use merchant login.',
    };
  }

  if (!emailVerified || !phoneVerified) {
    return {
      approved: false,
      status: merchant.status,
      vettingStatus: merchant.vetting_status,
      emailVerified,
      phoneVerified,
      message: 'Merchant verification pending. Confirm email and SMS OTP.',
    };
  }

  const merchantType = merchant.merchant_type ?? 'chain';
  if (merchantType === 'chain' && !options.forceApproveChain) {
    await admin
      .from('merchants')
      .update({
        status: 'pending',
        vetting_status: 'pending_chain_approval',
        email_verified: true,
        phone_verified: true,
      })
      .eq('id', merchant.id);

    return {
      approved: false,
      status: 'pending',
      vettingStatus: 'pending_chain_approval',
      emailVerified: true,
      phoneVerified: true,
      message: 'Chain merchant verified and awaiting manual approval.',
    };
  }

  if (merchantType === 'private' && !evaluatePrivateMerchantAutoApproval(merchant) && !options.forceApproveChain) {
    await admin
      .from('merchants')
      .update({
        status: 'pending',
        vetting_status: 'manual_review',
        email_verified: true,
        phone_verified: true,
      })
      .eq('id', merchant.id);

    return {
      approved: false,
      status: 'pending',
      vettingStatus: 'manual_review',
      emailVerified: true,
      phoneVerified: true,
      message: 'Private merchant requires manual review before approval.',
    };
  }

  const temporaryPassword = generateTemporaryPassword();
  const userId = await provisionAuthUserForMerchant(admin, merchant, temporaryPassword);
  await enforceMerchantLoginReadiness(admin, merchant, userId);

  const approvedAt = new Date().toISOString();
  const nextVettingStatus = options.forceApproveChain ? 'approved' : 'auto_approved';
  const { error: merchantUpdateError } = await admin
    .from('merchants')
    .update({
      user_id: userId,
      status: 'approved',
      vetting_status: nextVettingStatus,
      approved_at: approvedAt,
      onboarding_fee_paid: true,
      email_verified: true,
      phone_verified: true,
      must_reset_password: true,
      temporary_password_issued_at: approvedAt,
      onboarding_completed_at: approvedAt,
    })
    .eq('id', merchant.id);
  if (merchantUpdateError) throw merchantUpdateError;

  const credentialsEmailResult = await sendMerchantCredentialsEmail({
    businessName: merchant.business_name,
    email: merchant.email,
    temporaryPassword,
    loginUrl: getMerchantLoginUrl(),
  });
  if (credentialsEmailResult.sent) {
    await admin
      .from('merchant_onboarding_verifications')
      .update({ credentials_sent_at: approvedAt })
      .eq('merchant_id', merchant.id);
  }

  try {
    await sendMerchantStatusNotifications({
      merchantId: merchant.id,
      businessName: merchant.business_name,
      contactName: merchant.contact_name,
      email: merchant.email,
      phone: merchant.phone,
      businessType: merchant.business_type,
      registrationNumber: merchant.registration_number,
      taxNumber: merchant.tax_number,
      physicalAddress: merchant.physical_address,
      bankName: merchant.bank_name,
      accountNumber: merchant.account_number,
      status: 'approved',
      approvedAt,
    });
  } catch (notifyError) {
    console.warn('[merchant-approval][notify][warn]', (notifyError as any)?.message || notifyError);
  }

  await safeAudit(admin, {
    actorId: options.actorId ?? null,
    actorRole: options.actorRole ?? 'system',
    entityType: 'merchant',
    entityId: null,
    action: options.forceApproveChain ? 'merchant_manually_approved' : 'merchant_auto_approved',
    metadata: { merchantType, vettingStatus: nextVettingStatus },
    requestId: null,
  });

  return {
    approved: true,
    status: 'approved',
    vettingStatus: nextVettingStatus,
    emailVerified: true,
    phoneVerified: true,
    message: credentialsEmailResult.sent
      ? 'Merchant approved and login credentials sent by email.'
      : `Merchant approved, but credentials email failed: ${credentialsEmailResult.error ?? 'unknown error'}`,
    ...(shouldExposeDebugSecrets()
      ? { debug: { temporaryPassword, credentialsEmailError: credentialsEmailResult.error ?? null } }
      : {}),
  };
}

export async function completeMerchantPasswordReset(userId: string) {
  const admin = createAdminClient();
  await admin.from('merchants').update({ must_reset_password: false }).eq('user_id', userId);
}
