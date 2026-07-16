import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  resolveBrandFromMerchantName,
  getBrandByKey,
  listMerchantBrands,
} from '@/lib/merchant-brand-catalog';

// Public endpoint — no auth required — returns active merchants with resolved logos.
// Always includes all catalog brands (same set as the shop page) so the homepage
// featured grid matches what consumers see after sign-in.
export async function GET() {
  const seen = new Set<string>();
  const merchants: { id: string; name: string; category: string; logoPath: string | null; brandKey: string | null }[] = [];

  // 1. Pull live DB merchants first so real entries take priority
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('merchants')
      .select('id, business_name, parent_brand, category, status')
      .in('status', ['approved', 'active'])
      .order('business_name', { ascending: true })
      .limit(40);

    for (const m of data ?? []) {
      const name = String(m.parent_brand || m.business_name || '');
      if (!name) continue;
      const brandKey = resolveBrandFromMerchantName(name);
      const brand = brandKey ? getBrandByKey(brandKey) : null;
      const key = brandKey ?? name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merchants.push({
        id: String(m.id),
        name: brand?.displayName ?? name,
        category: brand?.category ?? String(m.category ?? 'Partner'),
        logoPath: brand?.assetPath ?? null,
        brandKey,
      });
    }
  } catch {
    // Non-critical — fall through to catalog brands
  }

  // 2. Fill in remaining catalog brands so the grid always matches the shop page
  for (const brand of listMerchantBrands()) {
    if (seen.has(brand.brandKey)) continue;
    seen.add(brand.brandKey);
    merchants.push({
      id: `catalog-${brand.brandKey}`,
      name: brand.displayName,
      category: brand.category,
      logoPath: brand.assetPath,
      brandKey: brand.brandKey,
    });
  }

  return NextResponse.json({ merchants }, { status: 200 });
}
