import crypto from 'crypto';
import { REQUIRED_COMPLIANCE_DOCUMENTS } from '@/server/utils/compliance';

export const MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const VALID_DOCUMENT_TYPES = new Set(
  REQUIRED_COMPLIANCE_DOCUMENTS.map((document) => document.type)
);

export type DocumentValidationResult =
  | { ok: true }
  | { ok: false; error: string; code: 'invalid_type' | 'invalid_file' | 'empty_file' | 'too_large' | 'mime_type' };

export function sanitizeDocumentFilename(name: string) {
  const safeName = String(name || 'document')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 120);

  return safeName || 'document';
}

export function validateDocumentType(documentType: string): DocumentValidationResult {
  if (!VALID_DOCUMENT_TYPES.has(documentType as any)) {
    return { ok: false, error: 'Invalid document type.', code: 'invalid_type' };
  }
  return { ok: true };
}

export function validateDocumentFile(file: unknown): DocumentValidationResult {
  if (!(file instanceof File)) {
    return { ok: false, error: 'File is required.', code: 'invalid_file' };
  }
  if (file.size <= 0) {
    return { ok: false, error: 'Uploaded file is empty.', code: 'empty_file' };
  }
  if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
    return { ok: false, error: 'File exceeds 10MB upload limit.', code: 'too_large' };
  }
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
    return {
      ok: false,
      error: 'Unsupported file type. Upload PDF, JPG, PNG, or WebP documents only.',
      code: 'mime_type',
    };
  }
  return { ok: true };
}

export function buildDocumentObjectPath(params: {
  merchantId: string;
  documentType: string;
  fileName: string;
}) {
  const safeName = sanitizeDocumentFilename(params.fileName);
  return `${params.merchantId}/${params.documentType}/${Date.now()}-${safeName}`;
}

export function sha256Hex(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function getComplianceStorageBucket() {
  return process.env.COMPLIANCE_STORAGE_BUCKET || 'merchant-compliance-documents';
}
