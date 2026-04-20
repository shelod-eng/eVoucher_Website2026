import { calculateDiscountPricing, DEFAULT_TOTAL_DISCOUNT_PCT } from '@/lib/pricing';
import { BrandKey, getBrandByKey } from '@/lib/merchant-brand-catalog';

interface StarterProductTemplate {
  name: string;
  faceValue: number;
  totalDiscountPct?: number;
}

const STARTER_PRODUCTS: Record<BrandKey, StarterProductTemplate[]> = {
  picknpay: [
    { name: 'Pick n Pay Smart Shopper Top-Up', faceValue: 100 },
    { name: 'Pick n Pay Family Grocery Basket', faceValue: 200 },
    { name: 'Pick n Pay Monthly Pantry Bundle', faceValue: 500 },
    { name: 'Pick n Pay Bulk Saver Combo', faceValue: 1000 },
    { name: 'No Name Long Life Milk 6 x 1L', faceValue: 79.99 },
    { name: 'Pick n Pay Maize Meal 10kg', faceValue: 129.99 },
    { name: 'Pick n Pay Sunflower Oil 2L', faceValue: 69.99 },
    { name: 'Pick n Pay Brown Bread 700g', faceValue: 17.49 },
    { name: 'Pick n Pay Large Eggs 18-Pack', faceValue: 69.99 },
    { name: 'Pick n Pay Frozen Chicken IQF 2kg', faceValue: 114.99 },
    { name: 'Pick n Pay Rice 5kg', faceValue: 99.99 },
    { name: 'Pick n Pay Sugar 2.5kg', faceValue: 57.99 },
  ],
  clicks: [
    { name: 'Healthcare Voucher R100', faceValue: 100 },
    { name: 'Healthcare Voucher R250', faceValue: 250 },
    { name: 'Pharmacy Essentials Voucher R500', faceValue: 500 },
    { name: 'Personal Care Voucher R200', faceValue: 200 },
  ],
  pep: [
    { name: 'Clothing Voucher R100', faceValue: 100 },
    { name: 'Clothing Voucher R200', faceValue: 200 },
    { name: 'Family Clothing Voucher R500', faceValue: 500 },
    { name: 'Seasonal Wear Voucher R300', faceValue: 300 },
  ],
  shoprite: [
    { name: 'Shoprite Grocery Voucher R100', faceValue: 100 },
    { name: 'Shoprite Grocery Voucher R200', faceValue: 200 },
    { name: 'Shoprite Grocery Voucher R500', faceValue: 500 },
    { name: 'Shoprite Grocery Voucher R1000', faceValue: 1000 },
    { name: 'White Bread 700g', faceValue: 18.99 },
    { name: 'Brown Bread 700g', faceValue: 16.99 },
    { name: 'Full Cream Milk 2L', faceValue: 32.99 },
    { name: 'Maize Meal 5kg', faceValue: 74.99 },
    { name: 'Large Eggs 6-Pack', faceValue: 42.99 },
    { name: 'Chicken Portions 2kg', faceValue: 89.99 },
    { name: 'Sunflower Oil 2L', faceValue: 69.99 },
    { name: 'Sugar 2.5kg', faceValue: 54.99 },
    { name: 'Rice 2kg', faceValue: 39.99 },
  ],
  usave: [
    { name: 'Grocery Bundle R100', faceValue: 100 },
    { name: 'Grocery Bundle R200', faceValue: 200 },
    { name: 'Grocery Bundle R500', faceValue: 500 },
    { name: 'Family Pantry Voucher R1000', faceValue: 1000 },
  ],
  boxer: [
    { name: 'Grocery Voucher R100', faceValue: 100 },
    { name: 'Grocery Voucher R200', faceValue: 200 },
    { name: 'Grocery Voucher R500', faceValue: 500 },
    { name: 'Household Voucher R1000', faceValue: 1000 },
  ],
  checkers: [
    { name: 'Grocery Voucher R100', faceValue: 100 },
    { name: 'Grocery Voucher R200', faceValue: 200 },
    { name: 'Grocery Voucher R500', faceValue: 500 },
    { name: 'Grocery Voucher R1000', faceValue: 1000 },
  ],
  mrprice: [
    { name: 'Fashion Voucher R100', faceValue: 100 },
    { name: 'Fashion Voucher R200', faceValue: 200 },
    { name: 'Fashion Voucher R500', faceValue: 500 },
    { name: 'Fashion Voucher R1000', faceValue: 1000 },
  ],
  engen: [
    { name: 'Fuel Voucher R100', faceValue: 100 },
    { name: 'Fuel Voucher R200', faceValue: 200 },
    { name: 'Fuel Voucher R500', faceValue: 500 },
    { name: 'Fuel Voucher R1000', faceValue: 1000 },
  ],
  game: [
    { name: 'Essentials Voucher R100', faceValue: 100 },
    { name: 'Essentials Voucher R200', faceValue: 200 },
    { name: 'Essentials Voucher R500', faceValue: 500 },
    { name: 'Essentials Voucher R1000', faceValue: 1000 },
  ],
  woolworths: [
    { name: 'Woolworths Grocery Voucher R100', faceValue: 100 },
    { name: 'Woolworths Grocery Voucher R200', faceValue: 200 },
    { name: 'Woolworths Grocery Voucher R500', faceValue: 500 },
    { name: 'Woolworths Grocery Voucher R1000', faceValue: 1000 },
  ],
  dischem: [
    { name: 'Dischem Health Voucher R100', faceValue: 100 },
    { name: 'Dischem Health Voucher R200', faceValue: 200 },
    { name: 'Dischem Health Voucher R500', faceValue: 500 },
    { name: 'Dischem Health Voucher R1000', faceValue: 1000 },
  ],
  superstore: [
    { name: 'Super Store Voucher R100', faceValue: 100 },
    { name: 'Super Store Voucher R200', faceValue: 200 },
    { name: 'Super Store Voucher R500', faceValue: 500 },
    { name: 'Super Store Voucher R1000', faceValue: 1000 },
  ],
  superprecast: [
    { name: 'Concrete Materials Voucher R200', faceValue: 200 },
    { name: 'Concrete Materials Voucher R500', faceValue: 500 },
    { name: 'Concrete Materials Voucher R1000', faceValue: 1000 },
    { name: 'Building Supplies Voucher R2000', faceValue: 2000 },
  ],
  siliconvalley: [
    { name: 'Silicon Valley Grocery Voucher R100', faceValue: 100 },
    { name: 'Silicon Valley Grocery Voucher R250', faceValue: 250 },
    { name: 'Silicon Valley Grocery Voucher R500', faceValue: 500 },
    { name: 'Silicon Valley Grocery Voucher R1000', faceValue: 1000 },
  ],
};

