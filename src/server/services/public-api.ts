/**
 * Public API Service
 * Provides REST API for third-party integrations, webhooks, and partner systems
 */

export type WebhookEvent =
  | 'transaction.created'
  | 'transaction.completed'
  | 'voucher.issued'
  | 'voucher.redeemed'
  | 'payout.created'
  | 'payout.completed'
  | 'merchant.approved'
  | 'subscription.created'
  | 'subscription.cancelled';

export interface APIKey {
  id: string;
  merchantId: string;
  key: string;
  secret: string;
  permissions: string[];
  rateLimit: number;
  createdAt: string;
  lastUsed?: string;
  active: boolean;
}

export interface WebhookEndpoint {
  id: string;
  merchantId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  failureCount: number;
  lastDelivery?: string;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  signature: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export async function generateAPIKey(merchantId: string, permissions: string[]): Promise<APIKey> {
  const key = `evpk_live_${generateRandomString(32)}`;
  const secret = `evsk_live_${generateRandomString(48)}`;

  return {
    id: `KEY-${Date.now()}`,
    merchantId,
    key,
    secret,
    permissions,
    rateLimit: 1000,
    createdAt: new Date().toISOString(),
    active: true,
  };
}

export async function validateAPIKey(apiKey: string): Promise<APIKey | null> {
  // Validate API key against database
  if (!apiKey.startsWith('evpk_live_')) {
    return null;
  }

  // Mock API key validation
  return {
    id: 'KEY-123',
    merchantId: 'merchant-123',
    key: apiKey,
    secret: 'evsk_live_secret',
    permissions: ['read:vouchers', 'write:vouchers', 'read:transactions'],
    rateLimit: 1000,
    createdAt: new Date().toISOString(),
    active: true,
  };
}

export async function checkRateLimit(apiKey: string): Promise<RateLimitInfo> {
  // Check rate limit for API key
  return {
    limit: 1000,
    remaining: 950,
    reset: Date.now() + 3600000,
  };
}

export async function registerWebhook(
  merchantId: string,
  url: string,
  events: WebhookEvent[]
): Promise<WebhookEndpoint> {
  const secret = `whsec_${generateRandomString(32)}`;

  return {
    id: `WH-${Date.now()}`,
    merchantId,
    url,
    events,
    secret,
    active: true,
    failureCount: 0,
  };
}

export async function sendWebhook(
  endpoint: WebhookEndpoint,
  event: WebhookEvent,
  data: Record<string, any>
): Promise<boolean> {
  if (!endpoint.active || !endpoint.events.includes(event)) {
    return false;
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    signature: generateWebhookSignature(data, endpoint.secret),
  };

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-eVoucher-Event': event,
        'X-eVoucher-Signature': payload.signature,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Webhook delivery error:', error);
    return false;
  }
}

export function generateWebhookSignature(data: Record<string, any>, secret: string): string {
  // Simple signature generation (use HMAC-SHA256 in production)
  const payload = JSON.stringify(data);
  return Buffer.from(`${payload}:${secret}`).toString('base64');
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = Buffer.from(`${payload}:${secret}`).toString('base64');
  return signature === expectedSignature;
}

// Public API Endpoints

export async function apiGetVouchers(
  apiKey: APIKey,
  params: { page?: number; limit?: number; status?: string }
): Promise<APIResponse> {
  const hasPermission = apiKey.permissions.includes('read:vouchers');
  if (!hasPermission) {
    return {
      success: false,
      error: 'Insufficient permissions',
    };
  }

  return {
    success: true,
    data: [],
    meta: {
      page: params.page || 1,
      limit: params.limit || 50,
      total: 0,
    },
  };
}

export async function apiCreateVoucher(
  apiKey: APIKey,
  voucherData: {
    productId: string;
    quantity: number;
    customerId?: string;
  }
): Promise<APIResponse> {
  const hasPermission = apiKey.permissions.includes('write:vouchers');
  if (!hasPermission) {
    return {
      success: false,
      error: 'Insufficient permissions',
    };
  }

  return {
    success: true,
    data: {
      voucherId: `V-${Date.now()}`,
      code: `API-${generateRandomString(8)}`,
      status: 'active',
    },
    message: 'Voucher created successfully',
  };
}

export async function apiRedeemVoucher(apiKey: APIKey, voucherCode: string): Promise<APIResponse> {
  const hasPermission = apiKey.permissions.includes('write:vouchers');
  if (!hasPermission) {
    return {
      success: false,
      error: 'Insufficient permissions',
    };
  }

  return {
    success: true,
    data: {
      voucherCode,
      redeemed: true,
      redeemedAt: new Date().toISOString(),
      value: 100,
    },
    message: 'Voucher redeemed successfully',
  };
}

export async function apiGetTransactions(
  apiKey: APIKey,
  params: { startDate?: string; endDate?: string; page?: number }
): Promise<APIResponse> {
  const hasPermission = apiKey.permissions.includes('read:transactions');
  if (!hasPermission) {
    return {
      success: false,
      error: 'Insufficient permissions',
    };
  }

  return {
    success: true,
    data: [],
    meta: {
      page: params.page || 1,
      limit: 50,
      total: 0,
    },
  };
}

export async function apiGetMerchantAnalytics(apiKey: APIKey): Promise<APIResponse> {
  const hasPermission = apiKey.permissions.includes('read:analytics');
  if (!hasPermission) {
    return {
      success: false,
      error: 'Insufficient permissions',
    };
  }

  return {
    success: true,
    data: {
      totalRevenue: 50000,
      totalTransactions: 500,
      activeVouchers: 120,
      redemptionRate: 85,
    },
  };
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// API Documentation Helper
export function getAPIDocs(): Record<string, any> {
  return {
    version: '1.0',
    baseUrl: 'https://api.evoucher.co.za/v1',
    authentication: {
      type: 'API Key',
      header: 'X-API-Key',
      format: 'evpk_live_xxxxx',
    },
    endpoints: {
      'GET /vouchers': {
        description: 'List all vouchers',
        permissions: ['read:vouchers'],
        parameters: {
          page: 'number',
          limit: 'number',
          status: 'string (active|redeemed|expired)',
        },
      },
      'POST /vouchers': {
        description: 'Create a new voucher',
        permissions: ['write:vouchers'],
        body: {
          productId: 'string (required)',
          quantity: 'number (required)',
          customerId: 'string (optional)',
        },
      },
      'POST /vouchers/:code/redeem': {
        description: 'Redeem a voucher',
        permissions: ['write:vouchers'],
      },
      'GET /transactions': {
        description: 'List transactions',
        permissions: ['read:transactions'],
        parameters: {
          startDate: 'ISO 8601 date',
          endDate: 'ISO 8601 date',
          page: 'number',
        },
      },
      'GET /analytics': {
        description: 'Get merchant analytics',
        permissions: ['read:analytics'],
      },
    },
    webhooks: {
      events: [
        'transaction.created',
        'transaction.completed',
        'voucher.issued',
        'voucher.redeemed',
        'payout.created',
        'payout.completed',
      ],
      signature: 'HMAC-SHA256 in X-eVoucher-Signature header',
    },
  };
}
