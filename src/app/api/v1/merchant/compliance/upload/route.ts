import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';
import { writeAuditEvent } from '@/server/utils/audit';
import {
  buildDocumentObjectPath,
  getComplianceStorageBucket,
  sanitizeDocumentFilename,
  sha256Hex,
  validateDocumentFile,
  validateDocumentType,
} from '@/server/utils/document-validator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function inferFileNameFromUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').filter(Boolean).pop();
    return last ? decodeURIComponent(last) : null;
  } catch {
    const last = String(url).split('/').filter(Boolean).pop();
    return last ? decodeURIComponent(last) : null;
  }
}

function mapVerificationStatus(value: unknown) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (normalized === 'approved') return 'VERIFIED';
  if (normalized === 'rejected') return 'FAILED';
  if (normalized === 'under_review') return 'PENDING';
  if (normalized === 'submitted') return 'PENDING';
  return 'PENDING';
}

function isMerchantContext(
  role: string,
  merchant: { user_id?: string | null } | null,
  userId: string
) {
  if (role === 'merchant') return true;
  return Boolean(merchant?.user_id) && String(merchant?.user_id) === String(userId);
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    const admin = createAdminClient();
    const merchant = await resolveMerchantForUser<{
      id: string;
      user_id: string | null;
      status: string | null;
    }>(admin, user, 'id,user_id,status');

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant profile not found.' }, { status: 404 });
    }
    if (!isMerchantContext(role, merchant, user.id)) {
      return NextResponse.json(
        { error: 'Merchant-only endpoint.', code: 'merchant_only' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const documentType = String(formData.get('documentType') ?? '')
      .trim()
      .toUpperCase();
    const fileEntry = formData.get('file');

    const documentTypeValidation = validateDocumentType(documentType);
    if (!documentTypeValidation.ok) {
      return NextResponse.json(
        { error: documentTypeValidation.error, code: documentTypeValidation.code },
        { status: 400 }
      );
    }

    const fileValidation = validateDocumentFile(fileEntry);
    if (!fileValidation.ok) {
      return NextResponse.json(
        { error: fileValidation.error, code: fileValidation.code },
        { status: 400 }
      );
    }
    const file = fileEntry as File;

    const bucket = getComplianceStorageBucket();
    const safeName = sanitizeDocumentFilename(file.name);
    const objectPath = buildDocumentObjectPath({
      merchantId: merchant.id,
      documentType,
      fileName: safeName,
    });
    let fileUrl: string | null = null;
    let fileChecksum: string | null = null;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      fileChecksum = sha256Hex(buffer);
      const upload = await admin.storage.from(bucket).upload(objectPath, buffer, {
        contentType: file.type,
        upsert: false,
      });
      if (!upload.error) {
        fileUrl = `supabase://${bucket}/${objectPath}`;
      } else {
        console.warn('[merchant-compliance][upload][warn]', upload.error.message);
      }
    } catch (storageError: any) {
      console.warn(
        '[merchant-compliance][upload-storage][warn]',
        storageError?.message || storageError
      );
    }

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File upload failed. Please try again.' },
        { status: 500 }
      );
    }

    const { data, error } = await admin
      .from('merchant_kyc_documents')
      .insert({
        merchant_id: merchant.id,
        document_type: documentType,
        document_url: fileUrl,
        storage_bucket: bucket,
        storage_path: objectPath,
        original_file_name: safeName,
        mime_type: file.type,
        size_bytes: file.size,
        checksum_sha256: fileChecksum,
        verification_status: 'submitted',
        uploaded_by: user.id,
      })
      .select(
        'id,merchant_id,document_type,document_url,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,checksum_sha256,verification_status,uploaded_by,uploaded_at,reviewed_at,reviewer_notes'
      )
      .single();

    if (error) {
      await admin.storage.from(bucket).remove([objectPath]).catch(() => null);
      return NextResponse.json(
        {
          error: error.message || 'Failed to save compliance document.',
          code: 'compliance_upload_failed',
        },
        { status: 500 }
      );
    }

    await writeAuditEvent(admin, {
      actorId: user.id,
      actorRole: role,
      entityType: 'merchant_kyc_document',
      entityId: data?.id ?? null,
      action: 'merchant_document_uploaded',
      metadata: {
        merchantId: merchant.id,
        documentType,
        storageBucket: bucket,
        storagePath: objectPath,
        mimeType: file.type,
        sizeBytes: file.size,
        checksumSha256: fileChecksum,
      },
    });

    return NextResponse.json(
      {
        message: 'Document uploaded successfully.',
        document: {
          id: data?.id ?? null,
          merchant_id: data?.merchant_id ?? merchant.id,
          document_type: data?.document_type ?? documentType,
          file_name:
            data?.original_file_name ??
            inferFileNameFromUrl(data?.document_url ?? fileUrl) ??
            safeName,
          file_url: null,
          storage_bucket: data?.storage_bucket ?? bucket,
          storage_path: data?.storage_path ?? objectPath,
          mime_type: data?.mime_type ?? file.type,
          size_bytes: data?.size_bytes ?? file.size,
          checksum_sha256: data?.checksum_sha256 ?? fileChecksum,
          status: mapVerificationStatus(data?.verification_status),
          uploaded_at: data?.uploaded_at ?? null,
          reviewed_by: null,
          reviewed_at: data?.reviewed_at ?? null,
          expires_at: null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to upload compliance document.' },
      { status: 500 }
    );
  }
}
