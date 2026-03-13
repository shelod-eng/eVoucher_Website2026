import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { resolveUserRole } from '@/server/utils/role';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_REVIEW_ROLES = new Set(['admin', 'compliance_officer', 'devops']);
const ALLOWED_STATUSES = new Set(['VERIFIED', 'FAILED', 'EXPIRED', 'PENDING']);

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
    const { data, error } = await admin
      .from('compliance_documents')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: reviewedAt,
      })
      .eq('id', documentId)
      .select('id,merchant_id,document_type,status,reviewed_by,reviewed_at')
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
      document: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process compliance review.' },
      { status: 500 }
    );
  }
}
