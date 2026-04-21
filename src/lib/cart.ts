export interface CartItem {
  id: string;
  merchantId: string;
  merchantName: string;
  selectedBranchId?: string;
  selectedBranchName?: string;
  selectedBranchCity?: string;
  selectedBranchProvince?: string;
  branchSelectionMode?: 'nearest' | 'manual';
  productId: string;
  productName: string;
  parentBrand?: string;
  redemptionScope?: 'all_branches' | 'specific_branch' | 'province_wide' | 'national';
  faceValue: number;
  consumerPrice: number;
  consumerBenefitAmount: number;
  totalDiscountPct: number;
  quantity: number;
}

const CART_KEY = 'evoucher_cart_items';

function resolveCartKey(scopeKey?: string | null) {
  const normalizedScope = String(scopeKey ?? '')
    .trim()
    .toLowerCase();
  return normalizedScope ? `${CART_KEY}_${normalizedScope}` : CART_KEY;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getCartItems(scopeKey?: string | null): CartItem[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(resolveCartKey(scopeKey));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[], scopeKey?: string | null) {
  if (!isBrowser()) return;
  window.localStorage.setItem(resolveCartKey(scopeKey), JSON.stringify(items));
  window.dispatchEvent(new Event('evoucher-cart-updated'));
}

export function addCartItem(item: CartItem, scopeKey?: string | null) {
  const items = getCartItems(scopeKey);
  const existing = items.find(
    (cartItem) =>
      String(cartItem.productId) === String(item.productId) &&
      String(cartItem.merchantId) === String(item.merchantId)
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    items.push(item);
  }
  saveCartItems(items, scopeKey);
  return items;
}

export function removeCartItem(
  productId: string,
  scopeKey?: string | null,
  merchantId?: string | null
) {
  const items = getCartItems(scopeKey).filter((item) => {
    if (item.productId !== productId) return true;
    if (!merchantId) return false;
    return String(item.merchantId) !== String(merchantId);
  });
  saveCartItems(items, scopeKey);
  return items;
}

export function updateCartQuantity(
  productId: string,
  quantity: number,
  scopeKey?: string | null,
  merchantId?: string | null
) {
  const items = getCartItems(scopeKey).map((item) =>
    item.productId === productId && (!merchantId || String(item.merchantId) === String(merchantId))
      ? {
          ...item,
          quantity: Math.max(1, quantity),
        }
      : item
  );
  saveCartItems(items, scopeKey);
  return items;
}

export function clearCart(scopeKey?: string | null) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(resolveCartKey(scopeKey));
  window.dispatchEvent(new Event('evoucher-cart-updated'));
}

export function getCartSummary(items: CartItem[]) {
  const totalFaceValue = items.reduce((total, item) => total + item.faceValue * item.quantity, 0);
  const totalConsumerPrice = items.reduce(
    (total, item) => total + item.consumerPrice * item.quantity,
    0
  );
  const totalSavings = items.reduce(
    (total, item) => total + item.consumerBenefitAmount * item.quantity,
    0
  );

  return {
    totalFaceValue: Number(totalFaceValue.toFixed(2)),
    totalConsumerPrice: Number(totalConsumerPrice.toFixed(2)),
    totalSavings: Number(totalSavings.toFixed(2)),
  };
}
