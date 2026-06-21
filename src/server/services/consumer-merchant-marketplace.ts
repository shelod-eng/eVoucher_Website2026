/**
 * Consumer-Merchant Marketplace Service
 * Two-sided marketplace - Yoco doesn't have this!
 * Consumers buy directly from merchants inside the app
 */

export type ProductCategory =
  | 'groceries'
  | 'fresh_produce'
  | 'meat'
  | 'bakery'
  | 'household'
  | 'personal_care'
  | 'beverages'
  | 'snacks'
  | 'other';

export type ListingStatus = 'active' | 'out_of_stock' | 'paused' | 'deleted';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'cancelled';

export interface MarketplaceProduct {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantLocation: string;
  merchantDistance?: number;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  discount?: number;
  imageUrl?: string;
  stock: number;
  unit: string; // '1kg', '500g', '2L', etc.
  status: ListingStatus;
  featured: boolean;
  tags: string[];
  availableForPickup: boolean;
  availableForDelivery: boolean;
  deliveryFee?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DirectOrder {
  id: string;
  customerId: string;
  merchantId: string;
  items: DirectOrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'evoucher_wallet' | 'voucher_code' | 'card' | 'cash_on_collection';
  fulfillmentMethod: 'pickup' | 'delivery';
  pickupTime?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  estimatedReadyTime?: string;
}

export interface DirectOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface MerchantStorefront {
  merchantId: string;
  merchantName: string;
  description: string;
  bannerUrl?: string;
  logoUrl?: string;
  location: string;
  province: string;
  openingHours: string;
  phone: string;
  rating: number;
  totalOrders: number;
  products: MarketplaceProduct[];
  featured: boolean;
  acceptsVouchers: boolean;
  offersDelivery: boolean;
  acceptsPreorders: boolean;
}

/**
 * Create product listing (merchant side)
 */
export async function createProductListing(
  merchantId: string,
  productData: Partial<MarketplaceProduct>
): Promise<MarketplaceProduct> {
  return {
    id: `PROD-${Date.now()}`,
    merchantId,
    merchantName: productData.merchantName || '',
    merchantLocation: productData.merchantLocation || '',
    name: productData.name || '',
    description: productData.description || '',
    category: productData.category || 'groceries',
    price: productData.price || 0,
    originalPrice: productData.originalPrice,
    discount: productData.discount,
    imageUrl: productData.imageUrl,
    stock: productData.stock || 0,
    unit: productData.unit || '1 unit',
    status: 'active',
    featured: false,
    tags: productData.tags || [],
    availableForPickup: true,
    availableForDelivery: productData.availableForDelivery || false,
    deliveryFee: productData.deliveryFee,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Browse marketplace products (consumer side)
 */
export async function browseMarketplace(filters: {
  category?: ProductCategory;
  maxDistance?: number;
  maxPrice?: number;
  searchQuery?: string;
  sortBy?: 'price' | 'distance' | 'rating' | 'newest';
  userLocation?: { latitude: number; longitude: number };
}): Promise<MarketplaceProduct[]> {
  // Mock implementation - integrate with database
  const mockProducts: MarketplaceProduct[] = [
    {
      id: 'PROD-001',
      merchantId: 'merch-soweto-thabo',
      merchantName: "Thabo's Fresh Produce",
      merchantLocation: 'Soweto, Orlando East',
      merchantDistance: 2.5,
      name: 'Fresh Tomatoes',
      description: 'Locally grown, ripe and ready',
      category: 'fresh_produce',
      price: 15.99,
      originalPrice: 19.99,
      discount: 20,
      imageUrl: '/products/tomatoes.jpg',
      stock: 50,
      unit: '1kg',
      status: 'active',
      featured: true,
      tags: ['fresh', 'local', 'organic'],
      availableForPickup: true,
      availableForDelivery: true,
      deliveryFee: 15,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'PROD-002',
      merchantId: 'merch-soweto-thabo',
      merchantName: "Thabo's Fresh Produce",
      merchantLocation: 'Soweto, Orlando East',
      merchantDistance: 2.5,
      name: 'White Bread Loaf',
      description: 'Freshly baked daily',
      category: 'bakery',
      price: 12.5,
      stock: 30,
      unit: '700g',
      status: 'active',
      featured: false,
      tags: ['fresh', 'bakery'],
      availableForPickup: true,
      availableForDelivery: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
  ];

  return mockProducts.filter((p) => p.status === 'active');
}

/**
 * Get merchant storefront
 */
export async function getMerchantStorefront(merchantId: string): Promise<MerchantStorefront> {
  // Mock implementation
  return {
    merchantId,
    merchantName: "Thabo's Fresh Produce",
    description: 'Your neighborhood spaza with quality products and great prices',
    bannerUrl: '/storefronts/thabo-banner.jpg',
    logoUrl: '/storefronts/thabo-logo.jpg',
    location: 'Soweto, Orlando East',
    province: 'Gauteng',
    openingHours: 'Mon-Sat: 7AM-7PM, Sun: 8AM-4PM',
    phone: '072 123 4567',
    rating: 4.8,
    totalOrders: 1250,
    products: [],
    featured: true,
    acceptsVouchers: true,
    offersDelivery: true,
    acceptsPreorders: true,
  };
}

/**
 * Create direct order (consumer to merchant)
 */
export async function createDirectOrder(orderData: {
  customerId: string;
  merchantId: string;
  items: DirectOrderItem[];
  fulfillmentMethod: 'pickup' | 'delivery';
  paymentMethod: DirectOrder['paymentMethod'];
  deliveryAddress?: string;
  specialInstructions?: string;
}): Promise<DirectOrder> {
  const subtotal = orderData.items.reduce((sum, item) => sum + item.total, 0);
  const deliveryFee = orderData.fulfillmentMethod === 'delivery' ? 15 : 0;

  const order: DirectOrder = {
    id: `ORD-${Date.now()}`,
    customerId: orderData.customerId,
    merchantId: orderData.merchantId,
    items: orderData.items,
    subtotal,
    discount: 0,
    deliveryFee,
    total: subtotal + deliveryFee,
    status: 'pending',
    paymentMethod: orderData.paymentMethod,
    fulfillmentMethod: orderData.fulfillmentMethod,
    deliveryAddress: orderData.deliveryAddress,
    specialInstructions: orderData.specialInstructions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Notify merchant of new order
  await notifyMerchantNewOrder(orderData.merchantId, order);

  return order;
}

/**
 * Update order status (merchant action)
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  estimatedReadyTime?: string
): Promise<DirectOrder> {
  // Update order in database
  const order: DirectOrder = {
    id: orderId,
    customerId: 'customer-123',
    merchantId: 'merchant-456',
    items: [],
    subtotal: 0,
    discount: 0,
    deliveryFee: 0,
    total: 0,
    status,
    paymentMethod: 'evoucher_wallet',
    fulfillmentMethod: 'pickup',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedReadyTime,
  };

  // Notify customer of status change
  await notifyCustomerOrderUpdate(order.customerId, order);

  return order;
}

/**
 * Notify merchant of new order
 */
async function notifyMerchantNewOrder(merchantId: string, order: DirectOrder): Promise<void> {
  const message = `🛒 New order #${order.id}! ${order.items.length} items, R${order.total.toFixed(2)}. Check your dashboard to confirm.`;

  // SMS + Push notification
  console.log(`Notify merchant ${merchantId}: ${message}`);
}

/**
 * Notify customer of order update
 */
async function notifyCustomerOrderUpdate(customerId: string, order: DirectOrder): Promise<void> {
  const statusMessages = {
    confirmed: '✅ Order confirmed! Preparing your items now.',
    preparing: '👨‍🍳 Your order is being prepared.',
    ready: '🎉 Order ready for collection!',
    collected: '✅ Order collected. Thank you!',
    cancelled: '❌ Order cancelled.',
  };

  const message =
    statusMessages[order.status as keyof typeof statusMessages] ||
    `Order ${order.id} updated to ${order.status}`;

  console.log(`Notify customer ${customerId}: ${message}`);
}

/**
 * Get trending products in area
 */
export async function getTrendingProducts(
  location: string,
  limit: number = 10
): Promise<MarketplaceProduct[]> {
  // Mock - return products sorted by popularity
  return [];
}

/**
 * Get merchant's orders
 */
export async function getMerchantOrders(
  merchantId: string,
  status?: OrderStatus
): Promise<DirectOrder[]> {
  // Mock implementation
  return [];
}

/**
 * Get customer's orders
 */
export async function getCustomerOrders(
  customerId: string,
  status?: OrderStatus
): Promise<DirectOrder[]> {
  // Mock implementation
  return [];
}

/**
 * Calculate marketplace advantage over Yoco
 */
export function getMarketplaceAdvantage(): {
  eVoucher: string[];
  yoco: string[];
  uniqueValue: string;
} {
  return {
    eVoucher: [
      'Two-sided marketplace (consumers + merchants)',
      'Direct consumer-to-merchant purchases',
      'Built-in customer discovery',
      'Product listings with photos',
      'Order management system',
      'Delivery coordination',
      'Customer reviews & ratings',
      'Pre-orders & special requests',
    ],
    yoco: [
      'Payment processing only',
      'No consumer app',
      'No product discovery',
      'Merchants must market themselves',
    ],
    uniqueValue:
      'eVoucher creates a complete ecosystem where consumers discover and buy from local merchants - Yoco only processes payments.',
  };
}

/**
 * Enable instant marketplace for merchant
 */
export async function enableMarketplaceForMerchant(merchantId: string): Promise<{
  enabled: boolean;
  storefrontUrl: string;
  onboardingSteps: string[];
}> {
  return {
    enabled: true,
    storefrontUrl: `https://evoucher.co.za/merchants/${merchantId}`,
    onboardingSteps: [
      'Upload store logo and banner',
      'Add 5-10 popular products',
      'Set opening hours',
      'Enable pickup/delivery options',
      'Go live and start receiving orders',
    ],
  };
}
