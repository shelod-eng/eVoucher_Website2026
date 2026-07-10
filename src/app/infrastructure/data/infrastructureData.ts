import type { LucideIcon } from 'lucide-react';
import {
  Globe,
  Shield,
  Receipt,
  Database,
  Smartphone,
  CreditCard,
  Server,
  Bell,
  Layers,
  Clock,
} from 'lucide-react';

export type WorkspaceId = 'production' | 'data-apis' | 'operations' | 'architecture';
export type AppStatus = 'live' | 'auth' | 'dev' | 'integrated' | 'planned' | 'active' | 'ready';

export interface CredentialInfo {
  label: string;
  value: string;
}

export interface PortalApp {
  id: string;
  name: string;
  shortLabel: string;
  workspace: WorkspaceId;
  status: AppStatus;
  statusLabel: string;
  description: string;
  icon: LucideIcon;
  color: string;
  colorBg: string;
  launchUrl?: string;
  launchLabel?: string;
  credentials?: CredentialInfo[];
  footerMeta: { label: string; value: string }[];
  keywords: string[];
}

export interface DatabaseTable {
  category: string;
  name: string;
  purpose: string;
  security: string;
  securityTone: 'success' | 'accent';
}

export interface CronJob {
  index: string;
  title: string;
  description: string;
  schedule: string;
  status: AppStatus;
  statusLabel: string;
}

export const WORKSPACES: { id: WorkspaceId; label: string; description: string }[] = [
  { id: 'production', label: 'Production', description: 'Live consumer and admin portals' },
  { id: 'data-apis', label: 'Data & APIs', description: 'Backend services and integrations' },
  { id: 'operations', label: 'Operations', description: 'Settlement, backups, and automation' },
  { id: 'architecture', label: 'Architecture', description: 'System design and specifications' },
];

