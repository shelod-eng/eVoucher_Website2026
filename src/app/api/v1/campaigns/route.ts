import { NextRequest, NextResponse } from 'next/server';
import {
  createCampaign,
  generatePromoCode,
  validatePromoCode,
  generateReferralCode,
  CAMPAIGN_TEMPLATES,
  type Campaign,
  type AudienceSegment,
} from '@/server/services/marketing-campaigns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'templates') {
      return NextResponse.json({
        success: true,
        templates: CAMPAIGN_TEMPLATES,
      });
    }

    if (action === 'validatePromo') {
      const code = searchParams.get('code');
      const userId = searchParams.get('userId');
      const amount = Number(searchParams.get('amount') || 0);

      if (!code || !userId || !amount) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      const validation = await validatePromoCode(code, userId, amount);
      return NextResponse.json({ success: true, validation });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Campaign operation failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'createCampaign') {
      const campaign = await createCampaign({
        merchantId: body.merchantId,
        name: body.name,
        type: body.type,
        status: 'draft',
        audience: body.audience,
        message: body.message,
        discount: body.discount,
        startDate: body.startDate,
        endDate: body.endDate,
        budget: body.budget,
      });

      return NextResponse.json({
        success: true,
        campaign,
      });
    }

    if (action === 'generatePromo') {
      const promo = await generatePromoCode(
        body.merchantId,
        body.discount,
        body.segment as AudienceSegment,
        body.validDays
      );

      return NextResponse.json({
        success: true,
        promo,
      });
    }

    if (action === 'generateReferral') {
      const code = await generateReferralCode(body.userId);
      return NextResponse.json({
        success: true,
        referralCode: code,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Campaign operation failed' },
      { status: 500 }
    );
  }
}
