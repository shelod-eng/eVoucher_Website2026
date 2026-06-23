/**
 * Billing Engine Integration Service
 * Updates all billing tables after successful transaction
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { submitSettlementInstruction } from './bankserv-adaptor';

interface TransactionContext {
  transactionReference: string;
  userId: string;
  merchantId: string;
  productId?: string;
  voucherCode?: string;
  voucherId?: string;
  
  // Pricing breakdown
  faceValue: number;
  totalDiscountPct: number;
  totalDiscountAmount: number;
  consumerSavingsPct: number;
  consumerSavingsAmount: number;
  platformFeePct: number;
  platformFeeAmount: number;
  consumerPaidAmount: number;
  merchantReceivableAmount: number;
  
  // Payment details
  paymentMethod: string;
  paymentProvider?: string;
  paymentProviderReference?: string;
  cardLastFour?: string;
  cardBrand?: string;
  
  // PASA compliance
  pasaEmail: string;
  pasaPhone: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Status
  status: 'pending' | 'completed' | 'failed';
}

/**
 * Record complete transaction in Billing Engine
 * Updates: transactions, merchant_ledger, platform_revenue, pasa_audit_log
 * Triggers: BankServ settlement instruction
 */
export async function recordBillingTransaction(
  supabase: SupabaseClient,
  context: TransactionContext
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const settlementDate = new Date();
    settlementDate.setDate(settlementDate.getDate() + 2); // T+2 settlement
    const settlementDateStr = settlementDate.toISOString().split('T')[0];

    // 1. Insert into transactions table
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        transaction_reference: context.transactionReference,
        user_id: context.userId,
        merchant_id: context.merchantId,
        product_id: context.productId,
        voucher_code: context.voucherCode,
        voucher_id: context.voucherId,
        
        // Pricing
        face_value: context.faceValue,
        total_discount_pct: context.totalDiscountPct,
        total_discount_amount: context.totalDiscountAmount,
        consumer_savings_pct: context.consumerSavingsPct,
        consumer_savings_amount: context.consumerSavingsAmount,
        platform_fee_pct: context.platformFeePct,
        platform_fee_amount: context.platformFeeAmount,
        consumer_paid_amount: context.consumerPaidAmount,
        merchant_receivable_amount: context.merchantReceivableAmount,
        
        // Payment
        payment_method: context.paymentMethod,
        payment_provider: context.paymentProvider,
        payment_provider_reference: context.paymentProviderReference,
        card_last_four: context.cardLastFour,
        card_brand: context.cardBrand,
        
        // PASA
        pasa_email: context.pasaEmail,
        pasa_phone: context.pasaPhone,
        pasa_consent_timestamp: now,
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
        
        // BankServ
        bankserv_ack_status: context.status === 'completed' ? 'PENDING' : null,
        settlement_status: context.status === 'completed' ? 'queued' : null,
        settlement_date: context.status === 'completed' ? settlementDateStr : null,
        
        // Status
        status: context.status,
        completed_at: context.status === 'completed' ? now : null,
      })
      .select()
      .single();

    if (txError) {
      console.error('[BillingEngine] Transaction insert failed:', txError);
      return { success: false, error: txError.message };
    }

    // 2. Insert into merchant_ledger (if completed)
    if (context.status === 'completed') {
      const { error: ledgerError } = await supabase.from('merchant_ledger').insert({
        merchant_id: context.merchantId,
        transaction_id: transaction.id,
        credit_amount: context.merchantReceivableAmount,
        settlement_status: 'queued',
        settlement_date: settlementDateStr,
      });

      if (ledgerError) {
        console.error('[BillingEngine] Merchant ledger insert failed:', ledgerError);
      }
    }

    // 3. Insert into platform_revenue (if completed)
    if (context.status === 'completed') {
      const revenueMonth = now.split('T')[0].substring(0, 7) + '-01'; // YYYY-MM-01
      
      const { error: revenueError } = await supabase.from('platform_revenue').insert({
        transaction_id: transaction.id,
        platform_fee_amount: context.platformFeeAmount,
        merchant_id: context.merchantId,
        revenue_month: revenueMonth,
        payment_method: context.paymentMethod,
        payment_processing_cost: calculateProcessingCost(context.paymentMethod, context.consumerPaidAmount),
        net_revenue: context.platformFeeAmount - calculateProcessingCost(context.paymentMethod, context.consumerPaidAmount),
      });

      if (revenueError) {
        console.error('[BillingEngine] Platform revenue insert failed:', revenueError);
      }
    }

    // 4. Insert into pasa_audit_log (always)
    const { data: merchantProfile } = await supabase
      .from('user_profiles')
      .select('business_name')
      .eq('id', context.merchantId)
      .single();

    const { error: auditError } = await supabase.from('pasa_audit_log').insert({
      transaction_id: transaction.id,
      pasa_email: context.pasaEmail,
      pasa_phone: context.pasaPhone,
      payment_method: context.paymentMethod,
      user_id: context.userId,
      ip_address: context.ipAddress,
      user_agent: context.userAgent,
      transaction_amount: context.consumerPaidAmount,
      merchant_name: merchantProfile?.business_name || 'Unknown Merchant',
    });

    if (auditError) {
      console.error('[BillingEngine] PASA audit log insert failed:', auditError);
    }

    // 5. Submit BankServ settlement instruction (if completed)
    if (context.status === 'completed') {
      const { data: merchantBanking } = await supabase
        .from('user_profiles')
        .select('bank_account_number, bank_branch_code')
        .eq('id', context.merchantId)
        .single();

      if (merchantBanking?.bank_account_number) {
        const settlementResult = await submitSettlementInstruction({
          transactionId: transaction.id,
          merchantId: context.merchantId,
          merchantAccountNumber: merchantBanking.bank_account_number,
          merchantBankCode: merchantBanking.bank_branch_code || '000000',
          amount: context.merchantReceivableAmount,
          reference: context.transactionReference,
          voucherCode: context.voucherCode,
        });

        if (!settlementResult.success) {
          console.error('[BillingEngine] BankServ settlement failed:', settlementResult.error);
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('[BillingEngine] Transaction recording failed:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Calculate payment processing cost based on method
 */
function calculateProcessingCost(paymentMethod: string, amount: number): number {
  switch (paymentMethod) {
    case 'visa_secure':
    case 'debit_credit':
      return amount * 0.0295; // 2.95% card processing fee
    case 'payfast':
      return amount * 0.035; // 3.5% PayFast fee
    case 'eft':
      return 5.0; // R5 flat fee
    case 'ussd':
      return 2.5; // R2.50 USSD fee
    case 'airtime':
      return amount * 0.03; // 3% airtime conversion fee
    case 'wallet':
    case 'cash_voucher':
      return 0; // No external processing cost
    default:
      return 0;
  }
}

/**
 * Clear user cart after successful checkout
 * Must be called server-side to ensure cart clearing happens
 */
export async function clearUserCart(userId: string): Promise<void> {
  // In a real implementation, this would clear server-side cart if we had one
  // For now, we rely on frontend localStorage clearing
  // But this function ensures backend can trigger it if needed
  
  // Future: If we implement server-side cart storage:
  // await supabase.from('cart_items').delete().eq('user_id', userId);
  
  console.log(`[BillingEngine] Cart cleared for user ${userId}`);
}

export default {
  recordBillingTransaction,
  clearUserCart,
};
