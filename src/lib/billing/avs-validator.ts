export type AVSStatus = 'verified' | 'failed' | 'mismatched' | 'pending';

export interface AVSRequest {
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountHolderName: string;
}

export interface AVSResult {
  status: AVSStatus;
  matchCode: string;
  notes: string;
  verifiedAt: string;
}

/**
 * P0 placeholder:
 * - In production, implement FNB CIB AVS call (mutual TLS + API key).
 * - In staging/dev, use deterministic mock.
 */
export async function validateAccountAVS(req: AVSRequest): Promise<AVSResult> {
  const mockMode = String(process.env.BILLING_AVS_MODE ?? 'mock')
    .trim()
    .toLowerCase();
  if (mockMode !== 'real') {
    const normalized = `${req.bankName}|${req.branchCode}|${req.accountHolderName}`.toLowerCase();
    const isVerified = !normalized.includes('mismatch') && !normalized.includes('fail');
    return {
      status: isVerified ? 'verified' : 'mismatched',
      matchCode: isVerified ? 'MATCH_FULL' : 'NAME_MISMATCH',
      notes: isVerified ? 'Mock AVS full match confirmed' : 'Mock AVS mismatch',
      verifiedAt: new Date().toISOString(),
    };
  }

  throw new Error('AVS real mode is not implemented yet.');
}
