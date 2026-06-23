/**
 * BankServ Adaptor Service
 * Handles ACH/NAEDO settlement format, ACK/NCK responses, and batch processing
 * Integrates with BankServ Africa for merchant payouts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// BankServ configuration
const BANKSERV_CONFIG = {
  originatorBankCode: '250655', // FNB
  originatorAccountNumber: '62834910251', // eVoucher operational account
  originatorAccountName: 'eVoucher Platform',
  serviceType: 'NAEDO', // Non-Authenticated Early Debit Order
  settlementDays: 2, // T+2 settlement
};

interface SettlementInstruction {
  transactionId: string;
  merchantId: string;
  merchantAccountNumber: string;
  merchantBankCode: string;
  amount: number;
  reference: string;
  voucherCode?: string;
}

interface BankServACKResponse {
  reference: string;
  status: 'ACK' | 'NCK';
  code?: string;
  message?: string;
  timestamp: string;
}

/**
 * Format amount for BankServ (cents, no decimal)
 */
function formatBankServAmount(amount: number): string {
  return Math.round(amount * 100).toString().padStart(11, '0');
}

/**
 * Format date for BankServ (YYYYMMDD)
 */
function formatBankServDate(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * Generate settlement batch reference
 */
function generateBatchReference(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EVOUCHER-${date}-${random}`;
}

/**
 * Submit single settlement instruction to BankServ
 * Called immediately after successful transaction
 */
export async function submitSettlementInstruction(
  instruction: SettlementInstruction
): Promise<{ success: boolean; bankservReference: string; error?: string }> {
  try {
    // 1. Validate merchant banking details exist
    const { data: merchantProfile, error: merchantError } = await supabase
      .from('user_profiles')
      .select('bank_account_number, bank_name, bank_branch_code')
      .eq('id', instruction.merchantId)
      .single();

    if (merchantError || !merchantProfile?.bank_account_number) {
      throw new Error('Merchant banking details not configured');
    }

    // 2. Generate BankServ reference
    const bankservReference = `EV${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 3. Format settlement instruction (ACH NAEDO format)
    const settlementDate = new Date();
    settlementDate.setDate(settlementDate.getDate() + BANKSERV_CONFIG.settlementDays);

    const achRecord = {
      recordType: '1', // Credit transaction
      bankCode: instruction.merchantBankCode || merchantProfile.bank_branch_code,
      accountNumber: instruction.merchantAccountNumber || merchantProfile.bank_account_number,
      amount: formatBankServAmount(instruction.amount),
      reference: instruction.reference.substring(0, 20),
      beneficiaryName: (merchantProfile as any).business_name?.substring(0, 30) || 'MERCHANT',
      settlementDate: formatBankServDate(settlementDate),
      originatorBankCode: BANKSERV_CONFIG.originatorBankCode,
      originatorAccountNumber: BANKSERV_CONFIG.originatorAccountNumber,
    };

    // 4. In production: Submit to BankServ API
    // For now: Simulate submission with immediate ACK
    const bankservResponse = await simulateBankServSubmission(achRecord, bankservReference);

    // 5. Update transaction with BankServ reference
    await supabase
      .from('transactions')
      .update({
        bankserv_reference: bankservReference,
        bankserv_ack_status: bankservResponse.status,
        bankserv_ack_timestamp: new Date().toISOString(),
        settlement_date: settlementDate.toISOString().split('T')[0],
      })
      .eq('id', instruction.transactionId);

    // 6. Log BankServ response
    await supabase.from('bankserv_responses').insert({
      transaction_id: instruction.transactionId,
      bankserv_reference: bankservReference,
      response_type: bankservResponse.status,
      response_code: bankservResponse.code,
      response_message: bankservResponse.message,
      raw_response: achRecord,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    return {
      success: bankservResponse.status === 'ACK',
      bankservReference,
      error: bankservResponse.status === 'NCK' ? bankservResponse.message : undefined,
    };
  } catch (error: any) {
    console.error('[BankServ] Settlement instruction failed:', error);
    return {
      success: false,
      bankservReference: '',
      error: error.message || 'Failed to submit settlement instruction',
    };
  }
}

/**
 * Create daily settlement batch for merchant payouts
 * Aggregates all completed transactions ready for settlement
 */
export async function createSettlementBatch(): Promise<{
  success: boolean;
  batchId?: string;
  batchReference?: string;
  error?: string;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Query all transactions ready for settlement
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select(
        `
        id,
        merchant_id,
        merchant_receivable_amount,
        voucher_code,
        bankserv_reference,
        user_profiles!merchant_id (
          id,
          business_name,
          bank_account_number,
          bank_branch_code,
          bank_name
        )
      `
      )
      .eq('status', 'completed')
      .eq('bankserv_ack_status', 'ACK')
      .eq('settlement_status', 'queued')
      .lte('settlement_date', today);

    if (txError) throw txError;
    if (!transactions || transactions.length === 0) {
      return { success: false, error: 'No transactions ready for settlement' };
    }

    // 2. Aggregate by merchant
    const merchantPayouts = new Map<string, any>();
    transactions.forEach((tx: any) => {
      const merchantId = tx.merchant_id;
      if (!merchantPayouts.has(merchantId)) {
        merchantPayouts.set(merchantId, {
          merchantId,
          merchantProfile: tx.user_profiles,
          totalAmount: 0,
          transactionCount: 0,
          voucherCodes: [],
          transactionIds: [],
        });
      }
      const payout = merchantPayouts.get(merchantId);
      payout.totalAmount += Number(tx.merchant_receivable_amount);
      payout.transactionCount += 1;
      payout.voucherCodes.push(tx.voucher_code);
      payout.transactionIds.push(tx.id);
    });

    // 3. Create settlement batch record
    const batchReference = generateBatchReference();
    const totalAmount = Array.from(merchantPayouts.values()).reduce(
      (sum, p) => sum + p.totalAmount,
      0
    );

    const { data: batch, error: batchError } = await supabase
      .from('settlement_batches')
      .insert({
        batch_reference: batchReference,
        settlement_date: today,
        total_amount: totalAmount,
        transaction_count: transactions.length,
        merchant_count: merchantPayouts.size,
        status: 'ready',
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // 4. Create batch items for each merchant
    const batchItems = Array.from(merchantPayouts.values()).map((payout) => ({
      batch_id: batch.id,
      merchant_id: payout.merchantId,
      merchant_account_number: payout.merchantProfile.bank_account_number,
      merchant_bank_code: payout.merchantProfile.bank_branch_code,
      payout_amount: payout.totalAmount,
      transaction_count: payout.transactionCount,
      payout_reference: `${batchReference}-${payout.merchantId.substring(0, 8)}`,
      voucher_codes: payout.voucherCodes,
      status: 'queued',
    }));

    await supabase.from('settlement_batch_items').insert(batchItems);

    // 5. Update merchant ledger
    const ledgerEntries = Array.from(merchantPayouts.values()).flatMap((payout) =>
      payout.transactionIds.map((txId: string) => ({
        merchant_id: payout.merchantId,
        transaction_id: txId,
        credit_amount: payout.totalAmount / payout.transactionCount,
        settlement_status: 'processing',
        settlement_date: today,
        settlement_batch_id: batch.id,
      }))
    );

    await supabase.from('merchant_ledger').upsert(ledgerEntries, {
      onConflict: 'transaction_id',
    });

    // 6. Update transaction settlement status
    await supabase
      .from('transactions')
      .update({
        settlement_status: 'processing',
        settlement_batch_id: batch.id,
      })
      .in(
        'id',
        transactions.map((tx: any) => tx.id)
      );

    return {
      success: true,
      batchId: batch.id,
      batchReference: batch.batch_reference,
    };
  } catch (error: any) {
    console.error('[BankServ] Batch creation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create settlement batch',
    };
  }
}

/**
 * Generate BankServ ACH/NAEDO batch file
 * Format: Standard ACH file with header, transactions, trailer
 */
export async function generateBankServBatchFile(
  batchId: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // 1. Fetch batch and items
    const { data: batch, error: batchError } = await supabase
      .from('settlement_batches')
      .select(
        `
        *,
        settlement_batch_items (
          *,
          user_profiles!merchant_id (
            business_name,
            bank_account_number,
            bank_branch_code
          )
        )
      `
      )
      .eq('id', batchId)
      .single();

    if (batchError) throw batchError;

    // 2. Generate ACH file content
    const lines: string[] = [];

    // Header record
    lines.push(
      [
        '0', // Record type
        BANKSERV_CONFIG.originatorBankCode,
        BANKSERV_CONFIG.originatorAccountNumber,
        formatBankServDate(new Date(batch.settlement_date)),
        batch.batch_reference,
        'EVOUCHER',
      ].join('|')
    );

    // Transaction records
    batch.settlement_batch_items.forEach((item: any, index: number) => {
      lines.push(
        [
          '1', // Record type (credit)
          item.merchant_bank_code,
          item.merchant_account_number,
          formatBankServAmount(item.payout_amount),
          item.payout_reference,
          item.user_profiles.business_name?.substring(0, 30) || 'MERCHANT',
          (index + 1).toString().padStart(6, '0'),
        ].join('|')
      );
    });

    // Trailer record
    lines.push(
      [
        '9', // Record type
        batch.transaction_count.toString().padStart(8, '0'),
        formatBankServAmount(batch.total_amount),
        batch.batch_reference,
      ].join('|')
    );

    const fileContent = lines.join('\n');
    const fileName = `bankserv_${batch.batch_reference}_${Date.now()}.ach`;
    const filePath = `/tmp/${fileName}`; // In production: Upload to S3/storage

    // 3. In production: Write to file system or upload to storage
    // For now: Return file content as base64
    const fileBase64 = Buffer.from(fileContent).toString('base64');

    // 4. Update batch with file reference
    await supabase
      .from('settlement_batches')
      .update({
        bankserv_file_path: filePath,
        status: 'processing',
      })
      .eq('id', batchId);

    return {
      success: true,
      filePath: fileBase64, // In demo: return content, in prod: return S3 URL
    };
  } catch (error: any) {
    console.error('[BankServ] Batch file generation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate batch file',
    };
  }
}

/**
 * Process BankServ ACK/NCK response
 * Called by webhook when BankServ responds to submission
 */
export async function processBankServResponse(response: BankServACKResponse): Promise<void> {
  try {
    // 1. Find transaction by BankServ reference
    const { data: transaction } = await supabase
      .from('transactions')
      .select('id, settlement_batch_id')
      .eq('bankserv_reference', response.reference)
      .single();

    if (!transaction) {
      console.error('[BankServ] Transaction not found for reference:', response.reference);
      return;
    }

    // 2. Update transaction status
    await supabase
      .from('transactions')
      .update({
        bankserv_ack_status: response.status,
        bankserv_ack_timestamp: response.timestamp,
        bankserv_nck_reason: response.status === 'NCK' ? response.message : null,
      })
      .eq('id', transaction.id);

    // 3. Log response
    await supabase.from('bankserv_responses').insert({
      transaction_id: transaction.id,
      batch_id: transaction.settlement_batch_id,
      bankserv_reference: response.reference,
      response_type: response.status,
      response_code: response.code,
      response_message: response.message,
      raw_response: response,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    // 4. Handle NCK (retry logic)
    if (response.status === 'NCK') {
      await supabase
        .from('transactions')
        .update({
          settlement_status: 'failed',
        })
        .eq('id', transaction.id);

      // TODO: Implement retry logic or manual review queue
      console.error('[BankServ] NCK received:', response.message);
    }
  } catch (error: any) {
    console.error('[BankServ] Response processing failed:', error);
  }
}

/**
 * Simulate BankServ submission for demo/testing
 * In production: Replace with actual BankServ API integration
 */
async function simulateBankServSubmission(
  achRecord: any,
  reference: string
): Promise<BankServACKResponse> {
  // Simulate 95% success rate
  const isSuccess = Math.random() > 0.05;

  return {
    reference,
    status: isSuccess ? 'ACK' : 'NCK',
    code: isSuccess ? '000' : 'E01',
    message: isSuccess ? 'Settlement instruction accepted' : 'Invalid account number',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get settlement summary for merchant dashboard
 */
export async function getMerchantSettlementSummary(merchantId: string): Promise<{
  pendingAmount: number;
  processingAmount: number;
  paidAmount: number;
  nextSettlementDate: string | null;
}> {
  const { data: ledger } = await supabase
    .from('merchant_ledger')
    .select('credit_amount, settlement_status, settlement_date')
    .eq('merchant_id', merchantId);

  if (!ledger) {
    return {
      pendingAmount: 0,
      processingAmount: 0,
      paidAmount: 0,
      nextSettlementDate: null,
    };
  }

  const summary = ledger.reduce(
    (acc, entry) => {
      if (entry.settlement_status === 'queued') acc.pendingAmount += Number(entry.credit_amount);
      if (entry.settlement_status === 'processing')
        acc.processingAmount += Number(entry.credit_amount);
      if (entry.settlement_status === 'paid') acc.paidAmount += Number(entry.credit_amount);
      return acc;
    },
    { pendingAmount: 0, processingAmount: 0, paidAmount: 0 }
  );

  // Get next settlement date
  const { data: nextBatch } = await supabase
    .from('settlement_batches')
    .select('settlement_date')
    .eq('status', 'ready')
    .order('settlement_date', { ascending: true })
    .limit(1)
    .single();

  return {
    ...summary,
    nextSettlementDate: nextBatch?.settlement_date || null,
  };
}

export default {
  submitSettlementInstruction,
  createSettlementBatch,
  generateBankServBatchFile,
  processBankServResponse,
  getMerchantSettlementSummary,
};
