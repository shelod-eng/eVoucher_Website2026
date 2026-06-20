// Specials Lifecycle Service - Advanced promotion workflows
import { createAdminClient } from '@/lib/supabase/admin';

export interface Special {
  id: string;
  productId: string;
  merchantId: string;
  specialTitle: string;
  specialEndAt: string;
  displayPriority: number;
  status: 'active' | 'expired' | 'scheduled' | 'cancelled';
  views: number;
  clicks: number;
  conversions: number;
}

export async function checkExpiredSpecials() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: expiredProducts, error } = await admin
    .from('merchant_products')
    .select('id,merchant_id,special_title,special_end_at')
    .eq('is_special', true)
    .eq('is_active', true)
    .lt('special_end_at', now);

  if (error) throw error;

  const results = [];
  for (const product of expiredProducts || []) {
    const { error: updateError } = await admin
      .from('merchant_products')
      .update({
        is_special: false,
        special_title: null,
        special_end_at: null,
        display_priority: 0,
      })
      .eq('id', product.id);

    if (!updateError) {
      results.push({
        productId: product.id,
        merchantId: product.merchant_id,
        action: 'expired',
      });
    }
  }

  return { expiredCount: results.length, results };
}

export async function scheduleSpecial(params: {
  productId: string;
  specialTitle: string;
  specialStartAt: string;
  specialEndAt: string;
  displayPriority?: number;
}) {
  const admin = createAdminClient();
  const now = new Date();
  const startAt = new Date(params.specialStartAt);

  if (startAt <= now) {
    return activateSpecial(params.productId, params.specialTitle, params.specialEndAt, params.displayPriority);
  }

  const { data, error } = await admin
    .from('merchant_products')
    .update({
      special_title: params.specialTitle,
      special_end_at: params.specialEndAt,
      display_priority: params.displayPriority || 100,
      is_special: false,
    })
    .eq('id', params.productId)
    .select()
    .single();

  if (error) throw error;

  return { success: true, status: 'scheduled', product: data };
}

export async function activateSpecial(
  productId: string,
  specialTitle: string,
  specialEndAt: string,
  displayPriority?: number
) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('merchant_products')
    .update({
      is_special: true,
      special_title: specialTitle,
      special_end_at: specialEndAt,
      display_priority: displayPriority || 100,
    })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;

  return { success: true, status: 'active', product: data };
}

export async function renewSpecial(productId: string, extensionDays: number) {
  const admin = createAdminClient();

  const { data: product, error: fetchError } = await admin
    .from('merchant_products')
    .select('special_end_at')
    .eq('id', productId)
    .single();

  if (fetchError) throw fetchError;

  const currentEnd = new Date(product.special_end_at);
  const newEnd = new Date(currentEnd.getTime() + extensionDays * 24 * 60 * 60 * 1000);

  const { data, error } = await admin
    .from('merchant_products')
    .update({ special_end_at: newEnd.toISOString() })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;

  return { success: true, newEndDate: newEnd.toISOString(), product: data };
}

export async function getActiveSpecials(filters?: {
  merchantId?: string;
  province?: string;
  limit?: number;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  let query = admin
    .from('merchant_products')
    .select('id,product_name,face_value,consumer_price,special_title,special_end_at,display_priority,merchant_id,merchants(business_name,parent_brand)')
    .eq('is_special', true)
    .eq('is_active', true)
    .gt('special_end_at', now)
    .order('display_priority', { ascending: false })
    .order('special_end_at', { ascending: true });

  if (filters?.merchantId) {
    query = query.eq('merchant_id', filters.merchantId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return { specials: data || [], count: data?.length || 0 };
}

export async function cancelSpecial(productId: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('merchant_products')
    .update({
      is_special: false,
      special_title: null,
      special_end_at: null,
      display_priority: 0,
    })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;

  return { success: true, product: data };
}

export async function getSpecialPerformance(productId: string, periodDays: number = 7) {
  const admin = createAdminClient();
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: purchases, error } = await admin
    .from('customer_vouchers')
    .select('id,purchase_price,purchased_at,status')
    .eq('merchant_product_id', productId)
    .gte('purchased_at', startDate);

  if (error) throw error;

  const totalPurchases = purchases?.length || 0;
  const totalRevenue = purchases?.reduce((sum, p) => sum + Number(p.purchase_price || 0), 0) || 0;
  const redeemedCount = purchases?.filter((p) => p.status === 'redeemed').length || 0;

  return {
    productId,
    periodDays,
    totalPurchases,
    totalRevenue,
    redeemedCount,
    conversionRate: totalPurchases > 0 ? (redeemedCount / totalPurchases) * 100 : 0,
  };
}