interface BuildStarterProductsInput {
  brandKey: BrandKey;
  merchantId: string | null;
  merchantName?: string | null;
  defaultTotalDiscountPct?: number | null;
}

export interface StarterCatalogProduct {
  id: string;
  brandKey: BrandKey;
  source: 'starter';
  merchant_id: string | null;
  merchant_name: string;
  product_name: string;
  face_value: number;
  total_discount_pct: number;
  consumer_benefit_pct: number;
  evoucher_benefit_pct: number;
  total_discount_amount: number;
  consumer_benefit_amount: number;
  evoucher_benefit_amount: number;
  consumer_price: number;
  merchant_receivable_after_total_discount: number;
  merchant_receivable_after_evoucher_benefit: number;
  is_active: true;
}

export function getStarterProductCountForBrand(brandKey: BrandKey) {
  return STARTER_PRODUCTS[brandKey]?.length ?? 0;
}

export function getStarterProductsForBrand(brandKey: BrandKey) {
  return STARTER_PRODUCTS[brandKey] ?? [];
}

export function buildStarterProductsForBrand({
  brandKey,
  merchantId,
  merchantName,
  defaultTotalDiscountPct,
}: BuildStarterProductsInput): StarterCatalogProduct[] {
  const templates = STARTER_PRODUCTS[brandKey] ?? [];
  const brand = getBrandByKey(brandKey);
  const displayMerchantName = merchantName || brand?.displayName || 'Partner Merchant';
  const fallbackDiscountPct = Number(defaultTotalDiscountPct ?? DEFAULT_TOTAL_DISCOUNT_PCT);

  return templates.map((template, index) => {
    const totalDiscountPct = Number(template.totalDiscountPct ?? fallbackDiscountPct);
    const pricing = calculateDiscountPricing(Number(template.faceValue), totalDiscountPct);
    return {
      id: `starter-${brandKey}-${index + 1}-${Math.round(Number(template.faceValue) * 100)}`,
      brandKey,
      source: 'starter',
      merchant_id: merchantId,
      merchant_name: displayMerchantName,
      product_name: template.name,
      face_value: pricing.faceValue,
      total_discount_pct: pricing.totalDiscountPct,
      consumer_benefit_pct: pricing.consumerBenefitPct,
      evoucher_benefit_pct: pricing.evoucherBenefitPct,
      total_discount_amount: pricing.totalDiscountAmount,
      consumer_benefit_amount: pricing.consumerBenefitAmount,
      evoucher_benefit_amount: pricing.evoucherBenefitAmount,
      consumer_price: pricing.consumerPrice,
      merchant_receivable_after_total_discount: pricing.merchantReceivableAfterTotalDiscount,
      merchant_receivable_after_evoucher_benefit: pricing.merchantReceivableAfterEvoucherBenefit,
      is_active: true,
    };
  });
}