export const PORTAL_APPS: PortalApp[] = [
  {
    id: 'website',
    name: 'Main Website Portal',
    shortLabel: 'Website',
    workspace: 'production',
    status: 'live',
    statusLabel: 'LIVE',
    description:
      'Next.js 14 consumer-facing marketplace. Purchase vouchers, manage wallets, view stores and rewards. Fully responsive and PWA enabled for low-data offline caching.',
    icon: Globe,
    color: '#3b82f6',
    colorBg: 'rgba(59, 130, 246, 0.12)',
    launchUrl: 'https://www.evoucher.co.za',
    launchLabel: 'Visit Website',
    footerMeta: [
      { label: 'Host', value: 'Vercel CDN' },
      { label: 'Port', value: '4028 (Local)' },
    ],
    keywords: ['website', 'marketplace', 'consumer', 'pwa', 'next.js'],
  },
  {
    id: 'admin',
    name: 'Admin Command Centre',
    shortLabel: 'Admin',
    workspace: 'production',
    status: 'auth',
    statusLabel: 'AUTH REQUIRED',
    description:
      'Sponsor reporting, merchant onboarding approvals, real-time platform metrics, and system configuration controls. Restricts access based on Supabase admin user roles.',
    icon: Shield,
    color: '#8b5cf6',
    colorBg: 'rgba(139, 92, 246, 0.12)',
    launchUrl: 'https://www.evoucher.co.za/portal/login',
    launchLabel: 'Launch Admin Portal',
    credentials: [
      { label: 'Login', value: 'Supabase admin email & password' },
      { label: 'URL', value: 'evoucher.co.za/portal/login' },
    ],
    footerMeta: [
      { label: 'Role', value: 'admin' },
      { label: 'Database', value: 'Supabase' },
    ],
    keywords: ['admin', 'portal', 'sponsor', 'merchant', 'onboarding'],
  },
  {
    id: 'billing',
    name: 'Billing Engine Portal',
    shortLabel: 'Billing',
    workspace: 'production',
    status: 'live',
    statusLabel: 'LIVE',
    description:
      'Integrated transaction ledger, automated Bankserv ACB file generation, reconciliation triggers, and payouts tracking. Built to comply with PASA guidelines.',
    icon: Receipt,
    color: '#10b981',
    colorBg: 'rgba(16, 185, 129, 0.12)',
    launchUrl: 'https://evoucher-billing-portal.vercel.app/login',
    launchLabel: 'Open Billing Portal',
    credentials: [
      { label: 'Passcode', value: 'eVoucherAdmin2024' },
      { label: 'Email', value: 'Any email address' },
    ],
    footerMeta: [
      { label: 'Integration', value: 'Bankserv' },
      { label: 'Standard', value: 'ACB/EFT' },
    ],
    keywords: ['billing', 'bankserv', 'settlement', 'ledger', 'pasa'],
  },
  {
    id: 'mobile',
    name: 'React Native Mobile App',
    shortLabel: 'Mobile',
    workspace: 'production',
    status: 'dev',
    statusLabel: 'READY TO DEPLOY',
    description:
      'Expo-powered mobile companion. Features camera scanner for instant QR-code redemption, offline voucher caching, and SMS-triggered updates for rural consumers.',
    icon: Smartphone,
    color: '#f59e0b',
    colorBg: 'rgba(245, 158, 11, 0.12)',
    footerMeta: [
      { label: 'Platforms', value: 'iOS & Android' },
      { label: 'Build', value: 'Expo SDK' },
    ],
    keywords: ['mobile', 'expo', 'react native', 'qr', 'scanner'],
  },
  {
    id: 'supabase',
    name: 'Supabase Cloud Platform',
    shortLabel: 'Supabase',
    workspace: 'data-apis',
    status: 'live',
    statusLabel: 'LIVE',
    description:
      'PostgreSQL instance, automated real-time subscriptions, Row-Level Security (RLS) policies, and token-based user authentication. Hosts storage buckets for voucher QR codes.',
    icon: Database,
    color: '#06b6d4',
    colorBg: 'rgba(6, 182, 212, 0.12)',
    launchUrl: 'https://supabase.com',
    launchLabel: 'Console Access',
    footerMeta: [
      { label: 'Provider', value: 'AWS (Supabase)' },
      { label: 'Secured', value: 'RLS Enabled' },
    ],
    keywords: ['supabase', 'postgresql', 'database', 'rls', 'auth'],
  },
  {
    id: 'payments',
    name: 'South African Payment Suite',
    shortLabel: 'Payments',
    workspace: 'data-apis',
    status: 'integrated',
    statusLabel: 'INTEGRATED',
    description:
      'Unified checkout system incorporating PayFast (cards), Ozow (instant EFT), cash payments at retail checkouts (Shoprite, Boxer), USSD codes, and airtime conversions.',
    icon: CreditCard,
    color: '#ec4899',
    colorBg: 'rgba(236, 72, 153, 0.12)',
    launchUrl: 'https://docs.ozow.com',
    launchLabel: 'Integration Docs',
    footerMeta: [
      { label: 'Integrations', value: '8 Methods' },
      { label: 'Compliance', value: 'PASA' },
    ],
    keywords: ['payfast', 'ozow', 'ussd', 'eft', 'payment'],
  },
  {
    id: 'settlement',
    name: 'Settlement Batch Engine',
    shortLabel: 'Settlement',
    workspace: 'operations',
    status: 'active',
    statusLabel: 'ACTIVE',
    description:
      'Aggregates previous day redemptions, computes commission margins, and formats Bankserv ACB files. Runs weekdays at 09:00 AM.',
    icon: Server,
    color: '#10b981',
    colorBg: 'rgba(16, 185, 129, 0.12)',
    footerMeta: [
      { label: 'Schedule', value: '09:00 AM Weekdays' },
      { label: 'Output', value: 'ACB Files' },
    ],
    keywords: ['settlement', 'batch', 'bankserv', 'acb'],
  },
  {
    id: 'notifications',
    name: 'Notification Queue Processor',
    shortLabel: 'Notifications',
    workspace: 'operations',
    status: 'ready',
    statusLabel: 'READY',
    description:
      'Pulls unsent notification rows, fires SMS via Clickatell API, emails via Resend, and marks completion logs. Runs every 5 minutes.',
    icon: Bell,
    color: '#8b5cf6',
    colorBg: 'rgba(139, 92, 246, 0.12)',
    footerMeta: [
      { label: 'Schedule', value: 'Every 5 Minutes' },
      { label: 'Channels', value: 'SMS, Email, Push' },
    ],
    keywords: ['notification', 'sms', 'clickatell', 'email'],
  },
  {
    id: 'architecture-overview',
    name: 'System Architecture',
    shortLabel: 'Architecture',
    workspace: 'architecture',
    status: 'live',
    statusLabel: 'VERIFIED',
    description:
      'Five-layer production architecture from consumer portals through payment APIs, Supabase, billing portal, and BankServ settlement. Includes revenue split and compliance notes.',
    icon: Layers,
    color: '#06b6d4',
    colorBg: 'rgba(6, 182, 212, 0.12)',
    launchLabel: 'View Architecture Tab',
    footerMeta: [
      { label: 'Layers', value: '5 Production' },
      { label: 'Spec', value: '6 PDF Sections' },
    ],
    keywords: ['architecture', 'diagram', 'layers', 'specification'],
  },
  {
    id: 'backups',
    name: 'Daily Backup System',
    shortLabel: 'Backups',
    workspace: 'operations',
    status: 'active',
    statusLabel: 'ACTIVE',
    description:
      'Zips source codes (Next.js, mobile app) and pulls full Supabase SQL backups (schema + table data). Runs daily at 02:00 AM via MASTER_BACKUP.bat.',
    icon: Clock,
    color: '#3b82f6',
    colorBg: 'rgba(59, 130, 246, 0.12)',
    footerMeta: [
      { label: 'Schedule', value: '02:00 AM Daily' },
      { label: 'Retention', value: '7 days incremental' },
    ],
    keywords: ['backup', 'sql', 'retention'],
  },
];

