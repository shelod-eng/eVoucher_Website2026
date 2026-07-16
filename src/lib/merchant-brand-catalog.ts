// BRAND INTEGRITY RULE (platform-wide):
// A merchant's logo must ONLY come from their own brand record (assetPath).
// Never substitute one merchant's logo for another.
// If assetPath is missing or the file does not exist, display MERCHANT_PLACEHOLDER_LOGO.
export const MERCHANT_PLACEHOLDER_LOGO = '/assets/images/merchants/placeholder-merchant.svg';

export type BrandKey =
  | 'kalapeng'
  | 'picknpay'
  | 'clicks'
  | 'pep'
  | 'shoprite'
  | 'usave'
  | 'boxer'
  | 'checkers'
  | 'mrprice'
  | 'engen'
  | 'game'
  | 'woolworths'
  | 'dischem'
  | 'superstore'
  | 'superprecast'
  | 'siliconvalley';

export interface MerchantBrandDefinition {
  brandKey: BrandKey;
  displayName: string;
  category: 'Groceries' | 'Healthcare' | 'Clothing' | 'Fuel' | 'Construction';
  assetPath: string;
  aliases: string[];
  estimatedLocationCount?: number;
  estimatedProvinceCount?: number;
}

const BRAND_CATALOG: MerchantBrandDefinition[] = [
  {
    // Kalapeng Pharmacy Group — uses its OWN logo. Never use dischem.png here.
    brandKey: 'kalapeng',
    displayName: 'Kalapeng Pharmacy Group',
    category: 'Healthcare',
    assetPath: '/assets/images/merchants/kalapeng.png',
    aliases: ['kalapeng', 'kalapeng pharmacy', 'kalapeng pharmacy group'],
    estimatedLocationCount: 35,
    estimatedProvinceCount: 9,
  },
  {
    brandKey: 'picknpay',
    displayName: 'Pick n Pay',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/picknpay.png',
    aliases: ['pick n pay', 'picknpay', 'pnp'],
    estimatedLocationCount: 1200,
    estimatedProvinceCount: 9,
  },
  {
    brandKey: 'clicks',
    displayName: 'Clicks',
    category: 'Healthcare',
    assetPath: '/assets/images/merchants/clicks.png',
    aliases: ['clicks', 'click'],
  },
  {
    brandKey: 'pep',
    displayName: 'Pep',
    category: 'Clothing',
    assetPath: '/assets/images/merchants/pep.png',
    aliases: ['pep', 'pep stores'],
    estimatedLocationCount: 2200,
    estimatedProvinceCount: 9,
  },
  {
    brandKey: 'shoprite',
    displayName: 'Shoprite',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/shoprite.png',
    aliases: ['shoprite'],
    estimatedLocationCount: 560,
    estimatedProvinceCount: 9,
  },
  {
    brandKey: 'usave',
    displayName: 'uSave',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/usave.png',
    aliases: ['usave', 'u save', 'u-save'],
    estimatedLocationCount: 340,
    estimatedProvinceCount: 9,
  },
  {
    brandKey: 'boxer',
    displayName: 'Boxer',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/boxer.png',
    aliases: ['boxer'],
    estimatedLocationCount: 470,
    estimatedProvinceCount: 9,
  },
  {
    brandKey: 'checkers',
    displayName: 'Checkers',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/checkers.png',
    aliases: ['checkers'],
  },
  {
    brandKey: 'mrprice',
    displayName: 'Mr Price',
    category: 'Clothing',
    assetPath: '/assets/images/merchants/mr-price.png',
    aliases: ['mr price', 'mrprice', 'mrp'],
    estimatedLocationCount: 1900,
    estimatedProvinceCount: 9,
  },
  {
    brandKey: 'engen',
    displayName: 'Engen',
    category: 'Fuel',
    assetPath: '/assets/images/merchants/engen.png',
    aliases: ['engen'],
  },
  {
    brandKey: 'game',
    displayName: 'Game',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/game.png',
    aliases: ['game'],
    estimatedLocationCount: 150,
    estimatedProvinceCount: 9,
  },
  {
    brandKey: 'woolworths',
    displayName: 'Woolworths',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/woolworths.png',
    aliases: ['woolworths', 'woolies'],
    estimatedLocationCount: 490,
    estimatedProvinceCount: 9,
  },
  {
    brandKey: 'dischem',
    displayName: 'Dis-Chem',
    category: 'Healthcare',
    assetPath: '/assets/images/merchants/dischem.png',
    aliases: ['dischem', 'dis-chem'],
  },
  {
    brandKey: 'superstore',
    displayName: 'Super Store',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/superstore.png',
    aliases: ['super store', 'superstore', 'super-store'],
  },
  {
    brandKey: 'siliconvalley',
    displayName: 'Silicon Valley eVoucher',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/superstore.png',
    aliases: ['silicon valley', 'silicon valley evoucher', 'sv evoucher', 'sv chain'],
    estimatedLocationCount: 220,
    estimatedProvinceCount: 9,
  },
];

const BRAND_LOOKUP = new Map<BrandKey, MerchantBrandDefinition>(
  BRAND_CATALOG.map((brand) => [brand.brandKey, brand])
);

function normalizeName(value: string) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function listMerchantBrands() {
  return BRAND_CATALOG;
}

export function getBrandByKey(brandKey: BrandKey) {
  return BRAND_LOOKUP.get(brandKey) ?? null;
}

export function isBrandKey(value: string | null | undefined): value is BrandKey {
  if (!value) return false;
  return BRAND_LOOKUP.has(value as BrandKey);
}

export function resolveBrandFromMerchantName(name: string): BrandKey | null {
  const normalizedName = normalizeName(name);
  if (!normalizedName) return null;

  for (const brand of BRAND_CATALOG) {
    for (const alias of brand.aliases) {
      const normalizedAlias = normalizeName(alias);
      if (!normalizedAlias) continue;
      if (normalizedName.includes(normalizedAlias)) {
        return brand.brandKey;
      }
    }
  }

  return null;
}
