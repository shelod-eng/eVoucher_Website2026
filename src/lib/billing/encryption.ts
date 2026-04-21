import crypto from 'crypto';

type EncryptionResult = {
  ciphertext: string; // base64
  keyId: string;
};

function getKeyBytes() {
  const keyHex = String(process.env.BILLING_ENCRYPTION_KEY ?? '').trim();
  if (!keyHex) {
    throw new Error('Missing BILLING_ENCRYPTION_KEY.');
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('BILLING_ENCRYPTION_KEY must be a 32-byte hex key.');
  }
  return key;
}

/**
 * AES-256-GCM encryption with random 12-byte IV.
 * Stored format (base64): v1:<iv_b64>:<tag_b64>:<cipher_b64>
 */
export function encryptSensitive(plaintext: string): EncryptionResult {
  const normalized = String(plaintext ?? '').trim();
  if (!normalized) throw new Error('Plaintext is required.');

  const keyId = String(process.env.BILLING_ENCRYPTION_KEY_ID ?? 'v1').trim() || 'v1';
  const key = getKeyBytes();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const cipherBuf = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const out = [
    keyId,
    iv.toString('base64'),
    tag.toString('base64'),
    cipherBuf.toString('base64'),
  ].join(':');
  return { ciphertext: out, keyId };
}

export function decryptSensitive(ciphertext: string): string {
  const raw = String(ciphertext ?? '').trim();
  if (!raw) throw new Error('Ciphertext is required.');

  const parts = raw.split(':');
  if (parts.length !== 4) throw new Error('Invalid ciphertext format.');

  const [, ivB64, tagB64, cipherB64] = parts;
  const key = getKeyBytes();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const cipherBuf = Buffer.from(cipherB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(cipherBuf), decipher.final()]);
  return plain.toString('utf8');
}