export const DATABASE_TABLES: DatabaseTable[] = [
  {
    category: 'Auth',
    name: 'auth.users',
    purpose:
      'System-level authentication data handled directly by Supabase Auth (emails, hashed credentials, metadata).',
    security: 'System Protected',
    securityTone: 'accent',
  },
  {
    category: 'Auth',
    name: 'public.user_profiles',
    purpose:
      'Extended customer, merchant, and administrator profile fields (FICA details, language preference, cell numbers).',
    security: 'RLS Configured',
    securityTone: 'success',
  },
  {
    category: 'Auth',
    name: 'public.user_roles',
    purpose:
      'Role assignment mapping (customer, merchant, admin) which dictates portal entry access permissions.',
    security: 'Admin Write Only',
    securityTone: 'accent',
  },
  {
    category: 'Merchants',
    name: 'public.merchants',
    purpose:
      'Primary business entities representing partners (Shoprite, Pick n Pay, Boxer, Spaza shops).',
    security: 'RLS Configured',
    securityTone: 'success',
  },
  {
    category: 'Merchants',
    name: 'public.merchant_products',
    purpose:
      'Product catalog available for vouchers, with custom base prices and platform-allocated discounts.',
    security: 'Public Read',
    securityTone: 'success',
  },
  {
    category: 'Merchants',
    name: 'public.merchant_branches',
    purpose: 'Branch locations linked to main merchants, allowing separate redemption oversight.',
    security: 'RLS Configured',
    securityTone: 'success',
  },
  {
    category: 'Merchants',
    name: 'public.branch_hierarchy',
    purpose: 'Configures parent-child visibility rules for corporate merchant regional managers.',
    security: 'Admin Write Only',
    securityTone: 'accent',
  },
  {
    category: 'Vouchers',
    name: 'public.customer_vouchers',
    purpose:
      'Lifecycle tracking of generated codes (Active, Redeemed, Expired) with linked barcodes/QR content.',
    security: 'RLS Secured',
    securityTone: 'success',
  },
  {
    category: 'Vouchers',
    name: 'public.voucher_redemptions',
    purpose:
      'Audit logging of voucher redemptions, capturing till IDs, timestamps, and merchant branch profiles.',
    security: 'Read Only Ledger',
    securityTone: 'accent',
  },
  {
    category: 'Vouchers',
    name: 'public.voucher_templates',
    purpose:
      'Design templates defining custom background colors, layouts, and branding for corporate vouchers.',
    security: 'Public Read',
    securityTone: 'success',
  },
  {
    category: 'Payments',
    name: 'public.payment_transactions',
    purpose:
      'Records all transactional purchase requests with unique transaction IDs and status tracks.',
    security: 'FICA Compliant',
    securityTone: 'accent',
  },
  {
    category: 'Payments',
    name: 'public.wallet_ledger',
    purpose:
      'Double-entry account bookkeeping to track deposits, usage, and refunds for customer e-wallets.',
    security: 'System Protected',
    securityTone: 'accent',
  },
  {
    category: 'Billing',
    name: 'public.billing_events',
    purpose:
      'Audit trail recording system actions triggering fees or settlements, feeding the billing portal.',
    security: 'Read Only Ledger',
    securityTone: 'accent',
  },
  {
    category: 'Settlement',
    name: 'public.settlement_batches',
    purpose: 'ACB payout files and records generated daily for Bankserv processing.',
    security: 'Encrypted Vault',
    securityTone: 'accent',
  },
  {
    category: 'Settlement',
    name: 'public.settlement_transactions',
    purpose:
      'Granular accounting records mapping individual voucher payouts inside a settlement batch.',
    security: 'Encrypted Vault',
    securityTone: 'accent',
  },
  {
    category: 'Settlement',
    name: 'public.bankserv_settlements',
    purpose: 'Integrated bank acknowledgement files (ACK/NCK status) from daily clearing updates.',
    security: 'Encrypted Vault',
    securityTone: 'accent',
  },
  {
    category: 'System',
    name: 'public.audit_logs',
    purpose:
      'Platform security logging tracking administrative tasks, modifications, and system shutdowns.',
    security: 'WORM Ledger',
    securityTone: 'accent',
  },
  {
    category: 'System',
    name: 'public.notification_queue',
    purpose:
      'Queued alerts (SMS, Email, Push notifications) waiting to be pushed to network services.',
    security: 'RLS Configured',
    securityTone: 'success',
  },
  {
    category: 'System',
    name: 'public.system_config',
    purpose:
      'Dynamic parameters, transaction caps, service fee percentages, and system maintenance switches.',
    security: 'Admin Write Only',
    securityTone: 'accent',
  },
  {
    category: 'System',
    name: 'public.subscriptions',
    purpose:
      'Manages recurring savings bundles (SASSA Grant Saver, Family Essentials) and automated split vouchers.',
    security: 'RLS Secured',
    securityTone: 'success',
  },
];

