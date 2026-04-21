import { decryptSensitive } from '@/lib/billing/encryption';

export interface BankServInstruction {
  settlementId: string;
  invoiceId: string;
  merchantId: string;
  transactionCode: '40';
  actionDate: string; // YYYYMMDD
  reference: string; // max 20
  amountInCents: number;
  sourceBank: '250655';
  sourceBranch: '250655';
  destinationBank: string; // SA bank branch code
  destinationAccount: string; // decrypted server-side only
  destinationAccountType: '1' | '2'; // 1=cheque/current, 2=savings
  holderName: string; // max 30
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatYYYYMMDD(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function isWeekend(date: Date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function addBusinessDays(date: Date, days: number) {
  const out = new Date(date);
  let remaining = Math.max(0, days);
  while (remaining > 0) {
    out.setDate(out.getDate() + 1);
    if (!isWeekend(out)) remaining -= 1;
  }
  return out;
}

function mapAccountTypeToBankServ(type: string): '1' | '2' {
  const t = String(type ?? '').toLowerCase();
  if (t.includes('savings')) return '2';
  return '1';
}

export type BankServFormatInput = {
  settlementId: string;
  settlementReference: string;
  amount: number;
  invoiceId: string;
  invoiceNumber: string;
  merchantId: string;
  linkage: {
    branchCode: string;
    accountType: string;
    accountHolderName: string;
    accountNumberEnc: string;
  };
};

/**
 * Formats a set of per-invoice settlements into BankServ EFT Credit instructions.
 * - transactionCode: 40 (credit transfer)
 * - actionDate: T+0 for FNB→FNB (branchCode=250655), else T+1 business day
 * - reference: max 20 chars; uses settlement_reference as-is
 */
export function formatBankServBatch(rows: BankServFormatInput[]): BankServInstruction[] {
  return rows.map((row) => {
    const destBranch = String(row.linkage.branchCode ?? '').trim() || '250655';
    const isFnbToFnb = destBranch === '250655';
    const actionDate = isFnbToFnb ? formatYYYYMMDD(new Date()) : formatYYYYMMDD(addBusinessDays(new Date(), 1));

    const reference = String(row.settlementReference ?? '').trim().slice(0, 20);
    const destinationAccount = decryptSensitive(String(row.linkage.accountNumberEnc));
    const holderName = String(row.linkage.accountHolderName ?? '').trim().slice(0, 30);

    return {
      settlementId: row.settlementId,
      invoiceId: row.invoiceId,
      merchantId: row.merchantId,
      transactionCode: '40',
      actionDate,
      reference,
      amountInCents: Math.round(Number(row.amount) * 100),
      sourceBank: '250655',
      sourceBranch: '250655',
      destinationBank: destBranch,
      destinationAccount,
      destinationAccountType: mapAccountTypeToBankServ(row.linkage.accountType),
      holderName,
    };
  });
}

/**
 * Serialises instructions to a BankServ flat-file like the TRD example:
 * [transactionCode][actionDate][destinationBank][destinationAccount][destinationAccountType]
 * [amountInCents(11,0-padded)][holderName(30,padded)][reference(20,padded)][sourceBank][sourceBranch]
 */
export function serialiseBatchToFlatFile(instructions: BankServInstruction[]): string {
  return instructions
    .map((i) => {
      const amount = String(i.amountInCents).padStart(11, '0');
      const holder = String(i.holderName).slice(0, 30).padEnd(30, ' ');
      const ref = String(i.reference).slice(0, 20).padEnd(20, ' ');
      return [
        i.transactionCode,
        i.actionDate,
        i.destinationBank,
        i.destinationAccount,
        i.destinationAccountType,
        amount,
        holder,
        ref,
        i.sourceBank,
        i.sourceBranch,
      ].join('');
    })
    .join('\n');
}

