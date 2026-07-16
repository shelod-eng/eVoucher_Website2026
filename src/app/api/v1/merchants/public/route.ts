import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveBrandFromMerchantName, getBrandByKey } from '@/lib/merchant-brand-catalog';

// Public endpoint — no auth required — returns active merchants with resolved logos
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('merchants')
      .select('id, business_name, parent_brand, category, status')
      .in('status', ['approved', 'active'])
      .order('business_name', { ascending: true })
      .limit(40);

    if (error) throw error;

    const rows = data ?? [];

    // Deduplicate by parent_brand so we show one card per brand, not per branch
    const seen = new Set<string>();
    const merchants = rows
      .map((m: any) => {
        const name = String(m.parent_brand || m.business_name || '');
        const brandKey = resolveBrandFromMerchantName(name);
        const brand = brandKey ? getBrandByKey(brandKey) : null;
        return {
          id: String(m.id),
          name,
          category: brand?.category ?? String(m.category ?? 'Partner'),
          logoPath: brand?.assetPath ?? null,
          brandKey,
        };
      })
      .filter((m) => {
        if (!m.name) return false;
        const key = m.brandKey ?? m.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return NextResponse.json({ merchants }, { status: 200 });
  } catch {
    return NextResponse.json({ merchants: [] }, { status: 200 });
  }
}