export const CRON_JOBS: CronJob[] = [
  {
    index: '01',
    title: 'Daily System Backup (`MASTER_BACKUP.bat`)',
    description:
      'Zips source codes (Next.js, mobile app) and pulls full Supabase SQL backups (schema + tables data).',
    schedule: '02:00 AM Daily',
    status: 'active',
    statusLabel: 'ACTIVE',
  },
  {
    index: '02',
    title: 'Settlement Batch Compilation',
    description:
      "Aggregates previous day's redemptions, computes commission margins, and formats Bankserv ACB files.",
    schedule: '09:00 AM Weekdays',
    status: 'active',
    statusLabel: 'ACTIVE',
  },
  {
    index: '03',
    title: 'Voucher Expiry Evaluation',
    description:
      "Checks database for expired vouchers, marks statuses to 'expired', and sends SMS alerts to customers.",
    schedule: '04:00 AM Daily',
    status: 'dev',
    statusLabel: 'INTEGRATION READY',
  },
  {
    index: '04',
    title: 'Notification Queue Processing',
    description:
      'Pulls unsent notification rows, fires SMS via Clickatell API, emails via Resend, and marks completion logs.',
    schedule: 'Every 5 Minutes',
    status: 'ready',
    statusLabel: 'READY',
  },
  {
    index: '05',
    title: 'Weekly DB Vacuum and Clean',
    description:
      'Executes SQL vacuum analyzes, clears obsolete system audit entries older than 90 days, and checks indexing.',
    schedule: '03:00 AM Sundays',
    status: 'planned',
    statusLabel: 'PLANNED',
  },
];

export const STATS = [
  { value: '3', label: 'Production Environments' },
  { value: '20', label: 'Relational Database Tables' },
  { value: '8', label: 'Integrated Payment Channels' },
  { value: '4', label: 'Secure Access Portals' },
];

export const ARCHITECTURE_PDF_PATH = '/docs/system-architecture-2026.pdf';

export const EMAIL_TEMPLATE = `Subject: eVoucher Platform - Infrastructure & Operations Overview Dashboard

Dear Team,

I have compiled a complete overview of our eVoucher platform infrastructure to assist in onboarding and handovers.

View the live interactive dashboard at:
https://www.evoucher.co.za/infrastructure

You can also access the Billing Engine Portal at:
https://evoucher-billing-portal.vercel.app/login (passcode: eVoucherAdmin2024)

The dashboard includes:
1. Live Hosted URL list (Main client site, Billing portal, Admin Command Centre).
2. Database Schema (20 normalized Supabase PostgreSQL tables).
3. Cron Tasks & daily automated backup setups.
4. Full 5-layer system architecture with revenue split breakdown.
5. Third-party clearing integrations (Bankserv ACB, Ozow, PayFast).

Please let me know if you need any additional credentials or support files.

Best regards,
Lebo Mpeta
mpetalebo@outlook.com`;
