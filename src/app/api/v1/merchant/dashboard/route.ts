import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';
import { getMerchantComplianceSnapshot } from '@/server/utils/compliance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isMissingColumn(error: any, columnName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const normalizedColumn = columnName.toLowerCase();
  return (
    (message.includes(`column "${normalizedColumn}"`) && message.includes('does not exist')) ||
    (message.includes(`column ${normalizedColumn}`) && message.includes('does not exist')) ||
    (message.includes(`column merchants.${normalizedColumn}`) &&
      message.includes('does not exist')) ||
    (message.includes(`column "merchants.${normalizedColumn}"`) &&
      message.includes('does not exist')) ||
    message.includes(`could not find the '${normalizedColumn}' column`) ||
    message.includes(`could not find the column '${normalizedColumn}'`)
  );
}

function isMissingHierarchyColumn(error: any) {
  return ['merchant_type', 'parent_merchant_id', 'is_branch'].some((column) =>
    isMissingColumn(error, column)
  );
}

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    let merchant;
    try {
      merchant = await resolveMerchantForUser<any>(
        admin,
        user,
        'id,business_name,parent_brand,branch_name,branch_code,city,province,status,onboarding_fee_paid,charity_donation_amount,default_total_discount_pct,created_at,approved_at,email,phone,bank_name,merchant_type,parent_merchant_id,is_branch'
      );
    } catch (error: any) {
      if (!isMissingHierarchyColumn(error)) throw error;
      merchant = await resolveMerchantForUser<any>(
        admin,
        user,
        'id,business_name,parent_brand,branch_name,branch_code,city,province,status,onboarding_fee_paid,charity_donation_amount,default_total_discount_pct,created_at,approved_at,email,phone,bank_name'
      );
      if (merchant) {
        merchant = {
          ...merchant,
          merchant_type: null,
          parent_merchant_id: null,
          is_branch: false,
        };
      }
    }
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }

    const forcedAutoApproval =
      process.env.NODE_ENV === 'test'
        ? ['true', '1', 'yes', 'on'].includes(
            String(
              process.env.FORCE_MERCHANT_AUTO_APPROVAL ??
                process.env.NEXT_PUBLIC_FORCE_MERCHANT_AUTO_APPROVAL ??
                ''
            )
              .trim()
              .toLowerCase()
          )
        : String(
            process.env.FORCE_MERCHANT_AUTO_APPROVAL ??
              process.env.NEXT_PUBLIC_FORCE_MERCHANT_AUTO_APPROVAL ??
              ''
          )
            .trim()
            .toLowerCase() !== 'false';
    if (forcedAutoApproval && String(merchant.status ?? '').toLowerCase() === 'pending') {
      merchant = {
        ...merchant,
        status: 'approved',
      };
    }

    const { data: payouts, error: payoutsError } = await admin
      .from('merchant_payouts')
      .select('id,amount,status,payout_date,created_at')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    if (payoutsError) throw payoutsError;
    const complianceSnapshot = await getMerchantComplianceSnapshot(
      admin,
      merchant.id,
      merchant.status
    );

    return NextResponse.json(
      {
        merchant,
        payouts: payouts ?? [],
        compliance: {
          overallStatus: complianceSnapshot.overallStatus,
          complianceApproved: complianceSnapshot.complianceApproved,
          canReceivePayouts: complianceSnapshot.canReceivePayouts,
          missingDocuments: complianceSnapshot.missingDocuments,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load merchant dashboard.' },
      { status: 500 }
    );
  }
}
