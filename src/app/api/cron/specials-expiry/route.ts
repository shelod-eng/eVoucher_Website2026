import { NextResponse } from 'next/server';
import { checkExpiredSpecials } from '@/server/services/specials-lifecycle';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.NEXT_PUBLIC_CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await checkExpiredSpecials();

    return NextResponse.json({
      success: true,
      message: `Processed ${result.expiredCount} expired specials`,
      ...result,
    });
  } catch (error: any) {
    console.error('[cron-specials-expiry]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process expired specials' },
      { status: 500 }
    );
  }
}
