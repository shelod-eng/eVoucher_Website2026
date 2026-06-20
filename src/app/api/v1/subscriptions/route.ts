import { NextRequest, NextResponse } from 'next/server';
import {
  createSubscription,
  SUBSCRIPTION_PLANS,
  pauseSubscription,
  cancelSubscription,
  getRecommendedPlan,
} from '@/server/services/subscription-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const income = Number(searchParams.get('income') || 0);
    const householdSize = Number(searchParams.get('householdSize') || 1);

    if (income > 0) {
      const recommended = getRecommendedPlan(income, householdSize);
      return NextResponse.json({
        success: true,
        plans: SUBSCRIPTION_PLANS,
        recommended,
      });
    }

    return NextResponse.json({
      success: true,
      plans: SUBSCRIPTION_PLANS,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId, paymentMethod, action } = body;

    if (action === 'pause') {
      const success = await pauseSubscription(body.subscriptionId);
      return NextResponse.json({
        success,
        message: success ? 'Subscription paused' : 'Failed to pause subscription',
      });
    }

    if (action === 'cancel') {
      const success = await cancelSubscription(body.subscriptionId);
      return NextResponse.json({
        success,
        message: success ? 'Subscription cancelled' : 'Failed to cancel subscription',
      });
    }

    if (!userId || !planId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, planId, paymentMethod' },
        { status: 400 }
      );
    }

    const result = await createSubscription(userId, planId, paymentMethod);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Subscription operation failed' },
      { status: 500 }
    );
  }
}
