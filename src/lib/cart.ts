export interface CartItem {
  id: string;
  merchantId: string;
  merchantName: string;
  productId: string;
  productName: string;
  faceValue: number;
  consumerPrice: number;
  consumerBenefitAmount: number;
  totalDiscountPct: number;
  quantity: number;
}

const CART_KEY = 'evoucher_cart_items';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getCartItems(): CartItem[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(CART_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addCartItem(item: CartItem) {
  const items = getCartItems();
  const existing = items.find((cartItem) => cartItem.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    items.push(item);
  }
  saveCartItems(items);
  return items;
}

export function removeCartItem(productId: string) {
  const items = getCartItems().filter((item) => item.productId !== productId);
  saveCartItems(items);
  return items;
}

export function updateCartQuantity(productId: string, quantity: number) {
  const items = getCartItems().map((item) =>
    item.productId === productId
      ? {
          ...item,
          quantity: Math.max(1, quantity),
        }
      : item
  );
  saveCartItems(items);
  return items;
}

export function clearCart() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(CART_KEY);
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
