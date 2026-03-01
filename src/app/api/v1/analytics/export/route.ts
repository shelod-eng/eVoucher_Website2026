import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isMerchantRole, resolveUserRole } from '@/server/utils/role';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';

type TxnRow = {
  created_at: string;
  amount: number | null;
  consumer_benefit_amount: number | null;
  evoucher_benefit_amount: number | null;
  total_discount_pct: number | null;
  merchant_id: string | null;
};

function asNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

function escapeCsv(value: string | number) {
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function isMissingRelation(error: any, relationName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const relation = relationName.toLowerCase();
  const bareRelation = relation.includes('.') ? relation.split('.').at(-1) ?? relation : relation;
  return (
    message.includes(`relation "${relation}" does not exist`) ||
    message.includes(`relation "${bareRelation}" does not exist`) ||
    message.includes(`could not find the table '${relation}' in the schema cache`) ||
    message.includes(`could not find the table '${bareRelation}' in the schema cache`)
  );
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'unauthenticated' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type') === 'transactions' ? 'transactions' : 'monthly';
    const safeRole = role || 'customer';

    let dataClient: any = supabase;
    let merchantId: string | null = null;
    if (isMerchantRole(safeRole)) {
      let admin: any = null;
      try {
        admin = createAdminClient();
      } catch {
        admin = null;
      }

      if (!admin) {
        return NextResponse.json(
          {
            error:
              'SUPABASE_SERVICE_ROLE_KEY is required for merchant analytics export. Consumer export is available.',
            code: 'missing_admin_env',
          },
          { status: 500 }
        );
      }

      dataClient = admin;
      const merchant = await resolveMerchantForUser<any>(admin, user, 'id');
      if (!merchant?.id) {
        return NextResponse.json(
          { error: 'Merchant profile not found.', code: 'merchant_profile_missing' },
          { status: 404 }
        );
      }
      merchantId = merchant.id;
    }

    let query = dataClient
      .from('payment_transactions')
      .select(
        'created_at,amount,consumer_benefit_amount,evoucher_benefit_amount,total_discount_pct,merchant_id'
      )
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (!isMerchantRole(safeRole)) {
      query = query.eq('customer_id', user.id);
    } else if (merchantId) {
      query = query.eq('merchant_id', merchantId);
    }

    const { data, error } = await query;
    if (error && !isMissingRelation(error, 'public.payment_transactions')) throw error;

    const transactions = (data ?? []) as TxnRow[];
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `analytics_${safeRole}_${exportType}_${dateStamp}.csv`;

    let csvRows: string[] = [];
    if (exportType === 'transactions') {
      csvRows = [
        'created_at,amount,consumer_benefit_amount,evoucher_benefit_amount,total_discount_pct',
        ...transactions.map((row) =>
          [
            escapeCsv(row.created_at),
            escapeCsv(asNumber(row.amount).toFixed(2)),
            escapeCsv(asNumber(row.consumer_benefit_amount).toFixed(2)),
            escapeCsv(asNumber(row.evoucher_benefit_amount).toFixed(2)),
            escapeCsv(asNumber(row.total_discount_pct).toFixed(2)),
          ].join(',')
        ),
      ];
    } else {
      const byMonth = new Map<
        string,
        { volume: number; savings: number; margin: number; avgDiscountTotal: number; count: number }
      >();
      transactions.forEach((row) => {
        const month = new Date(row.created_at).toISOString().slice(0, 7);
        const current = byMonth.get(month) ?? {
          volume: 0,
          savings: 0,
          margin: 0,
          avgDiscountTotal: 0,
          count: 0,
        };
        current.volume += asNumber(row.amount);
        current.savings += asNumber(row.consumer_benefit_amount);
        current.margin += asNumber(row.evoucher_benefit_amount);
        current.avgDiscountTotal += asNumber(row.total_discount_pct);
        current.count += 1;
        byMonth.set(month, current);
      });

      csvRows = [
        'month,total_volume,total_savings,total_margin,average_discount_pct,transaction_count',
        ...Array.from(byMonth.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, value]) =>
            [
              escapeCsv(month),
              escapeCsv(value.volume.toFixed(2)),
              escapeCsv(value.savings.toFixed(2)),
              escapeCsv(value.margin.toFixed(2)),
              escapeCsv((value.count > 0 ? value.avgDiscountTotal / value.count : 0).toFixed(2)),
              escapeCsv(value.count),
            ].join(',')
          ),
      ];
    }

    return new Response(csvRows.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to export analytics.', code: 'analytics_export_failed' },
      { status: 500 }
    );
  }
}
