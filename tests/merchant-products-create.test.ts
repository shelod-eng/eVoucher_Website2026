import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  resolveUserRole: vi.fn(),
  resolveMerchantForUser: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock('@/server/utils/auth', () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock('@/server/utils/role', () => ({
  resolveUserRole: mocks.resolveUserRole,
  isMerchantRole: (role: string) => role === 'merchant',
}));

vi.mock('@/server/utils/merchant-profile', () => ({
  resolveMerchantForUser: mocks.resolveMerchantForUser,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}));

function buildAdminMock() {
  return {
    from: (table: string) => {
      if (table === 'merchant_products') {
        return {
          insert: (_payload: any) => ({
            select: (_columns: string) => ({
              single: async () => ({
                data: {
                  id: 'product-1',
                  product_name: 'R100 Voucher',
                  face_value: 100,
                  total_discount_pct: 5,
                  is_active: true,
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'audit_events') {
        return {
          insert: async () => ({ error: null }),
        };
      }

      return {
        insert: async () => ({ error: null }),
      };
    },
  };
}

import { POST } from '@/app/api/v1/merchant/products/route';

describe('POST /api/v1/merchant/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAdminClient.mockReturnValue(buildAdminMock());
    mocks.getAuthenticatedUser.mockResolvedValue({
      supabase: {},
      user: { id: 'user-1', email: 'merchant@example.com', user_metadata: {} },
    });
  });

  it('returns 409 when merchant is not approved/active', async () => {
    mocks.resolveUserRole.mockResolvedValue({ role: 'merchant' });
    mocks.resolveMerchantForUser.mockResolvedValue({
      id: 'merchant-1',
      user_id: 'user-1',
      business_name: 'Merchant One',
      parent_brand: 'Merchant One',
      default_total_discount_pct: 5,
      status: 'pending',
    });

    const response = await POST(
      new Request('http://localhost/api/v1/merchant/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: 'R100 Voucher',
          faceValue: 100,
          totalDiscountPct: 5,
        }),
      })
    );

    expect(response.status).toBe(409);
    const payload = await response.json();
    expect(payload.code).toBe('merchant_not_approved');
  });

  it('creates a product for mapped merchant even when role source drifts', async () => {
    mocks.resolveUserRole.mockResolvedValue({ role: 'customer' });
    mocks.resolveMerchantForUser.mockResolvedValue({
      id: 'merchant-1',
      user_id: 'user-1',
      business_name: 'Merchant One',
      parent_brand: 'Merchant One',
      default_total_discount_pct: 5,
      status: 'approved',
    });

    const response = await POST(
      new Request('http://localhost/api/v1/merchant/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: 'R100 Voucher',
          faceValue: 100,
          totalDiscountPct: 5,
        }),
      })
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.message).toBe('Product created successfully.');
    expect(payload.product.id).toBe('product-1');
  });
});
