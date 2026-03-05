import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureDemoMerchantsSeeded } from '@/server/utils/demo-merchant-seed';

function isDemoSeedingEnabled() {
  // Prototype/UAT requirement: demo merchant login must always be available.
  return true;
}

export async function POST() {
  if (!isDemoSeedingEnabled()) {
    return NextResponse.json({ error: 'Demo seeding is disabled.' }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    await ensureDemoMerchantsSeeded(admin);
    return NextResponse.json({
      ok: true,
      message: 'Demo merchant seed ensured.',
      merchantLogins: [
        { merchant: 'Shoprite', email: 'demo-shoprite@evoucher.co.za' },
        { merchant: 'Pick n Pay', email: 'demo-picknpay@evoucher.co.za' },
        { merchant: 'Boxer', email: 'demo-boxer@evoucher.co.za' },
        { merchant: 'Checkers', email: 'demo-checkers@evoucher.co.za' },
        { merchant: 'Clicks', email: 'demo-clicks@evoucher.co.za' },
        { merchant: 'Pep', email: 'demo-pep@evoucher.co.za' },
        { merchant: 'Engen', email: 'demo-engen@evoucher.co.za' },
        { merchant: 'Kalapeng (Private)', email: 'demo-kalapeng@evoucher.co.za' },
      ],
      password: 'demo123',
    });
  } catch (error: any) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      console.warn('[merchant-demo-seed][warn]', error?.message || error);
      // Demo seeding is best-effort in local/preview and should never block login flows.
      return NextResponse.json({
        ok: false,
        seeded: false,
        warning: error?.message || 'Failed to seed demo merchants.',
      });
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to seed demo merchants.' },
      { status: 500 }
    );
  }
}
