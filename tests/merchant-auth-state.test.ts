import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  resolveUserRole: vi.fn(),
  createAdminClient: vi.fn(),
  resolveMerchantForUser: vi.fn(),
  reconcileMerchantResetState: vi.fn(),
}));

vi.mock('@/server/utils/auth', () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock('@/server/utils/role', () => ({
  resolveUserRole: mocks.resolveUserRole,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock('@/server/utils/merchant-profile', () => ({
  resolveMerchantForUser: mocks.resolveMerchantForUser,
}));

vi.mock('@/server/utils/merchant-onboarding', () => ({
  reconcileMerchantResetState: mocks.reconcileMerchantResetState,
}));

import { GET } from '@/app/api/v1/merchant/auth-state/route';

describe('GET /api/v1/merchant/auth-state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAdminClient.mockReturnValue({});
  });

  it('enforces mustResetPassword when metadata is true even if merchant DB flag is false', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      supabase: {},
      user: {
        id: 'user-1',
        user_metadata: { must_change_password: true },
      },
    });
    mocks.resolveUserRole.mockResolvedValue({ role: 'merchant' });
    mocks.resolveMerchantForUser.mockResolvedValue({
      id: 'merchant-1',
      user_id: 'user-1',
      must_reset_password: false,
      status: 'approved',
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.isMerchant).toBe(true);
    expect(payload.mustResetPassword).toBe(true);
    expect(mocks.reconcileMerchantResetState).toHaveBeenCalledWith('user-1');
  });

  it('allows mapped merchant when role resolver does not return merchant', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      supabase: {},
      user: {
        id: 'user-2',
        user_metadata: {},
      },
    });
    mocks.resolveUserRole.mockResolvedValue({ role: 'customer' });
    mocks.resolveMerchantForUser.mockResolvedValue({
      id: 'merchant-2',
      user_id: 'user-2',
      must_reset_password: false,
      status: 'active',
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.isMerchant).toBe(true);
    expect(payload.merchantId).toBe('merchant-2');
  });
});
