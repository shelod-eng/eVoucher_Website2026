import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { getComplianceStorageBucket } from '@/server/utils/document-validator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_REVIEW_ROLES = new Set(['admin', 'compliance_officer', 'devops']);

function parseLegacyStorageUrl(documentUrl: string | null) {
  const value = String(documentUrl ?? '').trim();
  if (!value.startsWith('supabase://')) return null;
  const withoutScheme = value.replace('supabase://', '');
  const [bucket, ...pathParts] = withoutScheme.split('/');
  const path = pathParts.join('/');
  if (!bucket || !path) return null;
  return { bucket, path };
}

export async function GET(
  _request: Request,
  context: { params: { documentId: string } }
) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!ALLOWED_REVIEW_ROLES.has(String(role).toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const documentId = String(context.params.documentId ?? '').trim();
    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('merchant_kyc_documents')
      .select('id,document_url,storage_bucket,storage_path,original_file_name')
      .eq('id', documentId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Document not found.' },
        { status: error ? 500 : 404 }
      );
    }

    if (data.document_url?.startsWith('http')) {
      return NextResponse.json({
        signedUrl: data.document_url,
        expiresIn: null,
        fileName: data.original_file_name ?? null,
      });
    }

    const parsed = parseLegacyStorageUrl(data.document_url);
    const bucket = data.storage_bucket ?? parsed?.bucket ?? getComplianceStorageBucket();
    const path = data.storage_path ?? parsed?.path;

    if (!path) {
      return NextResponse.json(
        { error: 'Document storage path is missing.' },
        { status: 409 }
      );
    }

    const expiresIn = 60 * 5;
    const signed = await admin.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (signed.error) {
      return NextResponse.json({ error: signed.error.message }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: signed.data.signedUrl,
      expiresIn,
      fileName: data.original_file_name ?? null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create document preview URL.' },
      { status: 500 }
    );
  }
}
