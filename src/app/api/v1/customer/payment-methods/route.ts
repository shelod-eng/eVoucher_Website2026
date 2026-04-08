import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/utils/auth';
import { isConsumerRole, resolveUserRole } from '@/server/utils/role';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noStoreHeaders(existing?: HeadersInit): HeadersInit {
  return {
    ...(existing ?? {}),
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    Vary: 'Cookie, Authorization',
  };
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...(init ?? {}),
    headers: noStoreHeaders(init?.headers),
  });
}

interface CreatePaymentMethodRequest {
  methodType: 'card' | 'eft' | 'wallet' | 'other';
  provider: string;
  maskedReference: string;
  isDefault?: boolean;
}

function validateInput(body: CreatePaymentMethodRequest) {
  if (!body.methodType) return 'Method type is required.';
  if (!body.provider?.trim()) return 'Provider is required.';
  if (!body.maskedReference?.trim()) return 'Masked reference is required.';
  return null;
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return jsonNoStore(
        { error: 'You must be signed in as a consumer.', code: 'unauthenticated' },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return jsonNoStore(
        { error: 'Payment methods are available to consumers only.', code: 'consumer_only' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('customer_payment_methods')
      .select('id,method_type,provider,masked_reference,is_default,is_active,created_at')
      .eq('customer_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return jsonNoStore({
      paymentMethods: data ?? [],
    });
  } catch (error: any) {
    return jsonNoStore(
      {
        error: error?.message || 'Failed to load payment methods.',
        code: 'payment_methods_failed',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) {
      return jsonNoStore(
        { error: 'You must be signed in as a consumer.', code: 'unauthenticated' },
        { status: 401 }
      );
    }

    const { role } = await resolveUserRole(supabase, user);
    if (!isConsumerRole(role)) {
      return jsonNoStore(
        { error: 'Payment methods are available to consumers only.', code: 'consumer_only' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as CreatePaymentMethodRequest;
    const validationError = validateInput(body);
    if (validationError) {
      return jsonNoStore({ error: validationError, code: 'invalid_input' }, { status: 400 });
    }

    if (body.isDefault) {
      await supabase
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('customer_id', user.id);
    }

    const { data, error } = await supabase
      .from('customer_payment_methods')
      .insert({
        customer_id: user.id,
        method_type: body.methodType,
        provider: body.provider.trim(),
        masked_reference: body.maskedReference.trim(),
        is_default: Boolean(body.isDefault),
      })
      .select('id,method_type,provider,masked_reference,is_default,is_active,created_at')
      .single();

    if (error) throw error;

    return jsonNoStore(
      {
        message: 'Payment method added successfully.',
        paymentMethod: data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return jsonNoStore(
      {
        error: error?.message || 'Failed to add payment method.',
        code: 'payment_method_add_failed',
      },
      { status: 500 }
    );
  }
}
