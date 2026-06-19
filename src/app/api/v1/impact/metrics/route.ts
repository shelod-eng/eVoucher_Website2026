import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function safeCount(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  filter?: (query: any) => any
) {
  let query = admin.from(table).select('id', { count: 'exact', head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function safeAmountSum(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  column: string,
  filter?: (query: any) => any
) {
  let query = admin.from(table).select(column);
  if (filter) query = filter(query);
  const { data, error } = await query.limit(5000);
  if (error) return 0;
  return (data ?? []).reduce((total: number, row: any) => total + Number(row?.[column] ?? 0), 0);
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const [
      merchantsOnboarded,
      vouchersIssued,
      payoutsProcessed,
      payoutValueProcessed,
      consumersReached,
    ] = await Promise.all([
      safeCount(admin, 'merchants'),
      safeCount(admin, 'customer_vouchers'),
      safeCount(admin, 'settlement_batches', (query) =>
        query.in('status', ['confirmed', 'settled', 'paid'])
      ),
      safeAmountSum(admin, 'settlement_batches', 'total_amount', (query) =>
        query.in('status', ['confirmed', 'settled', 'paid'])
      ),
      safeCount(admin, 'user_profiles', (query) => query.eq('role', 'customer')),
    ]);

    return NextResponse.json(
      {
        merchantsOnboarded,
        vouchersIssued,
        payoutsProcessed,
        payoutValueProcessed,
        consumersReached,
        nationalReachLabel:
          'Designed for web, USSD, mobile onboarding, and sponsor-scale payout governance',
        refreshedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load impact metrics.' },
      { status: 500 }
    );
  }
}
