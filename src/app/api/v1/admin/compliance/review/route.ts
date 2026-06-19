import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';
import { writeAuditEvent } from '@/server/utils/audit';
import { sendMerchantDocumentReviewEmail } from '@/server/utils/merchant-notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_REVIEW_ROLES = new Set(['admin', 'compliance_officer', 'devops']);
const ALLOWED_STATUSES = new Set(['VERIFIED', 'FAILED', 'EXPIRED', 'PENDING', 'NEEDS_MORE']);

function mapComplianceToVerification(status: string) {
  const normalized = String(status).trim().toUpperCase();
  if (normalized === 'VERIFIED') return 'approved';
  if (normalized === 'FAILED') return 'rejected';
  if (normalized === 'EXPIRED') return 'rejected';
  if (normalized === 'NEEDS_MORE') return 'under_review';
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

function mapVerificationToEmailStatus(status: string): 'approved' | 'rejected' | 'under_review' {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'under_review';
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
        { error: 'status must be one of PENDING, VERIFIED, FAILED, EXPIRED, NEEDS_MORE.' },
        { status: 400 }
      );
    }
    const notes = body.notes ? String(body.notes).slice(0, 500) : null;
    if ((status === 'FAILED' || status === 'NEEDS_MORE') && !notes) {
      return NextResponse.json(
        {
          error: 'Reviewer notes are required for rejected documents or more information requests.',
        },
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
        reviewed_by: user.id,
        reviewed_at: reviewedAt,
        reviewer_notes: notes,
      })
      .eq('id', documentId)
      .select(
        'id,merchant_id,document_type,document_url,storage_bucket,storage_path,original_file_name,verification_status,reviewed_by,reviewed_at,reviewer_notes'
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to review document.' },
        { status: 500 }
      );
    }

    await writeAuditEvent(admin, {
      actorId: user.id,
      actorRole: role,
      entityType: 'merchant_kyc_document',
      entityId: data?.id ?? documentId,
      action: 'merchant_document_reviewed',
      metadata: {
        merchantId: data?.merchant_id ?? null,
        documentType: data?.document_type ?? null,
        status,
        verificationStatus,
        notes,
      },
    });

    if (data?.merchant_id) {
      const { data: merchant } = await admin
        .from('merchants')
        .select('id,business_name,email')
        .eq('id', data.merchant_id)
        .maybeSingle();

      if (merchant?.email) {
        const notification = await sendMerchantDocumentReviewEmail({
          merchantId: merchant.id,
          businessName: merchant.business_name ?? 'your business',
          merchantEmail: merchant.email,
          documentType: data?.document_type ?? 'compliance document',
          status: mapVerificationToEmailStatus(verificationStatus),
          reviewerNotes: notes,
        });
        if (!notification.sent) {
          console.warn('[merchant-document-review][notification][warn]', notification.error);
        }
      }
    }

    return NextResponse.json({
      message: 'Document review updated.',
      notes,
      document: {
        id: data?.id ?? null,
        merchant_id: data?.merchant_id ?? null,
        document_type: data?.document_type ?? null,
        file_url: data?.document_url?.startsWith('http') ? data.document_url : null,
        storage_bucket: data?.storage_bucket ?? null,
        storage_path: data?.storage_path ?? null,
        file_name: data?.original_file_name ?? null,
        status: mapVerificationToCompliance(data?.verification_status ?? ''),
        reviewed_by: data?.reviewed_by ?? user.id,
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
