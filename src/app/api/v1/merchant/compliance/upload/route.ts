import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { resolveMerchantForUser } from '@/server/utils/merchant-profile';
import { REQUIRED_COMPLIANCE_DOCUMENTS } from '@/server/utils/compliance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_DOCUMENT_TYPES = new Set(REQUIRED_COMPLIANCE_DOCUMENTS.map((doc) => doc.type));

function sanitizeFilename(name: string) {
  return String(name || 'document')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .slice(0, 120);
}

function inferContentType(file: File) {
  return file.type || 'application/octet-stream';
}

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
    const file = formData.get('file');

    if (!VALID_DOCUMENT_TYPES.has(documentType as any)) {
      return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required.' }, { status: 400 });
    }
    if (file.size <= 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'File exceeds 10MB upload limit.' }, { status: 400 });
    }

    const bucket = process.env.COMPLIANCE_STORAGE_BUCKET || 'merchant-compliance-documents';
    const safeName = sanitizeFilename(file.name);
    const objectPath = `${merchant.id}/${documentType}/${Date.now()}-${safeName}`;
    let fileUrl: string | null = null;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await admin.storage.from(bucket).upload(objectPath, buffer, {
        contentType: inferContentType(file),
        upsert: false,
      });
      if (!upload.error) {
        const publicUrl = admin.storage.from(bucket).getPublicUrl(objectPath);
        fileUrl = publicUrl?.data?.publicUrl ?? null;
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
        verification_status: 'submitted',
        uploaded_by: user.id,
      })
      .select(
        'id,merchant_id,document_type,document_url,verification_status,uploaded_by,uploaded_at,reviewed_at,reviewer_notes'
      )
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message || 'Failed to save compliance document.',
          code: 'compliance_upload_failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Document uploaded successfully.',
        document: {
          id: data?.id ?? null,
          merchant_id: data?.merchant_id ?? merchant.id,
          document_type: data?.document_type ?? documentType,
          file_name: inferFileNameFromUrl(data?.document_url ?? fileUrl),
          file_url: data?.document_url ?? fileUrl,
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
