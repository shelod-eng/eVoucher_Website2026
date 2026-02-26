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

type MerchantVerificationEmailPayload = {
  businessName: string;
  email: string;
  verificationUrl: string;
  emailToken: string;
};

type MerchantOtpPayload = {
  businessName: string;
  phone: string;
  otpCode: string;
};

type MerchantCredentialsPayload = {
  businessName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
};

type MerchantEmailDispatchResult = {
  sent: boolean;
  provider: 'resend' | 'console';
  error?: string;
  recipient: string;
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

  const fromAddress = String(process.env.RESEND_FROM ?? 'eVoucher Onboarding <onboarding@resend.dev>').trim();
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

function resolveAppBaseUrl() {
  return (
    String(process.env.NEXT_PUBLIC_APP_URL ?? '').trim() ||
    String(process.env.APP_URL ?? '').trim() ||
    'http://localhost:4028'
  );
}

function resolveMerchantEmailRecipient(targetEmail: string) {
  const configuredOverride = String(
    process.env.MERCHANT_EMAIL_TEST_RECIPIENT ?? 'shelod@gmail.com'
  )
    .trim()
    .toLowerCase();
  const forceOverride = String(process.env.MERCHANT_EMAIL_FORCE_TEST_RECIPIENT ?? 'true')
    .trim()
    .toLowerCase() !== 'false';
  if (forceOverride && configuredOverride) {
    return configuredOverride;
  }
  return String(targetEmail ?? '').trim().toLowerCase();
}

async function sendEmailToMerchant(
  email: string,
  subject: string,
  text: string,
  html: string
): Promise<MerchantEmailDispatchResult> {
  const recipient = resolveMerchantEmailRecipient(email);
  try {
    const resendSent = await sendViaResend([recipient], subject, text, html);
    if (resendSent) {
      return { sent: true, provider: 'resend', recipient };
    }

    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return {
        sent: false,
        provider: 'resend',
        recipient,
        error: 'RESEND_API_KEY is not configured in production.',
      };
    }

    console.info('[merchant-email][dev]', { intendedEmail: email, recipient, subject, text });
    return { sent: true, provider: 'console', recipient };
  } catch (error: any) {
    return {
      sent: false,
      provider: 'resend',
      recipient,
      error: error?.message || 'Failed to send merchant email.',
    };
  }
}

async function sendSmsViaTwilio(phone: string, message: string) {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID ?? '').trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN ?? '').trim();
  const fromNumber = String(process.env.TWILIO_FROM_PHONE ?? '').trim();
  if (!accountSid || !authToken || !fromNumber) return null;

  const body = new URLSearchParams({
    To: phone,
    From: fromNumber,
    Body: message,
  });

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Twilio SMS failed (${response.status}): ${responseText}`);
  }
  return true;
}

export async function sendMerchantVerificationEmail(payload: MerchantVerificationEmailPayload) {
  const subject = `Confirm your eVoucher merchant registration - ${payload.businessName}`;
  const text = [
    `Hi,`,
    ``,
    `Welcome to eVoucher Merchant Onboarding for ${payload.businessName}.`,
    `Please confirm your email address by opening this secure link:`,
    payload.verificationUrl,
    ``,
    `If needed, your confirmation token is: ${payload.emailToken}`,
    ``,
    `If you did not request this registration, ignore this email.`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin-bottom:12px;">Confirm your eVoucher merchant registration</h2>
      <p>Welcome to onboarding for <strong>${payload.businessName}</strong>.</p>
      <p style="margin-bottom:16px;">Click the button below to confirm your email address.</p>
      <p>
        <a href="${payload.verificationUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">
          Confirm Email
        </a>
      </p>
      <p style="margin-top:16px;">Token (manual fallback): <strong>${payload.emailToken}</strong></p>
      <p style="color:#64748b;">If you did not request this registration, ignore this email.</p>
    </div>
  `.trim();

  return sendEmailToMerchant(payload.email, subject, text, html);
}

export async function sendMerchantOtpSms(payload: MerchantOtpPayload) {
  const message = `eVoucher OTP for ${payload.businessName}: ${payload.otpCode}. This code expires in 10 minutes.`;
  try {
    const twilioSent = await sendSmsViaTwilio(payload.phone, message);
    if (twilioSent) {
      return { sent: true, provider: 'twilio' as const };
    }

    console.info('[merchant-otp][dev]', { phone: payload.phone, message });
    return { sent: true, provider: 'console' as const };
  } catch (error: any) {
    return {
      sent: false,
      provider: 'twilio' as const,
      error: error?.message || 'Failed to send merchant OTP SMS.',
    };
  }
}

export async function sendMerchantCredentialsEmail(payload: MerchantCredentialsPayload) {
  const subject = `Your eVoucher merchant account is approved - ${payload.businessName}`;
  const text = [
    `Hi,`,
    ``,
    `Your merchant account for ${payload.businessName} has been approved.`,
    `Login email: ${payload.email}`,
    `Temporary password: ${payload.temporaryPassword}`,
    `Merchant login: ${payload.loginUrl}`,
    ``,
    `For security, you must change this password on first login.`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin-bottom:12px;">Merchant account approved</h2>
      <p>Your merchant account for <strong>${payload.businessName}</strong> is now approved.</p>
      <div style="border:1px solid #dbe3ec;border-radius:10px;padding:14px;margin:14px 0;background:#f8fafc;">
        <p style="margin:0 0 8px;"><strong>Login email:</strong> ${payload.email}</p>
        <p style="margin:0 0 8px;"><strong>Temporary password:</strong> ${payload.temporaryPassword}</p>
        <p style="margin:0;"><strong>Merchant login:</strong> <a href="${payload.loginUrl}">${payload.loginUrl}</a></p>
      </div>
      <p style="color:#b45309;"><strong>Action required:</strong> You must change your password at first login.</p>
    </div>
  `.trim();

  return sendEmailToMerchant(payload.email, subject, text, html);
}

export function getMerchantLoginUrl() {
  return `${resolveAppBaseUrl().replace(/\/+$/, '')}/merchant/login`;
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
