import request from 'supertest';
import app from '../src/app'; // adjust path to your Express/Fastify app

describe('POST /api/v1/merchant/onboarding/verify-email', () => {
  const validMerchantId = '4634a1e3-cccd-4cba-9c04-691e34623e66'; // valid UUID
  const validToken = 'abc123def456ghi789'; // synthetic token string

  it('should verify email successfully with valid UUID and token', async () => {
    const res = await request(app)
      .post('/api/v1/merchant/onboarding/verify-email')
      .query({ merchantId: validMerchantId, token: validToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should fail with invalid merchantId (not a UUID)', async () => {
    const res = await request(app)
      .post('/api/v1/merchant/onboarding/verify-email')
      .query({ merchantId: '12345', token: validToken });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid merchantId');
  });

  it('should fail with missing token', async () => {
    const res = await request(app)
      .post('/api/v1/merchant/onboarding/verify-email')
      .query({ merchantId: validMerchantId });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid token');
  });
});
