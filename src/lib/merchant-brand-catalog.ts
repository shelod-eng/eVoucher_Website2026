export type BrandKey =
  | 'picknpay'
  | 'clicks'
  | 'pep'
  | 'shoprite'
  | 'usave'
  | 'boxer'
  | 'checkers'
  | 'mrprice'
  | 'engen'
  | 'game';

export interface MerchantBrandDefinition {
  brandKey: BrandKey;
  displayName: string;
  category: 'Groceries' | 'Healthcare' | 'Clothing' | 'Fuel';
  assetPath: string;
  aliases: string[];
}

const BRAND_CATALOG: MerchantBrandDefinition[] = [
  {
    brandKey: 'picknpay',
    displayName: 'Pick n Pay',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/picknpay.png',
    aliases: ['pick n pay', 'picknpay', 'pnp'],
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
  },
  {
    brandKey: 'shoprite',
    displayName: 'Shoprite',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/shoprite.png',
    aliases: ['shoprite'],
  },
  {
    brandKey: 'usave',
    displayName: 'uSave',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/usave.png',
    aliases: ['usave', 'u save', 'u-save'],
  },
  {
    brandKey: 'boxer',
    displayName: 'Boxer',
    category: 'Groceries',
    assetPath: '/assets/images/merchants/boxer.png',
    aliases: ['boxer'],
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
