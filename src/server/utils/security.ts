import crypto from 'crypto';

export function generateSecureVoucherCode(prefix = 'VCH'): string {
  const random = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

export function generateTransactionReference(prefix = 'TXN'): string {
  const random = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function verifyHmacSha256(params: {
  payload: string;
  signature: string;
  secret: string;
}): boolean {
  const expected = crypto
    .createHmac('sha256', params.secret)
    .update(params.payload)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf-8');
  const signatureBuffer = Buffer.from(params.signature, 'utf-8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function isFreshTimestamp(unixTimestamp: string | null, windowSeconds = 300): boolean {
  if (!unixTimestamp) return false;
  const parsed = Number(unixTimestamp);
  if (!Number.isFinite(parsed)) return false;

  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - parsed) <= windowSeconds;
}
