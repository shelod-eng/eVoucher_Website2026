import { NextRequest, NextResponse } from 'next/server';
import { getAdvancedMetrics, generateCustomReport } from '@/server/services/advanced-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const granularity = searchParams.get('granularity') || 'day';

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
    }

    const timeframe = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
      granularity: granularity as 'hour' | 'day' | 'week' | 'month',
    };

    const metrics = await getAdvancedMetrics(merchantId, timeframe);

    return NextResponse.json({
      success: true,
      metrics,
      timeframe: {
        start: timeframe.start.toISOString(),
        end: timeframe.end.toISOString(),
        granularity: timeframe.granularity,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, reportType, params } = body;

    if (!merchantId || !reportType) {
      return NextResponse.json({ error: 'merchantId and reportType required' }, { status: 400 });
    }

    const report = await generateCustomReport(merchantId, reportType, params || {});

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
