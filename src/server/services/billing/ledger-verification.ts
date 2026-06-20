import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateRevenue, type RevenueBreakdown } from '@/lib/billing/revenue-calculator';

export type LedgerVerificationInput = {
  faceValue: number;
  merchantPayout?: number | null;
  consumerBenefit?: number | null;
  platformRevenue?: number | null;
  bankFee?: number | null;
  tolerance?: number;
};

export type LedgerVerificationResult = {
  expected: RevenueBreakdown;
  actual: {
    merchantPayout: number;
    consumerBenefit: number;
    platformRevenue: number;
    bankFee: number;
  };
  discrepancies: {
    merchantPayout: number;
    consumerBenefit: number;
    platformRevenue: number;
    bankFee: number;
  };
  passed: boolean;
};

function round2(value: number) {
  return Number(value.toFixed(2));
}

function safeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function diff(actual: number, expected: number) {
  return round2(actual - expected);
}

export function verifyLedgerSplit(input: LedgerVerificationInput): LedgerVerificationResult {
  const expected = calculateRevenue(input.faceValue);
  const actual = {
    merchantPayout: round2(safeNumber(input.merchantPayout ?? expected.merchantGrossPayout)),
    consumerBenefit: round2(safeNumber(input.consumerBenefit ?? expected.consumerBenefit)),
    platformRevenue: round2(safeNumber(input.platformRevenue ?? expected.platformRevenue)),
    bankFee: round2(safeNumber(input.bankFee ?? expected.bankFee)),
  };
  const discrepancies = {
    merchantPayout: diff(actual.merchantPayout, expected.merchantGrossPayout),
    consumerBenefit: diff(actual.consumerBenefit, expected.consumerBenefit),
    platformRevenue: diff(actual.platformRevenue, expected.platformRevenue),
    bankFee: diff(actual.bankFee, expected.bankFee),
  };
  const tolerance = Math.max(0, safeNumber(input.tolerance ?? 0.01));
  const passed = Object.values(discrepancies).every((amount) => Math.abs(amount) <= tolerance);

  return { expected, actual, discrepancies, passed };
}

export async function recordLedgerVerificationCheck(
  admin: SupabaseClient,
  input: LedgerVerificationInput & {
    checkType?: string;
    checkedBy?: string | null;
    notes?: string | null;
  }
) {
  const result = verifyLedgerSplit(input);
  const largestDiscrepancy = Math.max(
    ...Object.values(result.discrepancies).map((amount) => Math.abs(amount))
  );

  const { data, error } = await admin
    .from('ledger_verification_checks')
    .insert({
      check_type: input.checkType ?? 'total_reconciliation',
      voucher_face_value: result.expected.faceValue,
      expected_merchant_payout: result.expected.merchantGrossPayout,
      expected_consumer_benefit: result.expected.consumerBenefit,
      expected_platform_revenue: result.expected.platformRevenue,
      expected_bank_fee: result.expected.bankFee,
      actual_merchant_payout: result.actual.merchantPayout,
      actual_consumer_benefit: result.actual.consumerBenefit,
      actual_platform_revenue: result.actual.platformRevenue,
      actual_bank_fee: result.actual.bankFee,
      discrepancy_amount: round2(largestDiscrepancy),
      status: result.passed ? 'passed' : 'failed',
      notes: input.notes ?? null,
      checked_by: input.checkedBy ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return { record: data, result };
}
