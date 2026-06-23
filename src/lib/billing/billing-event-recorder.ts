/**
 * Billing Event Recorder Service
 * Creates billing_events entries for all transactions
 * Ensures visibility in Billing Engine dashboard
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface BillingEventInput {
  merchantId: string;
  customerId: string;
  transactionReference: string;
  voucherCode?: string;
  grossAmount: number;
  totalDiscountAmount: number;
  paymentMethod: string;
  eventType?: 'payment_transaction' | 'redemption' | 'refund' | 'adjustment' | 'manual_adjustment';
  metadata?: Record<string, any>;
}

/**
 * Create billing event for transaction tracking
 * This makes transactions visible in Billing Engine dashboard
 */
export async function createBillingEvent(
  supabase: SupabaseClient,
  event: BillingEventInput
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('billing_events')
      .insert({
        event_type: event.eventType || 'payment_transaction',
        merchant_id: event.merchantId,
        customer_id: event.customerId,
        gross_amount: event.grossAmount,
        total_discount_amount: event.totalDiscountAmount,
        occurred_at: now,
        metadata: {
          transactionReference: event.transactionReference,
          voucherCode: event.voucherCode,
          paymentMethod: event.paymentMethod,
          source: 'www.evoucher.co.za -> website billing',
          flow: 'checkout',
          transactionType: 'purchase',
          transaction_type: 'purchase', // Backward compatibility
          ...event.metadata,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[BillingEvent] Failed to create event:', error);
      return { success: false, error: error.message };
    }

    console.log('[BillingEvent] Event created successfully:', {
      eventId: data?.id,
      merchantId: event.merchantId,
      customerId: event.customerId,
      amount: event.grossAmount,
      method: event.paymentMethod,
    });

    return { success: true, eventId: data?.id };
  } catch (error: any) {
    console.error('[BillingEvent] Exception:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Batch create billing events
 * Useful for importing historical data or bulk operations
 */
export async function createBillingEventsBatch(
  supabase: SupabaseClient,
  events: BillingEventInput[]
): Promise<{ success: boolean; created: number; failed: number; errors: string[] }> {
  const results = {
    success: true,
    created: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const event of events) {
    const result = await createBillingEvent(supabase, event);
    if (result.success) {
      results.created++;
    } else {
      results.failed++;
      results.errors.push(result.error || 'Unknown error');
    }
  }

  results.success = results.failed === 0;
  return results;
}

/**
 * Check if billing event exists for transaction
 * Prevents duplicate event creation
 */
export async function billingEventExists(
  supabase: SupabaseClient,
  transactionReference: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('billing_events')
      .select('id')
      .eq('metadata->>transactionReference', transactionReference)
      .maybeSingle();

    if (error) {
      console.error('[BillingEvent] Error checking existence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[BillingEvent] Exception checking existence:', error);
    return false;
  }
}

/**
 * Update billing event metadata
 * For adding additional information after event creation
 */
export async function updateBillingEventMetadata(
  supabase: SupabaseClient,
  transactionReference: string,
  additionalMetadata: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, get the existing event
    const { data: existingEvent, error: fetchError } = await supabase
      .from('billing_events')
      .select('id, metadata')
      .eq('metadata->>transactionReference', transactionReference)
      .maybeSingle();

    if (fetchError || !existingEvent) {
      return {
        success: false,
        error: fetchError?.message || 'Event not found',
      };
    }

    // Merge metadata
    const updatedMetadata = {
      ...(existingEvent.metadata || {}),
      ...additionalMetadata,
    };

    // Update the event
    const { error: updateError } = await supabase
      .from('billing_events')
      .update({ metadata: updatedMetadata })
      .eq('id', existingEvent.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export default {
  createBillingEvent,
  createBillingEventsBatch,
  billingEventExists,
  updateBillingEventMetadata,
};
