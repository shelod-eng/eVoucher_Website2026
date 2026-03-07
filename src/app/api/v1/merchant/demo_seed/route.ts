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
    });
  } catch (error: any) {
    console.warn('[merchant-demo_seed][warn]', error?.message || error);
    return NextResponse.json({
      ok: false,
      seeded: false,
      warning: error?.message || 'Failed to seed demo merchants.',
    });
  }
}
