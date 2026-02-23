const DEFAULT_DEV_RECIPIENTS = ['info@evoucher.co.za', 'evoucher_phase1@outlook.com'];

type MerchantStatusPayload = {
  merchantId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  physicalAddress?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  status: string;
  approvedAt?: string | null;
};

type NotificationResult = {
  sent: boolean;
  provider: 'resend' | 'console' | 'none';
  recipients: string[];
  error?: string;
};

function resolveRecipients() {
  const configured = String(process.env.MERCHANT_NOTIFICATION_RECIPIENTS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_DEV_RECIPIENTS;
}

function resolveMaskedAccountNumber(accountNumber?: string | null) {
  const value = String(accountNumber ?? '').trim();
  if (!value) return 'Not provided';
  if (value.length <= 4) return value;
  return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

function buildTextBody(payload: MerchantStatusPayload) {
  return [
    'eVoucher Merchant Workflow Notification (DEV)',
    '',
    `Merchant ID: ${payload.merchantId}`,
    `Status: ${payload.status}`,
    `Approved At: ${payload.approvedAt ?? 'N/A'}`,
    '',
    'Merchant Details',
    `Business Name: ${payload.businessName}`,
    `Contact Name: ${payload.contactName}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Business Type: ${payload.businessType || 'Not provided'}`,
    `Registration Number: ${payload.registrationNumber || 'Not provided'}`,
    `Tax Number: ${payload.taxNumber || 'Not provided'}`,
    `Physical Address: ${payload.physicalAddress || 'Not provided'}`,
    `Bank Name: ${payload.bankName || 'Not provided'}`,
    `Account Number: ${resolveMaskedAccountNumber(payload.accountNumber)}`,
    '',
    'This notification is generated from the local development merchant onboarding flow.',
  ].join('\n');
}

function buildHtmlBody(payload: MerchantStatusPayload) {
  const rows = [
    ['Merchant ID', payload.merchantId],
    ['Status', payload.status],
    ['Approved At', payload.approvedAt ?? 'N/A'],
    ['Business Name', payload.businessName],
    ['Contact Name', payload.contactName],
    ['Email', payload.email],
    ['Phone', payload.phone],
    ['Business Type', payload.businessType || 'Not provided'],
    ['Registration Number', payload.registrationNumber || 'Not provided'],
    ['Tax Number', payload.taxNumber || 'Not provided'],
    ['Physical Address', payload.physicalAddress || 'Not provided'],
    ['Bank Name', payload.bankName || 'Not provided'],
    ['Account Number', resolveMaskedAccountNumber(payload.accountNumber)],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #dbe3ec;font-weight:600;">${label}</td><td style="padding:8px 12px;border:1px solid #dbe3ec;">${value}</td></tr>`
    )
    .join('');

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0f172a;">
      <h2 style="margin-bottom:8px;">eVoucher Merchant Workflow Notification (DEV)</h2>
      <p style="margin-top:0;">A merchant onboarding status update was triggered in development.</p>
      <table style="border-collapse:collapse;width:100%;max-width:720px;">${tableRows}</table>
    </div>
  `.trim();
}

async function sendViaResend(
  recipients: string[],
  subject: string,
  text: string,
  html: string
) {
  const resendApiKey = String(process.env.RESEND_API_KEY ?? '').trim();
  if (!resendApiKey) return null;

  const fromAddress = String(process.env.RESEND_FROM ?? 'eVoucher Dev <onboarding@evoucher.co.za>').trim();
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: recipients,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${body}`);
  }

  return true;
}

export async function sendMerchantStatusNotifications(
  payload: MerchantStatusPayload
): Promise<NotificationResult> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const forceNotify = String(process.env.MERCHANT_NOTIFY_ALWAYS ?? '').toLowerCase() === 'true';
  if (!isDevelopment && !forceNotify) {
    return { sent: false, provider: 'none', recipients: [] };
  }

  const recipients = resolveRecipients();
  const subject = `[eVoucher][DEV] Merchant ${payload.status.toUpperCase()} - ${payload.businessName}`;
  const text = buildTextBody(payload);
  const html = buildHtmlBody(payload);

  try {
    const resendSent = await sendViaResend(recipients, subject, text, html);
    if (resendSent) {
      return { sent: true, provider: 'resend', recipients };
    }

    // Fallback for local development when email provider keys are not configured.
    console.info('[merchant-notify][dev]', { recipients, subject, details: payload });
    return { sent: true, provider: 'console', recipients };
  } catch (error: any) {
    console.error('[merchant-notify][error]', error);
    return {
      sent: false,
      provider: 'resend',
      recipients,
      error: error?.message || 'Failed to send merchant notification.',
    };
  }
}
