import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MerchantOnboardingRequest } from '@/types/domain';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { writeAuditEvent } from '@/server/utils/audit';
import { sendMerchantStatusNotifications } from '@/server/utils/merchant-notifications';

function validate(body: MerchantOnboardingRequest): string | null {
  if (!body.businessName?.trim()) return 'Business name is required.';
  if (!body.contactName?.trim()) return 'Contact name is required.';
  if (!body.email?.trim()) return 'Email is required.';
  if (!body.phone?.trim()) return 'Phone is required.';
  if (
    body.discountPercentage !== undefined &&
    (!Number.isFinite(body.discountPercentage) || body.discountPercentage < 0 || body.discountPercentage > 100)
  ) {
    return 'Discount percentage must be between 0 and 100.';
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as MerchantOnboardingRequest;
    const validationError = validate(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const admin = createAdminClient();
    const email = body.email.trim().toLowerCase();
    const isDevelopment = process.env.NODE_ENV === 'development';
    const autoApproveInDev =
      isDevelopment || String(process.env.AUTO_APPROVE_MERCHANTS_IN_DEV ?? '').toLowerCase() === 'true';
    const nextStatus = autoApproveInDev ? 'approved' : 'pending';
    const approvedAt = autoApproveInDev ? new Date().toISOString() : null;

    const { data: existingByEmail, error: existingError } = await admin
      .from('merchants')
      .select('id,user_id,status')
      .eq('email', email)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingByEmail && existingByEmail.user_id && existingByEmail.user_id !== user.id) {
      return NextResponse.json(
        { error: 'This email is already associated with another merchant account.' },
        { status: 409 }
      );
    }

    const { data: merchant, error: upsertError } = await admin
      .from('merchants')
      .upsert(
        {
          user_id: user.id,
          business_name: body.businessName.trim(),
          parent_brand: body.parentBrand?.trim() || body.businessName.trim(),
          branch_name: body.branchName?.trim() || body.businessName.trim(),
          city: body.city?.trim() || null,
          province: body.province?.trim() || null,
          location_lat: Number.isFinite(body.locationLat) ? Number(body.locationLat) : null,
          location_lng: Number.isFinite(body.locationLng) ? Number(body.locationLng) : null,
          contact_name: body.contactName.trim(),
          email,
          phone: body.phone.trim(),
          registration_number: body.registrationNumber?.trim() || null,
          tax_number: body.taxNumber?.trim() || null,
          physical_address: body.physicalAddress?.trim() || null,
          business_type: body.businessType?.trim() || null,
          bank_name: body.bankName?.trim() || null,
          account_number: body.accountNumber?.trim() || null,
          branch_code: body.branchCode?.trim() || null,
          account_holder_name: body.accountHolderName?.trim() || null,
          default_total_discount_pct: body.discountPercentage ?? 5,
          status: nextStatus,
          approved_at: approvedAt,
          onboarding_fee_paid: autoApproveInDev,
        },
        { onConflict: 'user_id' }
      )
      .select('id,business_name,status,created_at')
      .single();

    if (upsertError) throw upsertError;

    await writeAuditEvent(admin, {
      actorId: user.id,
      actorRole: 'merchant',
      entityType: 'merchant',
      entityId: merchant.id,
      action: autoApproveInDev ? 'merchant_onboarding_auto_approved' : 'merchant_onboarding_submitted',
      metadata: {
        businessName: merchant.business_name,
        status: nextStatus,
        autoApproveInDev,
      },
      requestId: `merchant-onboard-${merchant.id}`,
    });

    const notification = await sendMerchantStatusNotifications({
      merchantId: merchant.id,
      businessName: body.businessName.trim(),
      contactName: body.contactName.trim(),
      email,
      phone: body.phone.trim(),
      businessType: body.businessType?.trim() || null,
      registrationNumber: body.registrationNumber?.trim() || null,
      taxNumber: body.taxNumber?.trim() || null,
      physicalAddress: body.physicalAddress?.trim() || null,
      bankName: body.bankName?.trim() || null,
      accountNumber: body.accountNumber?.trim() || null,
      status: merchant.status,
      approvedAt,
    });

    return NextResponse.json({
      status: merchant.status,
      merchantId: merchant.id,
      autoApproved: autoApproveInDev,
      notification,
      message: autoApproveInDev
        ? 'Merchant onboarding submitted and auto-approved in development.'
        : 'Merchant onboarding submitted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to submit merchant onboarding.' },
      { status: 500 }
    );
  }
}
