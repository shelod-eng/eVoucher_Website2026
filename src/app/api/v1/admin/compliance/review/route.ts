import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_REVIEW_ROLES = new Set(['admin', 'compliance_officer', 'devops']);
const ALLOWED_STATUSES = new Set(['VERIFIED', 'FAILED', 'EXPIRED', 'PENDING']);

function mapComplianceToVerification(status: string) {
  const normalized = String(status).trim().toUpperCase();
  if (normalized === 'VERIFIED') return 'approved';
  if (normalized === 'FAILED') return 'rejected';
  if (normalized === 'EXPIRED') return 'rejected';
  return 'under_review';
}

function mapVerificationToCompliance(status: string) {
  const normalized = String(status).trim().toLowerCase();
  if (normalized === 'approved') return 'VERIFIED';
  if (normalized === 'rejected') return 'FAILED';
  if (normalized === 'under_review') return 'PENDING';
  if (normalized === 'submitted') return 'PENDING';
  return 'PENDING';
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!ALLOWED_REVIEW_ROLES.has(String(role).toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as {
      documentId?: string;
      status?: string;
      notes?: string;
    };
    const documentId = String(body.documentId ?? '').trim();
    const status = String(body.status ?? '')
      .trim()
      .toUpperCase();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required.' }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: 'status must be one of PENDING, VERIFIED, FAILED, EXPIRED.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const reviewedAt = new Date().toISOString();
    const verificationStatus = mapComplianceToVerification(status);
    const { data, error } = await admin
      .from('merchant_kyc_documents')
      .update({
        verification_status: verificationStatus,
        reviewed_at: reviewedAt,
        reviewer_notes: body.notes ? String(body.notes).slice(0, 500) : null,
      })
      .eq('id', documentId)
      .select('id,merchant_id,document_type,document_url,verification_status,reviewed_at,reviewer_notes')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to review document.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Document review updated.',
      notes: body.notes ? String(body.notes).slice(0, 500) : null,
      document: {
        id: data?.id ?? null,
        merchant_id: data?.merchant_id ?? null,
        document_type: data?.document_type ?? null,
        file_url: data?.document_url ?? null,
        status: mapVerificationToCompliance(data?.verification_status ?? ''),
        reviewed_by: user.id,
        reviewed_at: data?.reviewed_at ?? reviewedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process compliance review.' },
      { status: 500 }
    );
  }
}
