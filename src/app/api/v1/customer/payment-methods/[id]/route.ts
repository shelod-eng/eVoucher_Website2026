import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';

interface UpdatePaymentMethodRequest {
  isDefault?: boolean;
  isActive?: boolean;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in as a consumer.', code: 'unauthenticated' },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        { error: 'Payment methods are available to consumers only.', code: 'consumer_only' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as UpdatePaymentMethodRequest;

    if (body.isDefault) {
      await supabase
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('customer_id', user.id);
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.isDefault !== undefined) updatePayload.is_default = Boolean(body.isDefault);
    if (body.isActive !== undefined) updatePayload.is_active = Boolean(body.isActive);

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided.', code: 'no_updates' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('customer_payment_methods')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('customer_id', user.id)
      .select('id,method_type,provider,masked_reference,is_default,is_active,created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Payment method updated.',
      paymentMethod: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to update payment method.',
        code: 'payment_method_update_failed',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in as a consumer.', code: 'unauthenticated' },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return NextResponse.json(
        { error: 'Payment methods are available to consumers only.', code: 'consumer_only' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('customer_payment_methods')
      .update({ is_active: false, is_default: false })
      .eq('id', params.id)
      .eq('customer_id', user.id);

    if (error) throw error;

    return NextResponse.json({
      message: 'Payment method removed.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to remove payment method.',
        code: 'payment_method_remove_failed',
      },
      { status: 500 }
    );
  }
}
