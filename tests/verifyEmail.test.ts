import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  verifyMerchantEmailToken: vi.fn(),
}));

vi.mock('@/server/utils/auth', () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock('@/server/utils/merchant-onboarding', () => ({
  verifyMerchantEmailToken: mocks.verifyMerchantEmailToken,
}));

import { POST } from '@/app/api/v1/merchant/onboarding/verify-email/route';

describe('POST /api/v1/merchant/onboarding/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success payload for valid token verification', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.verifyMerchantEmailToken.mockResolvedValue({
      ok: true,
      approved: true,
      status: 'approved',
      vettingStatus: 'approved',
      emailVerified: true,
      phoneVerified: true,
      message: 'ok',
      statusData: {
        merchantId: 'merchant-1',
        credentialsIssued: true,
        mustResetPassword: true,
        loginReady: true,
      },
    });

    const response = await POST(
      new Request('http://localhost/api/v1/merchant/onboarding/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: 'merchant-1', token: 'token-1' }),
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.approved).toBe(true);
    expect(payload.status).toBe('approved');
    expect(payload.merchantId).toBe('merchant-1');
    expect(payload.credentialsIssued).toBe(true);
    expect(payload.mustResetPassword).toBe(true);
    expect(mocks.verifyMerchantEmailToken).toHaveBeenCalledWith({
      merchantId: 'merchant-1',
      token: 'token-1',
      actorId: 'user-1',
    });
  });

  it('returns route-level error when verification service rejects payload', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ user: null });
    mocks.verifyMerchantEmailToken.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Invalid token.',
    });

    const response = await POST(
      new Request('http://localhost/api/v1/merchant/onboarding/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: 'merchant-1', token: '' }),
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Invalid token.');
  });
});
