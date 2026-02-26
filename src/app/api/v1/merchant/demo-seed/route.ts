import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureDemoMerchantsSeeded } from '@/server/utils/demo-merchant-seed';

function isDemoSeedingEnabled() {
  const vercelEnv = String(process.env.VERCEL_ENV ?? '').toLowerCase();
  return (
    process.env.NODE_ENV === 'development' ||
    vercelEnv === 'preview' ||
    String(process.env.SEED_DEMO_MERCHANTS ?? '').toLowerCase() === 'true'
  );
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
      ],
      password: 'demo123',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to seed demo merchants.' },
      { status: 500 }
    );
  }
}
