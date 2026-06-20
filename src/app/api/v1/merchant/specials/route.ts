import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  checkExpiredSpecials,
  scheduleSpecial,
  activateSpecial,
  renewSpecial,
  getActiveSpecials,
  cancelSpecial,
  getSpecialPerformance,
} from '@/server/services/specials-lifecycle';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'check_expired') {
      const result = await checkExpiredSpecials();
      return NextResponse.json(result);
    }

    if (action === 'active') {
      const merchantId = searchParams.get('merchantId') || undefined;
      const province = searchParams.get('province') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

      const result = await getActiveSpecials({ merchantId, province, limit });
      return NextResponse.json(result);
    }

    if (action === 'performance') {
      const productId = searchParams.get('productId');
      const periodDays = searchParams.get('periodDays') ? parseInt(searchParams.get('periodDays')!) : 7;

      if (!productId) {
        return NextResponse.json({ error: 'productId required' }, { status: 400 });
      }

      const result = await getSpecialPerformance(productId, periodDays);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Operation failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<any>(admin, user, 'id');

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const body = (await request.json()) as {
      action: 'schedule' | 'activate' | 'renew' | 'cancel';
      productId: string;
      specialTitle?: string;
      specialStartAt?: string;
      specialEndAt?: string;
      displayPriority?: number;
      extensionDays?: number;
    };

    if (body.action === 'schedule') {
      if (!body.specialTitle || !body.specialStartAt || !body.specialEndAt) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const result = await scheduleSpecial({
        productId: body.productId,
        specialTitle: body.specialTitle,
        specialStartAt: body.specialStartAt,
        specialEndAt: body.specialEndAt,
        displayPriority: body.displayPriority,
      });
      return NextResponse.json(result);
    }

    if (body.action === 'activate') {
      if (!body.specialTitle || !body.specialEndAt) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const result = await activateSpecial(
        body.productId,
        body.specialTitle,
        body.specialEndAt,
        body.displayPriority
      );
      return NextResponse.json(result);
    }

    if (body.action === 'renew') {
      if (!body.extensionDays) {
        return NextResponse.json({ error: 'extensionDays required' }, { status: 400 });
      }
      const result = await renewSpecial(body.productId, body.extensionDays);
      return NextResponse.json(result);
    }

    if (body.action === 'cancel') {
      const result = await cancelSpecial(body.productId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Operation failed' }, { status: 500 });
  }
}
