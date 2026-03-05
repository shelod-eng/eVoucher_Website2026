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

import { PATCH, DELETE } from '@/app/api/v1/merchant/products/[id]/route';

describe('PATCH/DELETE /api/v1/merchant/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAdminClient.mockReturnValue({});
    mocks.getAuthenticatedUser.mockResolvedValue({
      supabase: {},
      user: { id: 'user-1', email: 'merchant@example.com', user_metadata: {} },
    });
  });

  it('returns 403 for non-merchant and non-mapped users', async () => {
    mocks.resolveUserRole.mockResolvedValue({ role: 'customer' });
    mocks.resolveMerchantForUser.mockResolvedValue({
      id: 'merchant-1',
      user_id: 'another-user',
      status: 'approved',
    });

    const response = await PATCH(
      new Request('http://localhost/api/v1/merchant/products/p1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: 'New Name' }),
      }),
      { params: { id: 'p1' } }
    );

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.code).toBe('merchant_only');
  });

  it('returns 409 for mapped merchant when status is pending', async () => {
    mocks.resolveUserRole.mockResolvedValue({ role: 'customer' });
    mocks.resolveMerchantForUser.mockResolvedValue({
      id: 'merchant-1',
      user_id: 'user-1',
      status: 'pending',
    });

    const response = await DELETE(
      new Request('http://localhost/api/v1/merchant/products/p1', {
        method: 'DELETE',
      }),
      { params: { id: 'p1' } }
    );

    expect(response.status).toBe(409);
    const payload = await response.json();
    expect(payload.code).toBe('merchant_not_approved');
  });
});
