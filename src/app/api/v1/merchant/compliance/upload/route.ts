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

    const { data, error } = await admin
      .from('compliance_documents')
      .insert({
        merchant_id: merchant.id,
        document_type: documentType,
        file_name: safeName,
        file_url: fileUrl,
        status: 'PENDING',
      })
      .select(
        'id,merchant_id,document_type,file_name,file_url,status,uploaded_at,reviewed_by,reviewed_at,expires_at'
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
        document: data,
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
