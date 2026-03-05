/**
 * Merchant Dashboard KPI Endpoints
 * Section 11 of Technical Specification - Merchant Dashboard KPI Specification
 * 
 * Returns real-time KPIs:
 * - Total Paid Out (Invoice with payment_at)
 * - Pending Payouts (Invoice with pending status)
 * - Active Products (VoucherProduct with status=active)
 * - Volume (Sales): SUM of transactions
 * - Platform Margin: SUM(platform_revenue)
 * - Avg Discount: AVG(total_discount_pct)
 * - Transactions: COUNT of transactions
 * - Consumer Savings: SUM(consumer_benefit_amount)
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isMerchantRole, resolveUserRole } from '@/server/utils/role';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';

export const dynamic = 'force-dynamic';

export interface MerchantDashboardKPIs {
  totalPaidOut: {
    value: number;
    currency: string;
    color: string;
  };
  pendingPayouts: {
    value: number;
    currency: string;
    color: string;
  };
  activeProducts: {
    value: number;
    color: string;
  };
  volumeSales: {
    value: number;
    currency: string;
    color: string;
  };
  platformMargin: {
    value: number;
    currency: string;
    color: string;
  };
  avgDiscount: {
    value: number;
    unit: string;
    color: string;
  };
  transactions: {
    value: number;
    color: string;
  };
  consumerSavings: {
    value: number;
    currency: string;
    color: string;
  };
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await resolveUserRole(supabase, user);

    if (!isMerchantRole(userRole.role)) {
      return NextResponse.json(
        { error: 'Only merchants can access dashboard KPIs.' },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<{
      id: string;
      business_name: string | null;
    }>(admin, user, 'id,business_name');
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant profile not found.' },
        { status: 404 }
      );
    }
    // Fetch all KPI data in parallel
    const [
      paidOutData,
      pendingData,
      activeProductsData,
      transactionStatsData,
      consumerSavingsData,
    ] = await Promise.all([
      // Total Paid Out - Sum of completed invoices
      admin
        .from('invoices')
        .select('amount', { count: 'exact' })
        .eq('merchant_id', merchant.id)
        .eq('payment_status', 'completed')
        .then(({ data, error }) => {
          if (error) throw error;
          const total = (data ?? []).reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0);
          return total;
        }),

      // Pending Payouts - Sum of pending invoices
      admin
        .from('invoices')
        .select('amount')
        .eq('merchant_id', merchant.id)
        .eq('payment_status', 'pending')
        .then(({ data, error }) => {
          if (error) throw error;
          const total = (data ?? []).reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0);
          return total;
        }),

      // Active Products - Count of active merchant products
      admin
        .from('merchant_products')
        .select('id', { count: 'exact' })
        .eq('merchant_id', merchant.id)
        .eq('is_active', true)
        .then(({ count, error }) => {
          if (error) throw error;
          return count ?? 0;
        }),

      // Transaction Statistics
      admin
        .from('payment_transactions')
        .select(
          'amount,total_discount_pct,evoucher_benefit_amount',
          { count: 'exact' }
        )
        .eq('merchant_id', merchant.id)
        .eq('payment_status', 'completed')
        .then(({ data, count, error }) => {
          if (error) throw error;
          const transactions = data ?? [];
          const volume = transactions.reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);
          const avgDiscount =
            transactions.length > 0
              ? transactions.reduce((sum, tx) => sum + Number(tx.total_discount_pct ?? 0), 0) /
                transactions.length
              : 0;
          const platformMargin = transactions.reduce(
            (sum, tx) => sum + Number(tx.evoucher_benefit_amount ?? 0),
            0
          );
          return {
            count: count ?? 0,
            volume,
            avgDiscount,
            platformMargin,
          };
        }),

      // Consumer Savings - Sum of consumer benefit amounts
      admin
        .from('payment_transactions')
        .select('consumer_benefit_amount')
        .eq('merchant_id', merchant.id)
        .eq('payment_status', 'completed')
        .then(({ data, error }) => {
          if (error) throw error;
          const total = (data ?? []).reduce(
            (sum, tx) => sum + Number(tx.consumer_benefit_amount ?? 0),
            0
          );
          return total;
        }),
    ]);

    // Determine gradient colors based on values
    const getGradientColor = (value: number, threshold1: number, threshold2: number): string => {
      if (value >= threshold2) return 'teal-gradient'; // High - teal
      if (value >= threshold1) return 'blue-gradient'; // Medium - blue
      return 'gray-gradient'; // Low - gray
    };

    const kpis: MerchantDashboardKPIs = {
      totalPaidOut: {
        value: Math.round(paidOutData * 100) / 100,
        currency: 'ZAR',
        color: getGradientColor(paidOutData, 10000, 50000),
      },
      pendingPayouts: {
        value: Math.round(pendingData * 100) / 100,
        currency: 'ZAR',
        color: getGradientColor(pendingData, 5000, 20000),
      },
      activeProducts: {
        value: activeProductsData,
        color: getGradientColor(activeProductsData, 5, 20),
      },
      volumeSales: {
        value: Math.round(transactionStatsData.volume * 100) / 100,
        currency: 'ZAR',
        color: getGradientColor(transactionStatsData.volume, 10000, 50000),
      },
      platformMargin: {
        value: Math.round(transactionStatsData.platformMargin * 100) / 100,
        currency: 'ZAR',
        color: getGradientColor(transactionStatsData.platformMargin, 500, 2000),
      },
      avgDiscount: {
        value: Math.round(transactionStatsData.avgDiscount * 100) / 100,
        unit: '%',
        color: transactionStatsData.avgDiscount >= 7 ? 'orange-gradient' : 'green-gradient',
      },
      transactions: {
        value: transactionStatsData.count,
        color: getGradientColor(transactionStatsData.count, 50, 200),
      },
      consumerSavings: {
        value: Math.round(consumerSavingsData * 100) / 100,
        currency: 'ZAR',
        color: getGradientColor(consumerSavingsData, 5000, 20000),
      },
    };

    return NextResponse.json({
      merchantId: merchant.id,
      merchantName: merchant.business_name,
      kpis,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[/api/merchant/dashboard/kpis] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch KPIs.' },
      { status: 500 }
    );
  }
}
