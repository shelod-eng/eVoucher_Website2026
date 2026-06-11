import { decryptSensitive } from '@/lib/billing/encryption';
import { createHash, randomUUID } from 'crypto';

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

export type BankservPain001Options = {
  messageId?: string;
  paymentInfoId?: string;
  creationDateTime?: string;
  initiatingPartyName?: string;
  initiatingPartyId?: string;
  sponsorAccount?: string;
  sponsorBic?: string;
};

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

function formatAmount(value: number) {
  return Number(value ?? 0).toFixed(2);
}

function formatIsoDateFromActionDate(actionDate: string) {
  const normalized = String(actionDate ?? '').trim();
  if (!/^\d{8}$/.test(normalized)) return new Date().toISOString().slice(0, 10);
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
}

function escapeXml(value: string) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSubmissionHash(xml: string) {
  return createHash('sha256').update(xml).digest('hex');
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

export function renderBankservPain001Document(
  instructions: BankServInstruction[],
  options: BankservPain001Options = {}
) {
  const messageId = String(options.messageId ?? `EVR-${randomUUID()}`).slice(0, 35);
  const paymentInfoId = String(options.paymentInfoId ?? `${messageId}-P1`).slice(0, 35);
  const creationDateTime = options.creationDateTime ?? new Date().toISOString();
  const initiatingPartyName = String(
    options.initiatingPartyName ?? process.env.FNB_SPONSOR_NAME ?? 'eVoucher'
  ).slice(0, 70);
  const initiatingPartyId = String(
    options.initiatingPartyId ?? process.env.FNB_SPONSOR_ID ?? 'EVOUCHER-ZA'
  ).slice(0, 35);
  const sponsorAccount = String(
    options.sponsorAccount ?? process.env.FNB_SPONSOR_ACCOUNT ?? ''
  ).trim();
  const sponsorBic = String(options.sponsorBic ?? process.env.FNB_SPONSOR_BIC ?? 'FIRNZAJJ').trim();
  const controlSum = Number(
    (instructions.reduce((sum, item) => sum + Number(item.amountInCents ?? 0), 0) / 100).toFixed(2)
  );
  const requestedExecutionDate = formatIsoDateFromActionDate(instructions[0]?.actionDate ?? '');

  const paymentRows = instructions
    .map((instruction, index) => {
      const amount = formatAmount(Number(instruction.amountInCents ?? 0) / 100);
      return [
        '      <CdtTrfTxInf>',
        '        <PmtId>',
        `          <EndToEndId>${escapeXml(
            String(instruction.reference || `EVR-${index + 1}`).slice(0, 35)
          )}</EndToEndId>`,
        '        </PmtId>',
        `        <Amt><InstdAmt Ccy="ZAR">${amount}</InstdAmt></Amt>`,
        '        <CdtrAgt>',
        `          <FinInstnId><ClrSysMmbId><MmbId>${escapeXml(
            instruction.destinationBank
          )}</MmbId></ClrSysMmbId></FinInstnId>`,
        '        </CdtrAgt>',
        '        <Cdtr>',
        `          <Nm>${escapeXml(instruction.holderName || instruction.merchantId)}</Nm>`,
        '        </Cdtr>',
        '        <CdtrAcct>',
        `          <Id><Othr><Id>${escapeXml(instruction.destinationAccount)}</Id></Othr></Id>`,
        `          <Tp><Prtry>${escapeXml(instruction.destinationAccountType)}</Prtry></Tp>`,
        '        </CdtrAcct>',
        '        <RmtInf>',
        `          <Ustrd>${escapeXml(instruction.reference)}</Ustrd>`,
        '        </RmtInf>',
        '      </CdtTrfTxInf>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">',
    '  <CstmrCdtTrfInitn>',
    '    <GrpHdr>',
    `      <MsgId>${escapeXml(messageId)}</MsgId>`,
    `      <CreDtTm>${escapeXml(creationDateTime)}</CreDtTm>`,
    `      <NbOfTxs>${instructions.length}</NbOfTxs>`,
    `      <CtrlSum>${formatAmount(controlSum)}</CtrlSum>`,
    '      <InitgPty>',
    `        <Nm>${escapeXml(initiatingPartyName)}</Nm>`,
    '        <Id><OrgId><Othr>',
    `          <Id>${escapeXml(initiatingPartyId)}</Id>`,
    '        </Othr></OrgId></Id>',
    '      </InitgPty>',
    '    </GrpHdr>',
    '    <PmtInf>',
    `      <PmtInfId>${escapeXml(paymentInfoId)}</PmtInfId>`,
    '      <PmtMtd>TRF</PmtMtd>',
    '      <BtchBookg>true</BtchBookg>',
    `      <NbOfTxs>${instructions.length}</NbOfTxs>`,
    `      <CtrlSum>${formatAmount(controlSum)}</CtrlSum>`,
    '      <PmtTpInf><SvcLvl><Cd>NURG</Cd></SvcLvl></PmtTpInf>',
    `      <ReqdExctnDt>${requestedExecutionDate}</ReqdExctnDt>`,
    '      <Dbtr>',
    `        <Nm>${escapeXml(initiatingPartyName)}</Nm>`,
    '      </Dbtr>',
    sponsorAccount
      ? `      <DbtrAcct><Id><Othr><Id>${escapeXml(sponsorAccount)}</Id></Othr></Id></DbtrAcct>`
      : '      <DbtrAcct><Id><Othr><Id>UNKNOWN</Id></Othr></Id></DbtrAcct>',
    '      <DbtrAgt>',
    `        <FinInstnId><BIC>${escapeXml(sponsorBic)}</BIC></FinInstnId>`,
    '      </DbtrAgt>',
    '      <ChrgBr>SLEV</ChrgBr>',
    paymentRows,
    '    </PmtInf>',
    '  </CstmrCdtTrfInitn>',
    '</Document>',
  ].join('\n');

  return {
    messageId,
    paymentInfoId,
    creationDateTime,
    transactionCount: instructions.length,
    controlSum,
    submissionHash: buildSubmissionHash(xml),
    xml,
  };
}

