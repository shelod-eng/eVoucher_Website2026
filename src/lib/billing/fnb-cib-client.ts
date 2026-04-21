import { randomUUID } from 'crypto';
import type { BankServInstruction } from '@/lib/billing/bankserv-formatter';

export interface FNBSubmitResponse {
  batchId: string;
  status: 'ACCEPTED' | 'REJECTED';
  acceptedCount: number;
  rejectedItems: Array<{ reference: string; reason: string }>;
}

function isRealMode() {
  const mode = String(process.env.BILLING_BANKSERV_MODE ?? 'mock').trim().toLowerCase();
  return mode === 'real';
}

export async function submitBankServBatch(instructions: BankServInstruction[]): Promise<FNBSubmitResponse> {
  if (!isRealMode()) {
    return {
      batchId: `MOCK-${randomUUID()}`,
      status: 'ACCEPTED',
      acceptedCount: instructions.length,
      rejectedItems: [],
    };
  }

  const base = String(process.env.FNB_CIB_API_URL ?? '').trim();
  const apiKey = String(process.env.FNB_CIB_API_KEY ?? '').trim();
  const clientId = String(process.env.FNB_CIB_CLIENT_ID ?? '').trim();
  const sponsorAccount = String(process.env.FNB_SPONSOR_ACCOUNT ?? '').trim();

  if (!base || !apiKey || !clientId || !sponsorAccount) {
    throw new Error('Missing FNB CIB env vars (FNB_CIB_API_URL, FNB_CIB_API_KEY, FNB_CIB_CLIENT_ID, FNB_SPONSOR_ACCOUNT).');
  }

  const response = await fetch(`${base.replace(/\/$/, '')}/eft/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-FNB-Client-Id': clientId,
      'X-Request-Id': `EVS-${Date.now()}`,
    },
    body: JSON.stringify({
      sponsorAccountNumber: sponsorAccount,
      sponsorBranchCode: '250655',
      transactions: instructions.map((i) => ({
        transactionCode: i.transactionCode,
        actionDate: i.actionDate,
        reference: i.reference,
        amountInCents: i.amountInCents,
        destinationBankCode: i.destinationBank,
        destinationAccountNumber: i.destinationAccount,
        destinationAccountType: i.destinationAccountType,
        beneficiaryName: i.holderName,
      })),
    }),
  });

  if (!response.ok) {
    let body: any = null;
    try {
      body = await response.json();
    } catch {
      // ignore
    }
    throw new Error(`FNB CIB API error ${response.status}: ${body ? JSON.stringify(body) : 'unknown'}`);
  }

  return (await response.json()) as FNBSubmitResponse;
}
