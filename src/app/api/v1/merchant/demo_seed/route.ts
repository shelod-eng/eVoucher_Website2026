import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureDemoMerchantsSeeded } from '@/server/utils/demo-merchant-seed';

function isDemoSeedingEnabled() {
  const vercelEnv = String(process.env.VERCEL_ENV ?? '').toLowerCase();
  const explicitEnableFlags = [
    String(process.env.SEED_DEMO_MERCHANTS ?? '').toLowerCase(),
    String(process.env.ENABLE_DEMO_MERCHANT_SEED ?? '').toLowerCase(),
    String(process.env.NEXT_PUBLIC_ENABLE_DEMO_MERCHANT_SEED ?? '').toLowerCase(),
  ];
  const explicitlyEnabled = explicitEnableFlags.some((value) =>
    ['true', '1', 'yes', 'on'].includes(value)
  );
  return process.env.NODE_ENV === 'development' || vercelEnv === 'preview' || explicitlyEnabled;
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
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to seed demo merchants.' },
      { status: 500 }
    );
  }
}
