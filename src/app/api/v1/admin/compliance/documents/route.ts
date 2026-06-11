import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_REVIEW_ROLES = new Set(['admin', 'compliance_officer', 'devops']);

function mapVerificationToCompliance(status: string) {
  const normalized = String(status).trim().toLowerCase();
  if (normalized === 'approved') return 'VERIFIED';
  if (normalized === 'rejected') return 'FAILED';
  if (normalized === 'under_review') return 'PENDING';
  if (normalized === 'submitted') return 'PENDING';
  return 'PENDING';
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!ALLOWED_REVIEW_ROLES.has(String(role).toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = String(url.searchParams.get('status') ?? '').trim().toLowerCase();
    const documentType = String(url.searchParams.get('documentType') ?? '').trim().toUpperCase();
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '50') || 50, 100);

    const admin = createAdminClient();
    let query = admin
      .from('merchant_kyc_documents')
      .select(
        'id,merchant_id,document_type,document_url,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,checksum_sha256,verification_status,uploaded_by,uploaded_at,reviewed_by,reviewed_at,reviewer_notes,merchants(id,business_name,email,status)'
      )
      .order('uploaded_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('verification_status', status);
    }
    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to load compliance documents.' },
        { status: 500 }
      );
    }

    const documents = (data ?? []).map((row: any) => ({
      id: row.id,
      merchantId: row.merchant_id,
      merchantName: row.merchants?.business_name ?? null,
      merchantEmail: row.merchants?.email ?? null,
      merchantStatus: row.merchants?.status ?? null,
      documentType: row.document_type,
      fileName: row.original_file_name ?? null,
      fileUrl: row.document_url?.startsWith('http') ? row.document_url : null,
      storageBucket: row.storage_bucket ?? null,
      storagePath: row.storage_path ?? null,
      mimeType: row.mime_type ?? null,
      sizeBytes: row.size_bytes ?? null,
      checksumSha256: row.checksum_sha256 ?? null,
      status: mapVerificationToCompliance(row.verification_status ?? ''),
      rawStatus: row.verification_status ?? null,
      uploadedBy: row.uploaded_by ?? null,
      uploadedAt: row.uploaded_at ?? null,
      reviewedBy: row.reviewed_by ?? null,
      reviewedAt: row.reviewed_at ?? null,
      reviewerNotes: row.reviewer_notes ?? null,
    }));

    return NextResponse.json(
      { documents },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load compliance documents.' },
      { status: 500 }
    );
  }
}
