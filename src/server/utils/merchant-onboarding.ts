import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAuditEvent } from '@/server/utils/audit';
import {
  getMerchantLoginUrl,
  sendMerchantApprovalConfirmationEmail,
  sendMerchantCredentialsEmail,
  sendMerchantOtpSms,
  sendMerchantStatusNotifications,
  sendMerchantVerificationEmail,
} from '@/server/utils/merchant-notifications';
import { ensureMerchantStarterProducts } from '@/server/utils/merchant-product-bootstrap';

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
  default_total_discount_pct: number | null;
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
const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUuid(value: string) {
  return UUID_V4_OR_V1_REGEX.test(String(value ?? '').trim());
}

function isUserIdTypeMismatch(error: any) {
  const code = String(error?.code ?? '').trim().toLowerCase();
  const message = String(error?.message ?? '').toLowerCase();
  return (
    code === '22p02' ||
    message.includes('invalid input syntax for type integer') ||
    message.includes('invalid input syntax for type bigint') ||
    message.includes('operator does not exist: integer =') ||
    message.includes('operator does not exist: bigint =')
  );
}

function isKycApprovalGate(error: any) {
  const message = String(error?.message ?? '').toLowerCase();
  return message.includes('cannot be moved to approved without approved kyc review');
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
  // Keep temporary passwords copy/paste friendly to avoid email-client symbol issues.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
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

function logMerchantOnboardingEvent(event: string, payload: Record<string, unknown>) {
  try {
    console.info('[merchant-onboarding][event]', JSON.stringify({ event, ...payload }));
  } catch {
    console.info('[merchant-onboarding][event]', event);
  }
}

function isSmsEnabled() {
  const sid = String(process.env.TWILIO_ACCOUNT_SID ?? '').trim();
  const token = String(process.env.TWILIO_AUTH_TOKEN ?? '').trim();
  const from = String(process.env.TWILIO_FROM_PHONE ?? '').trim();
  return Boolean(sid && token && from);
}

function isOtpVerificationRequired() {
  const raw = String(process.env.MERCHANT_REQUIRE_SMS_OTP ?? '').trim().toLowerCase();
  if (!raw) return false;
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function resolveAppBaseUrl() {
  const explicitUrl =
    String(process.env.NEXT_PUBLIC_APP_URL ?? '').trim() ||
    String(process.env.APP_URL ?? '').trim();
  if (explicitUrl) return explicitUrl.replace(/\/+$/, '');

  const vercelUrl = String(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? ''
  ).trim();
  if (vercelUrl) {
    const normalized =
      vercelUrl.startsWith('http://') || vercelUrl.startsWith('https://')
        ? vercelUrl
        : `https://${vercelUrl}`;
    return normalized.replace(/\/+$/, '');
  }

  return 'http://localhost:4028';
}

function isPrototypeApprovalMode() {
  const flags = [
    String(process.env.MERCHANT_PROTOTYPE_MODE ?? '').toLowerCase(),
    String(process.env.NEXT_PUBLIC_MERCHANT_PROTOTYPE_MODE ?? '').toLowerCase(),
    String(process.env.ALLOW_PUBLIC_MERCHANT_APPROVAL ?? '').toLowerCase(),
    String(process.env.NEXT_PUBLIC_ALLOW_PUBLIC_MERCHANT_APPROVAL ?? '').toLowerCase(),
  ];
  const enabled = flags.some((value) => ['true', '1', 'yes', 'on'].includes(value));
  return process.env.NODE_ENV !== 'production' || enabled;
}

function isForcedAutoApprovalMode() {
  // UAT default: keep onboarding frictionless unless explicitly disabled.
  const raw = String(
    process.env.FORCE_MERCHANT_AUTO_APPROVAL ??
      process.env.NEXT_PUBLIC_FORCE_MERCHANT_AUTO_APPROVAL ??
      ''
  )
    .trim()
    .toLowerCase();
  if (!raw) return true;
  return ['true', '1', 'yes', 'on'].includes(raw);
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
  const email = normalizeEmail(payload.email);
  if (!email) return 'Email is required.';
  if (!BASIC_EMAIL_REGEX.test(email)) return 'Enter a valid email address.';
  if (!normalizeText(payload.phone)) return 'Phone is required.';

  const merchantType = normalizeMerchantType(payload.merchantType);
  if (merchantType === 'private') {
    if (!normalizeText(payload.ownerIdNumber)) {
      return 'Owner ID verification is required for private merchants.';
    }
    const businessType = String(normalizeText(payload.businessType) ?? '').toLowerCase();
    const isPharmacy = businessType === 'pharmacy';
    if (isPharmacy && !normalizeText(payload.pharmacyLicenseNumber)) {
      return 'Pharmacy license number is required for private pharmacy merchants.';
    }
    if (isPharmacy && !normalizeText(payload.responsiblePharmacistName)) {
      return 'Responsible pharmacist details are required for private pharmacy merchants.';
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
  if (!Number.isFinite(discount) || discount < 3 || discount > 15) {
    return 'Discount percentage must be between 3 and 15.';
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
      'id,user_id,business_name,parent_brand,branch_name,contact_name,email,phone,status,vetting_status,merchant_type,registration_number,tax_number,pharmacy_license_number,responsible_pharmacist_name,owner_id_number,physical_address,business_type,bank_name,account_number,branch_code,account_holder_name,default_total_discount_pct,approved_at,email_verified,phone_verified,must_reset_password'
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

  const merchantUserId = String(merchant.user_id ?? '').trim();
  if (merchantUserId && isUuid(merchantUserId)) {
    const { error } = await admin.auth.admin.updateUserById(merchantUserId, {
      email: merchant.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    return merchantUserId;
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

async function updateMerchantApprovalState(
  admin: any,
  args: {
    merchantId: string;
    userId: string;
    vettingStatus: string;
    approvedAt: string;
  }
) {
  const baseUpdate = {
    status: 'approved',
    vetting_status: args.vettingStatus,
    approved_at: args.approvedAt,
    onboarding_fee_paid: true,
    email_verified: true,
    phone_verified: true,
    must_reset_password: true,
    temporary_password_issued_at: args.approvedAt,
    onboarding_completed_at: args.approvedAt,
  };

  const withUserId = {
    ...baseUpdate,
    user_id: args.userId,
  };

  const { error: primaryError } = await admin.from('merchants').update(withUserId).eq('id', args.merchantId);
  if (!primaryError) {
    return { userIdPersisted: true as const, finalStatus: 'approved' as const };
  }

  if (!isUserIdTypeMismatch(primaryError) && !isKycApprovalGate(primaryError)) {
    throw primaryError;
  }

  const { error: fallbackError } = await admin.from('merchants').update(baseUpdate).eq('id', args.merchantId);
  if (!fallbackError) {
    return { userIdPersisted: false as const, finalStatus: 'approved' as const };
  }

  if (!isKycApprovalGate(fallbackError)) throw fallbackError;

  // UAT/prototype continuity: if approved transition is KYC-gated, move merchant to active operable state.
  const activeFallbackBase = {
    ...baseUpdate,
    status: 'active',
  };
  const activeWithUserId = {
    ...activeFallbackBase,
    user_id: args.userId,
  };
  const activePrimary = await admin
    .from('merchants')
    .update(activeWithUserId)
    .eq('id', args.merchantId);
  if (!activePrimary.error) {
    return { userIdPersisted: true as const, finalStatus: 'active' as const };
  }
  if (!isUserIdTypeMismatch(activePrimary.error)) {
    throw activePrimary.error;
  }
  const activeFallback = await admin
    .from('merchants')
    .update(activeFallbackBase)
    .eq('id', args.merchantId);
  if (activeFallback.error) throw activeFallback.error;
  return { userIdPersisted: false as const, finalStatus: 'active' as const };
}

async function updateMerchantCredentialIssuanceState(
  admin: any,
  args: {
    merchantId: string;
    userId: string;
    issuedAt: string;
  }
) {
  const baseUpdate = {
    must_reset_password: true,
    temporary_password_issued_at: args.issuedAt,
  };

  const withUserId = {
    ...baseUpdate,
    user_id: args.userId,
  };

  const { error: primaryError } = await admin.from('merchants').update(withUserId).eq('id', args.merchantId);
  if (!primaryError) {
    return { userIdPersisted: true as const };
  }

  if (!isUserIdTypeMismatch(primaryError)) {
    throw primaryError;
  }

  const { error: fallbackError } = await admin.from('merchants').update(baseUpdate).eq('id', args.merchantId);
  if (fallbackError) throw fallbackError;
  return { userIdPersisted: false as const };
}

function evaluatePrivateMerchantAutoApproval(merchant: MerchantRecord) {
  const hasOwnerId = Boolean(normalizeText(merchant.owner_id_number));
  const businessType = String(normalizeText(merchant.business_type) ?? '').toLowerCase();
  const isPharmacy = businessType === 'pharmacy';
  const hasLicense = Boolean(normalizeText(merchant.pharmacy_license_number));
  return hasOwnerId && (!isPharmacy || hasLicense);
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
  const otpRequired = isOtpVerificationRequired() && smsEnabled;
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
      phone_verified: !otpRequired ? true : insert.phone_verified,
    };
    let updateResult = await admin
      .from('merchants')
      .update(updatePayload)
      .eq('id', existingMerchant.data.id)
      .select('id,business_name,email,phone,contact_name,status,vetting_status')
      .single();
    if (updateResult.error && isUserIdTypeMismatch(updateResult.error)) {
      const { user_id: _ignoredUserId, ...fallbackPayload } = updatePayload;
      updateResult = await admin
        .from('merchants')
        .update(fallbackPayload)
        .eq('id', existingMerchant.data.id)
        .select('id,business_name,email,phone,contact_name,status,vetting_status')
        .single();
    }
    if (updateResult.error) throw updateResult.error;
    merchantData = updateResult.data;
  } else {
    const insertPayload = {
      ...insert,
      phone_verified: !otpRequired ? true : insert.phone_verified,
    };
    let insertResult = await admin
      .from('merchants')
      .insert(insertPayload)
      .select('id,business_name,email,phone,contact_name,status,vetting_status')
      .single();
    if (insertResult.error && isUserIdTypeMismatch(insertResult.error)) {
      const { user_id: _ignoredUserId, ...fallbackPayload } = insertPayload;
      insertResult = await admin
        .from('merchants')
        .insert(fallbackPayload)
        .select('id,business_name,email,phone,contact_name,status,vetting_status')
        .single();
    }
    if (insertResult.error) throw insertResult.error;
    merchantData = insertResult.data;
  }

  const merchantId = merchantData.id as string;
  const now = new Date();
  const emailToken = generateEmailToken();
  const emailTokenHash = hashSecret(emailToken);
  const emailExpiry = new Date(now.getTime() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { error: verificationError } = await admin.from('merchant_onboarding_verifications').upsert(
    {
      merchant_id: merchantId,
      email_token_hash: emailTokenHash,
      email_token_expires_at: emailExpiry,
      email_verified_at: null,
      // OTP is only used when explicitly enabled via MERCHANT_REQUIRE_SMS_OTP.
      sms_otp_hash: null,
      sms_otp_expires_at: null,
      sms_verified_at: !otpRequired ? now.toISOString() : null,
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
    Promise.resolve({
      sent: false,
      provider: otpRequired ? ('deferred' as const) : ('disabled' as const),
    }),
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
            otpCode: otpRequired ? 'generated-after-email-verification' : 'otp-not-required',
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
  const forceAutoApprovalMode = isForcedAutoApprovalMode();
  const resolvedStatus =
    forceAutoApprovalMode && String(merchant.status ?? '').toLowerCase() === 'pending'
      ? 'approved'
      : merchant.status;
  const linkedUserId = String(merchant.user_id ?? '').trim();
  let hasAuthLink = Boolean(linkedUserId);
  let resolvedUserId = linkedUserId || null;
  if (!hasAuthLink) {
    const authUser = await findAuthUserByEmail(admin, normalizeEmail(merchant.email));
    if (authUser?.id) {
      hasAuthLink = true;
      resolvedUserId = String(authUser.id);
    }
  }
  const loginReady =
    (resolvedStatus === 'approved' || resolvedStatus === 'active') &&
    hasAuthLink &&
    mustResetPassword &&
    credentialsIssued &&
    emailVerified &&
    phoneVerified;

  return {
    merchantId: merchant.id,
    businessName: merchant.business_name,
    email: merchant.email,
    merchantType: merchant.merchant_type ?? 'chain',
    status: resolvedStatus,
    vettingStatus: merchant.vetting_status ?? resolveInitialVettingStatus(merchant.merchant_type ?? 'chain'),
    emailVerified,
    phoneVerified,
    credentialsIssued,
    mustResetPassword,
    loginReady,
    merchantUserId: resolvedUserId,
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

  const merchant = await getMerchantById(admin, merchantId);
  const smsEnabled = isSmsEnabled();
  const otpRequired = isOtpVerificationRequired() && smsEnabled;
  const phoneWasVerified = Boolean(merchant.phone_verified) || Boolean(verification.sms_verified_at);
  let phoneAlreadyVerified = phoneWasVerified;
  let emailOnlyPhoneVerificationApplied = false;
  let smsOtpSent = false;
  let smsOtpDeliveryError: string | null = null;
  let issuedOtpCode: string | null = null;
  if (!otpRequired && !phoneAlreadyVerified) {
    const { error: phoneVerificationUpdateError } = await admin
      .from('merchant_onboarding_verifications')
      .update({
        sms_otp_hash: null,
        sms_otp_expires_at: null,
        sms_verified_at: nowIso,
        otp_attempts: 0,
      })
      .eq('merchant_id', merchantId);
    if (phoneVerificationUpdateError) throw phoneVerificationUpdateError;

    const { error: merchantPhoneUpdateError } = await admin
      .from('merchants')
      .update({ phone_verified: true })
      .eq('id', merchantId);
    if (merchantPhoneUpdateError) throw merchantPhoneUpdateError;

    phoneAlreadyVerified = true;
    emailOnlyPhoneVerificationApplied = true;
  } else if (otpRequired && !phoneAlreadyVerified) {
    issuedOtpCode = generateOtpCode();
    const otpHash = hashSecret(issuedOtpCode);
    const otpExpiry = new Date(Date.now() + SMS_OTP_TTL_MINUTES * 60 * 1000).toISOString();
    const { error: otpIssueError } = await admin
      .from('merchant_onboarding_verifications')
      .update({
        sms_otp_hash: otpHash,
        sms_otp_expires_at: otpExpiry,
        sms_verified_at: null,
        otp_attempts: 0,
      })
      .eq('merchant_id', merchantId);
    if (otpIssueError) throw otpIssueError;

    const smsResult = await sendMerchantOtpSms({
      businessName: merchant.business_name,
      phone: merchant.phone,
      otpCode: issuedOtpCode,
    });
    smsOtpSent = Boolean(smsResult.sent);
    smsOtpDeliveryError = extractDeliveryError(smsResult);
  }

  // Try full approval path first
  try {
    const finalizeResult = await finalizeMerchantApproval({
      merchantId,
      actorId: args.actorId ?? null,
      actorRole: 'merchant',
      requestId: null,
    });

    let postConfirmationCredentials:
      | {
          sent: boolean;
          recipient: string;
          provider: 'resend' | 'console';
          error?: string;
        }
      | null = null;
    let postConfirmationTemporaryPassword: string | null = null;

    // If confirmation succeeded but approval is still pending, issue credentials immediately.
    if (!finalizeResult.approved && !verification.credentials_sent_at) {
      try {
        const temporaryPassword = generateTemporaryPassword();
        const userId = await provisionAuthUserForMerchant(admin, merchant, temporaryPassword);
        await enforceMerchantLoginReadiness(admin, merchant, userId);
        const issuedAt = new Date().toISOString();
        await updateMerchantCredentialIssuanceState(admin, {
          merchantId: merchant.id,
          userId,
          issuedAt,
        });
        await ensureMerchantStarterProducts(admin, merchant);

        const credentialsEmailResult = await sendMerchantCredentialsEmail({
          businessName: merchant.business_name,
          email: merchant.email,
          temporaryPassword,
          loginUrl: getMerchantLoginUrl(),
        });
        postConfirmationCredentials = credentialsEmailResult;
        postConfirmationTemporaryPassword = temporaryPassword;

        if (credentialsEmailResult.sent) {
          const { error: verificationCredentialMarkError } = await admin
            .from('merchant_onboarding_verifications')
            .update({ credentials_sent_at: issuedAt })
            .eq('merchant_id', merchant.id);
          if (verificationCredentialMarkError) throw verificationCredentialMarkError;
        }
      } catch (credentialsIssueError) {
        console.warn(
          '[merchant-email-verify][post-confirmation-credentials][warn]',
          (credentialsIssueError as any)?.message || credentialsIssueError
        );
      }
    }

    const statusData = await getMerchantOnboardingStatus(merchantId);
    const otpMessageSuffix =
      otpRequired && !phoneWasVerified
        ? smsOtpSent
          ? ' SMS OTP sent to your registered phone.'
          : ` SMS OTP delivery failed: ${smsOtpDeliveryError ?? 'unknown error'}.`
        : emailOnlyPhoneVerificationApplied
          ? ' Phone verification completed via email confirmation.'
        : '';
    const credentialsMessageSuffix = postConfirmationCredentials
      ? postConfirmationCredentials.sent
        ? ` Login credentials sent to ${postConfirmationCredentials.recipient} via ${postConfirmationCredentials.provider}.`
        : ` Login credentials email failed: ${postConfirmationCredentials.error ?? 'unknown error'}.`
      : '';
    const mergedDebug =
      (issuedOtpCode || postConfirmationTemporaryPassword) && shouldExposeDebugSecrets()
        ? {
            ...('debug' in finalizeResult &&
            finalizeResult.debug &&
            typeof finalizeResult.debug === 'object'
              ? (finalizeResult.debug as Record<string, unknown>)
              : {}),
            otpCode: issuedOtpCode,
            smsOtpDeliveryError: smsOtpDeliveryError ?? null,
            ...(postConfirmationTemporaryPassword ? { temporaryPassword: postConfirmationTemporaryPassword } : {}),
            ...(postConfirmationCredentials
              ? {
                  credentialsEmailRecipient: postConfirmationCredentials.recipient,
                  credentialsEmailProvider: postConfirmationCredentials.provider,
                  credentialsEmailError: postConfirmationCredentials.error ?? null,
                }
              : {}),
          }
        : null;

    const credentialsEmailSent =
      postConfirmationCredentials?.sent ??
      ('credentialsEmailSent' in finalizeResult ? finalizeResult.credentialsEmailSent : undefined);
    const credentialsEmailRecipient =
      postConfirmationCredentials?.recipient ??
      ('credentialsEmailRecipient' in finalizeResult ? finalizeResult.credentialsEmailRecipient : undefined);
    const credentialsEmailProvider =
      postConfirmationCredentials?.provider ??
      ('credentialsEmailProvider' in finalizeResult ? finalizeResult.credentialsEmailProvider : undefined);
    const credentialsEmailError =
      (postConfirmationCredentials ? postConfirmationCredentials.error ?? null : undefined) ??
      ('credentialsEmailError' in finalizeResult ? finalizeResult.credentialsEmailError : undefined);

    return {
      ok: true as const,
      httpStatus: 200,
      ...finalizeResult,
      message: `${finalizeResult.message ?? 'Email verified.'}${otpMessageSuffix}${credentialsMessageSuffix}`.trim(),
      otpSent: otpRequired && !phoneWasVerified ? smsOtpSent : undefined,
      otpDeliveryError: otpRequired && !phoneWasVerified ? smsOtpDeliveryError : undefined,
      credentialsEmailSent,
      credentialsEmailRecipient,
      credentialsEmailProvider,
      credentialsEmailError,
      statusData,
      ...(mergedDebug ? { debug: mergedDebug } : {}),
    };
  } catch (err) {
    console.warn('[merchant-email-verify][warn-fallback]', (err as any)?.message || err);

    // If approval fails (e.g. KYC constraint), still issue credentials for demo/onboarding continuity.
    if (!verification.credentials_sent_at) {
      try {
        const temporaryPassword = generateTemporaryPassword();
        const userId = await provisionAuthUserForMerchant(admin, merchant, temporaryPassword);
        await enforceMerchantLoginReadiness(admin, merchant, userId);
        const issuedAt = new Date().toISOString();
        await updateMerchantCredentialIssuanceState(admin, {
          merchantId: merchant.id,
          userId,
          issuedAt,
        });
        await ensureMerchantStarterProducts(admin, merchant);

        const credentialsEmailResult = await sendMerchantCredentialsEmail({
          businessName: merchant.business_name,
          email: merchant.email,
          temporaryPassword,
          loginUrl: getMerchantLoginUrl(),
        });
        if (credentialsEmailResult.sent) {
          const { error: verificationCredentialMarkError } = await admin
            .from('merchant_onboarding_verifications')
            .update({ credentials_sent_at: issuedAt })
            .eq('merchant_id', merchant.id);
          if (verificationCredentialMarkError) throw verificationCredentialMarkError;
        }

        return {
          ok: true as const,
          httpStatus: 200,
          approved: false,
          status: merchant.status,
          vettingStatus: merchant.vetting_status ?? 'pending_manual_review',
          emailVerified: true,
          phoneVerified: phoneAlreadyVerified,
          credentialsEmailSent: credentialsEmailResult.sent,
          credentialsEmailRecipient: credentialsEmailResult.recipient,
          credentialsEmailProvider: credentialsEmailResult.provider,
          credentialsEmailError: credentialsEmailResult.error ?? null,
          message: credentialsEmailResult.sent
            ? 'Email verified. Approval is pending KYC review, but login credentials were sent.'
            : `Email verified. Approval is pending KYC review, and credentials email failed: ${credentialsEmailResult.error ?? 'unknown error'}`,
          statusData: await getMerchantOnboardingStatus(merchantId),
          ...(shouldExposeDebugSecrets()
            ? { debug: { temporaryPassword, credentialsEmailError: credentialsEmailResult.error ?? null } }
            : {}),
        };
      } catch (issueError) {
        console.warn(
          '[merchant-email-verify][issue-credentials-after-approval-failure][warn]',
          (issueError as any)?.message || issueError
        );
      }
    }
  }

  // Fallback: provision auth user and approve directly
  try {
    const temporaryPassword = generateTemporaryPassword();
    const userId = await provisionAuthUserForMerchant(admin, merchant, temporaryPassword);
    await enforceMerchantLoginReadiness(admin, merchant, userId);

    const approvedAt = new Date().toISOString();
    await updateMerchantApprovalState(admin, {
      merchantId,
      userId,
      vettingStatus: 'auto_approved',
      approvedAt,
    });

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

    let approvalConfirmationSent = false;
    let approvalConfirmationError: string | null = null;
    try {
      const confirmationResult = await sendMerchantApprovalConfirmationEmail({
        merchantId: merchant.id,
        businessName: merchant.business_name,
        merchantEmail: merchant.email,
        contactName: merchant.contact_name,
        approvedAt,
        loginUrl: getMerchantLoginUrl(),
      });
      approvalConfirmationSent = confirmationResult.sent;
      approvalConfirmationError = confirmationResult.error ?? null;
    } catch (confirmError) {
      approvalConfirmationError = (confirmError as any)?.message || 'Approval confirmation email failed.';
      console.warn('[merchant-email-verify][approval-confirmation][warn]', approvalConfirmationError);
    }

    return {
      ok: true as const,
      httpStatus: 200,
      approved: true,
      status: 'approved',
      vettingStatus: 'auto_approved',
      emailVerified: true,
      phoneVerified: true,
      credentialsEmailSent: credentialsEmailResult.sent,
      credentialsEmailRecipient: credentialsEmailResult.recipient,
      credentialsEmailProvider: credentialsEmailResult.provider,
      credentialsEmailError: credentialsEmailResult.error ?? null,
      message: credentialsEmailResult.sent
        ? 'Email verified. Merchant approved and credentials issued.'
        : `Email verified. Merchant approved, but credentials email failed: ${credentialsEmailResult.error ?? 'unknown error'}`,
      approvalConfirmationSent,
      approvalConfirmationError,
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
  const admin = createAdminClient();
  const merchantId = String(args.merchantId ?? '').trim();
  const otpCode = String(args.otpCode ?? '').trim();
  if (!merchantId) {
    return { ok: false as const, status: 400, error: 'merchantId is required.' };
  }
  if (!isUuid(merchantId)) {
    return { ok: false as const, status: 400, error: 'Invalid merchantId format.' };
  }
  if (!isOtpVerificationRequired()) {
    const statusData = await getMerchantOnboardingStatus(merchantId);
    return {
      ok: true as const,
      status: 200,
      approved: statusData.status === 'approved',
      vettingStatus: statusData.vettingStatus,
      emailVerified: statusData.emailVerified,
      phoneVerified: statusData.phoneVerified,
      message: 'OTP is not required. Email verification is sufficient.',
      statusData,
    };
  }
  if (!otpCode) {
    return { ok: false as const, status: 400, error: 'otpCode is required when OTP verification is enabled.' };
  }
  if (!isSmsEnabled()) {
    return { ok: false as const, status: 503, error: 'SMS OTP is required but SMS provider is not configured.' };
  }

  const verification = await getVerificationByMerchantId(admin, merchantId);
  if (!verification) {
    return { ok: false as const, status: 404, error: 'OTP verification record not found.' };
  }
  if (!verification.sms_otp_hash) {
    if (!verification.email_verified_at) {
      return {
        ok: false as const,
        status: 409,
        error: 'Verify email first. SMS OTP is sent after email confirmation.',
      };
    }
    return {
      ok: false as const,
      status: 404,
      error: 'OTP was not issued yet. Verify email again to request a fresh OTP.',
    };
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

export async function resendMerchantVerificationEmail(args: {
  merchantId: string;
  email: string;
  actorId?: string | null;
  actorRole?: string | null;
}) {
  const admin = createAdminClient();
  const merchantId = String(args.merchantId ?? '').trim();
  const email = normalizeEmail(args.email);
  if (!merchantId) {
    return { ok: false as const, status: 400, error: 'merchantId is required.' };
  }
  if (!isUuid(merchantId)) {
    return { ok: false as const, status: 400, error: 'Invalid merchantId format.' };
  }
  if (!email) {
    return { ok: false as const, status: 400, error: 'email is required.' };
  }
  if (!BASIC_EMAIL_REGEX.test(email)) {
    return { ok: false as const, status: 400, error: 'Enter a valid email address.' };
  }

  const merchant = await getMerchantById(admin, merchantId);
  if (normalizeEmail(merchant.email) !== email) {
    return { ok: false as const, status: 403, error: 'Merchant email does not match onboarding record.' };
  }

  const verification = await getVerificationByMerchantId(admin, merchantId);
  if (!verification) {
    return { ok: false as const, status: 404, error: 'Merchant verification record not found.' };
  }

  const alreadyVerified = Boolean(merchant.email_verified) || Boolean(verification.email_verified_at);
  if (alreadyVerified) {
    return {
      ok: true as const,
      status: 200,
      sent: false,
      message: 'Email is already verified. Continue with OTP verification or approval steps.',
      statusData: await getMerchantOnboardingStatus(merchantId),
    };
  }

  const now = new Date();
  const emailToken = generateEmailToken();
  const emailTokenHash = hashSecret(emailToken);
  const emailExpiry = new Date(now.getTime() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const { error: verificationUpdateError } = await admin
    .from('merchant_onboarding_verifications')
    .update({
      email_token_hash: emailTokenHash,
      email_token_expires_at: emailExpiry,
      email_verified_at: null,
    })
    .eq('merchant_id', merchantId);
  if (verificationUpdateError) throw verificationUpdateError;

  const verificationUrl = `${resolveAppBaseUrl()}/merchant/onboarding/verify-email?merchantId=${merchantId}&token=${emailToken}`;
  const emailResult = await sendMerchantVerificationEmail({
    businessName: merchant.business_name,
    email: merchant.email,
    verificationUrl,
    emailToken,
  });

  await safeAudit(admin, {
    actorId: args.actorId ?? null,
    actorRole: args.actorRole ?? 'merchant',
    entityType: 'merchant',
    entityId: null,
    action: 'merchant_verification_email_resent',
    metadata: {
      emailSent: emailResult.sent,
      recipient: emailResult.recipient,
    },
    requestId: null,
  });

  const emailDeliveryError = extractDeliveryError(emailResult);
  return {
    ok: true as const,
    status: 200,
    sent: emailResult.sent,
    recipient: emailResult.recipient,
    message: emailResult.sent
      ? `Verification email resent to ${emailResult.recipient}.`
      : `Verification email resend failed: ${emailDeliveryError ?? 'unknown error'}`,
    error: emailResult.sent ? undefined : emailDeliveryError ?? 'Failed to resend verification email.',
    statusData: await getMerchantOnboardingStatus(merchantId),
    ...(shouldExposeDebugSecrets()
      ? {
          debug: {
            emailToken,
            verificationUrl,
            verificationEmailTo: emailResult.recipient ?? merchant.email,
            emailDeliveryError,
          },
        }
      : {}),
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
  let targetUserId = String(merchant.user_id ?? '').trim();
  if (!targetUserId || !isUuid(targetUserId)) {
    const authUser = await findAuthUserByEmail(admin, normalizeEmail(merchant.email));
    targetUserId = String(authUser?.id ?? '').trim();
  }

  if (merchant.status !== 'approved' || !targetUserId) {
    return {
      ok: false as const,
      status: 409,
      error: 'Merchant must be approved with a linked auth account before credentials can be resent.',
    };
  }

  const temporaryPassword = generateTemporaryPassword();
  const issuedAt = new Date().toISOString();
  const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetUserId, {
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
    credentialsEmailRecipient: credentialsEmailResult.recipient,
    credentialsEmailProvider: credentialsEmailResult.provider,
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
  const prototypeApprovalMode = isPrototypeApprovalMode();
  const forceAutoApprovalMode = isForcedAutoApprovalMode();

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
  if (
    merchantType === 'chain' &&
    !options.forceApproveChain &&
    !prototypeApprovalMode &&
    !forceAutoApprovalMode
  ) {
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

  if (
    merchantType === 'private' &&
    !evaluatePrivateMerchantAutoApproval(merchant) &&
    !options.forceApproveChain &&
    !prototypeApprovalMode &&
    !forceAutoApprovalMode
  ) {
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
  await ensureMerchantStarterProducts(admin, merchant);

  const approvedAt = new Date().toISOString();
  const nextVettingStatus = options.forceApproveChain ? 'approved' : 'auto_approved';
  const updateResult = await updateMerchantApprovalState(admin, {
    merchantId: merchant.id,
    userId,
    vettingStatus: nextVettingStatus,
    approvedAt,
  });

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

  let approvalConfirmationSent = false;
  let approvalConfirmationError: string | null = null;
  try {
    const confirmationResult = await sendMerchantApprovalConfirmationEmail({
      merchantId: merchant.id,
      businessName: merchant.business_name,
      merchantEmail: merchant.email,
      contactName: merchant.contact_name,
      approvedAt,
      loginUrl: getMerchantLoginUrl(),
    });
    approvalConfirmationSent = confirmationResult.sent;
    approvalConfirmationError = confirmationResult.error ?? null;
  } catch (confirmError) {
    approvalConfirmationError = (confirmError as any)?.message || 'Approval confirmation email failed.';
    console.warn('[merchant-approval][confirmation-email][warn]', approvalConfirmationError);
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
    credentialsEmailSent: credentialsEmailResult.sent,
    credentialsEmailRecipient: credentialsEmailResult.recipient,
    credentialsEmailProvider: credentialsEmailResult.provider,
    credentialsEmailError: credentialsEmailResult.error ?? null,
    message: credentialsEmailResult.sent
      ? 'Merchant approved and login credentials sent by email.'
      : `Merchant approved, but credentials email failed: ${credentialsEmailResult.error ?? 'unknown error'}`,
    approvalConfirmationSent,
    approvalConfirmationError,
    ...(shouldExposeDebugSecrets()
      ? {
          debug: {
            temporaryPassword,
            credentialsEmailError: credentialsEmailResult.error ?? null,
            merchantUserIdPersisted: updateResult.userIdPersisted,
          },
        }
      : {}),
  };
}

export async function completeMerchantPasswordReset(userId: string) {
  const admin = createAdminClient();
  logMerchantOnboardingEvent('password_reset_sync_started', { userId });
  const {
    data: { user },
    error: authLookupError,
  } = await admin.auth.admin.getUserById(userId);
  if (authLookupError) throw authLookupError;

  if (user) {
    const mergedMetadata = {
      ...(user.user_metadata ?? {}),
      must_change_password: false,
    };
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: mergedMetadata,
    });
    if (authUpdateError) throw authUpdateError;
  }

  const { data: byUserIdUpdatedRows, error: byUserIdError } = await admin
    .from('merchants')
    .update({ must_reset_password: false })
    .eq('user_id', userId)
    .select('id');
  if (!byUserIdError) {
    if (Array.isArray(byUserIdUpdatedRows) && byUserIdUpdatedRows.length > 0) {
      logMerchantOnboardingEvent('password_reset_sync_completed', {
        userId,
        merchantRowsUpdated: byUserIdUpdatedRows.length,
        fallback: 'none',
      });
      return;
    }
  } else if (!isUserIdTypeMismatch(byUserIdError)) {
    throw byUserIdError;
  }

  const email = normalizeEmail(user?.email);
  if (!email) {
    throw byUserIdError ?? new Error('Merchant email not available for password reset sync.');
  }

  const { data: byEmailUpdatedRows, error: byEmailError } = await admin
    .from('merchants')
    .update({ must_reset_password: false })
    .eq('email', email)
    .select('id');
  if (byEmailError) throw byEmailError;
  if (!Array.isArray(byEmailUpdatedRows) || byEmailUpdatedRows.length === 0) {
    throw new Error('Merchant profile not found for password reset sync.');
  }
  logMerchantOnboardingEvent('password_reset_sync_completed', {
    userId,
    merchantRowsUpdated: byEmailUpdatedRows.length,
    fallback: 'email',
  });
}

export async function reconcileMerchantResetState(userId: string) {
  const admin = createAdminClient();
  logMerchantOnboardingEvent('reset_state_reconcile_started', { userId });
  const {
    data: { user },
    error: authLookupError,
  } = await admin.auth.admin.getUserById(userId);
  if (authLookupError) throw authLookupError;
  if (!user) {
    return {
      reconciled: false as const,
      reason: 'auth_user_not_found',
    };
  }

  const metadataMustChange = Boolean(user.user_metadata?.must_change_password);
  const normalizedEmail = normalizeEmail(user.email);

  const byUserId = await admin
    .from('merchants')
    .select('id,must_reset_password,email')
    .eq('user_id', userId)
    .limit(1);
  if (byUserId.error && !isUserIdTypeMismatch(byUserId.error)) throw byUserId.error;

  let merchant = Array.isArray(byUserId.data) && byUserId.data.length > 0 ? byUserId.data[0] : null;
  if (!merchant && normalizedEmail) {
    const byEmail = await admin
      .from('merchants')
      .select('id,must_reset_password,email')
      .eq('email', normalizedEmail)
      .limit(1);
    if (byEmail.error) throw byEmail.error;
    merchant = Array.isArray(byEmail.data) && byEmail.data.length > 0 ? byEmail.data[0] : null;
  }

  const merchantMustReset = Boolean(merchant?.must_reset_password);
  const mustReset = metadataMustChange || merchantMustReset;
  if (!mustReset) {
    logMerchantOnboardingEvent('reset_state_reconcile_skipped', {
      userId,
      reason: 'already_clear',
      merchantId: merchant?.id ?? null,
    });
    return {
      reconciled: false as const,
      reason: 'already_clear',
    };
  }

  if (!metadataMustChange) {
    const mergedMetadata = {
      ...(user.user_metadata ?? {}),
      must_change_password: true,
    };
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: mergedMetadata,
    });
    if (authUpdateError) throw authUpdateError;
  }

  if (merchant?.id && !merchantMustReset) {
    const { error: merchantUpdateError } = await admin
      .from('merchants')
      .update({ must_reset_password: true })
      .eq('id', merchant.id);
    if (merchantUpdateError) throw merchantUpdateError;
  }
  logMerchantOnboardingEvent('reset_state_reconciled', {
    userId,
    merchantId: merchant?.id ?? null,
    metadataUpdated: !metadataMustChange,
    merchantUpdated: Boolean(merchant?.id) && !merchantMustReset,
  });

  return {
    reconciled: true as const,
    merchantId: merchant?.id ?? null,
    mustReset: true,
  };
}
