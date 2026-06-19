import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/server/utils/auth';
import { logApiEvent } from '@/server/utils/log-api-event';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { merchantId: string } }
) {
  const supabase = createClient();
  const { isAuthed, user, error: authError } = await isAdmin(supabase);
  if (authError || !isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { merchantId } = params;
  if (!merchantId) {
    return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
  }

  // Log the access event for audit purposes
  await logApiEvent(supabase, {
    eventType: 'admin.merchant_details.view',
    actorId: user.id,
    targetId: merchantId,
    details: {
      message: `Admin user viewed extended details for merchant.`,
      merchantId,
    },
  });

  const { data: merchant, error } = await supabase
    .from('merchants')
    .select(
      'id, business_name, address, registration_number, tax_clearance_pin, status, workflow_status'
    )
    .eq('id', merchantId)
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch merchant details', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(merchant);
}