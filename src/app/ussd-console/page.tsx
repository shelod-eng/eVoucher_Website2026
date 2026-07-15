'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cloud,
  CreditCard,
  FileText,
  Fingerprint,
  Globe2,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Languages,
  Landmark,
  LockKeyhole,
  Network,
  Play,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Signal,
  Smartphone,
  Sprout,
  Store,
  Users,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react';

type UssdApiResponse = {
  success?: boolean;
  action?: 'CON' | 'END';
  message?: string;
  state?: string;
  error?: string;
  sessionStarted?: boolean;
};

type TranscriptEntry = {
  id: string;
  label: string;
  text: string;
  tone: 'citizen' | 'platform' | 'success';
};

type Journey = {
  id: string;
  label: string;
  icon: typeof Smartphone;
  steps: string[];
  phoneScreens: string[];
  apiInputs?: string[];
};

const SERVICE_CODE = '*120*384#';

const LANGUAGE_SCREENS = {
  English: `Welcome to eVoucher

1 Register
2 Login
3 Buy Voucher
4 My Wallet
5 Redeem Voucher
6 Government Benefits
7 Check Balance
8 Change Language
0 Exit`,
  isiZulu: `Siyakwamukela ku-eVoucher

1 Bhalisa
2 Ngena
3 Thenga iVoucher
4 Isikhwama sami
5 Sebenzisa iVoucher
6 Izibonelelo zikahulumeni
7 Hlola ibhalansi
8 Shintsha ulimi
0 Phuma`,
  Sesotho: `Rea o amohela ho eVoucher

1 Ngodisa
2 Kena
3 Reka Voucher
4 Sepache sa ka
5 Sebedisa Voucher
6 Dithuso tsa Mmuso
7 Sheba balance
8 Fetola puo
0 Tloha`,
  Setswana: `O amogetswe mo eVoucher

1 Ikwadise
2 Tsena
3 Reka Voucher
4 Wallet ya me
5 Dirisa Voucher
6 Dithuso tsa puso
7 Lekola balance
8 Fetola puo
0 Tswa`,
};

const KPI_CARDS = [
  {
    label: 'USSD Service Availability',
    value: '99.98%',
    detail: 'National access ready',
    icon: Signal,
  },
  { label: 'Active Sessions', value: '4,812', detail: 'Live citizen journeys', icon: Activity },
  {
    label: 'Registered Feature Phone Users',
    value: '128k',
    detail: 'Low-data inclusion',
    icon: Users,
  },
  {
    label: 'Successful Transactions Today',
    value: '32,420',
    detail: 'Voucher activity',
    icon: ReceiptText,
  },
  { label: 'Average Response Time', value: '1.4s', detail: 'P95 interaction speed', icon: Clock3 },
  {
    label: 'Supported Mobile Networks',
    value: '4',
    detail: 'MTN, Vodacom, Telkom, Cell C',
    icon: Network,
  },
];

const JOURNEYS: Journey[] = [
  {
    id: 'registration',
    label: 'New User Registration',
    icon: Fingerprint,
    apiInputs: ['', '1', 'Nomsa', 'Dlamini', '1', '2468', '2468'],
    steps: [
      `Dial ${SERVICE_CODE}`,
      'Choose Register',
      'Enter citizen details',
      'Create secure PIN',
      'Registration Successful',
      'Wallet Created',
    ],
    phoneScreens: [
      `Choose Language

1 English
2 isiZulu
3 Sesotho
4 Setswana`,
      `eVoucher Registration

Enter first name:`,
      `Enter surname:`,
      `Select province

1 Gauteng
2 Western Cape
3 KwaZulu-Natal
0 Back`,
      `Create 4-digit PIN`,
      `Registration successful

Wallet created
Ready to buy vouchers`,
    ],
  },
  {
    id: 'login',
    label: 'Returning User Login',
    icon: LockKeyhole,
    apiInputs: ['', '2'],
    steps: ['Dial service code', 'Enter PIN', 'Identity verified', 'Wallet ready'],
    phoneScreens: [
      LANGUAGE_SCREENS.English,
      `Login / Continue

Enter your 4-digit PIN:`,
      `Login successful

Hi Nomsa
Wallet balance: R2,850.00`,
    ],
  },
  {
    id: 'buy',
    label: 'Buy Voucher',
    icon: CreditCard,
    apiInputs: ['', '3', '9', '9', '1', '1'],
    steps: [
      'Select Buy Voucher',
      'Choose merchant',
      'Select product',
      'Confirm wallet payment',
      'Voucher Generated',
    ],
    phoneScreens: [
      LANGUAGE_SCREENS.English,
      `Select store

1 Shoprite
2 Pick n Pay
3 Pep
9 Next
0 Back`,
      `Super Precast Concrete

1 R500 Building Material Voucher - R475.00
2 R1000 Cement & Blocks Voucher - R950.00`,
      `Voucher purchased

EV-SPC-482913
Wallet balance: R2,375.00`,
    ],
  },
  {
    id: 'wallet',
    label: 'View Wallet',
    icon: Wallet,
    apiInputs: ['', '4'],
    steps: ['Open Wallet', 'Fetch balance', 'Display active vouchers', 'Return to menu'],
    phoneScreens: [
      LANGUAGE_SCREENS.English,
      `My Wallet

Available: R2,850.00
Active vouchers: 3
Last purchase: EV-SPC-482913

0 Back`,
    ],
  },
  {
    id: 'redeem',
    label: 'Redeem Voucher',
    icon: Store,
    apiInputs: ['', '5', '9', '9', '1', 'EV-SPC-482913', '1'],
    steps: [
      'Customer Presents Voucher',
      'Merchant Enters Voucher',
      'Platform Validation',
      'Approved',
      'Redeemed',
      'Settlement Recorded',
    ],
    phoneScreens: [
      `Redeem Voucher

Choose merchant location`,
      `Enter voucher code`,
      `Confirm redeem EV-SPC-482913?

1 Yes
0 Back`,
      `Approved

Voucher redeemed
Settlement recorded`,
    ],
  },
  {
    id: 'benefits',
    label: 'Government Benefits',
    icon: Landmark,
    steps: [
      'Select Government Benefits',
      'Verify citizen programme',
      'Allocate restricted voucher',
      'Notify beneficiary',
    ],
    phoneScreens: [
      `Government Benefits

1 Food Relief
2 School Nutrition
3 Youth Employment
4 Municipal Services
0 Back`,
      `Food Relief

Eligibility verified
R350 food voucher allocated
Valid at national merchants`,
    ],
  },
  {
    id: 'merchant',
    label: 'Merchant Validation',
    icon: Building2,
    steps: [
      'Customer Presents Voucher',
      'Merchant Enters Voucher',
      'Platform Validation',
      'Approved',
      'Settlement Recorded',
    ],
    phoneScreens: [
      `Merchant Validation

Enter voucher code:`,
      `Validating EV-SPC-482913`,
      `Approved

Merchant: Super Precast
Amount: R500.00
Settlement queued`,
    ],
  },
  {
    id: 'balance',
    label: 'Balance Enquiry',
    icon: HandCoins,
    apiInputs: ['', '4'],
    steps: ['Select Check Balance', 'Authenticate session', 'Return wallet balance'],
    phoneScreens: [
      `Balance Enquiry

PIN verified`,
      `Available balance

R2,850.00
Voucher value: R1,200.00
0 Back`,
    ],
  },
  {
    id: 'history',
    label: 'Transaction History',
    icon: FileText,
    steps: ['Open history', 'Fetch recent transactions', 'Display latest voucher activity'],
    phoneScreens: [
      `Transaction History

1 EV-SPC-482913 R500 Redeemed
2 Food Relief R350 Active
3 Shoprite R200 Purchased
0 Back`,
    ],
  },
];

const ARCHITECTURE_FLOW = [
  { label: 'Citizen', icon: Users },
  { label: SERVICE_CODE, icon: Smartphone },
  { label: 'Mobile Network', icon: Signal },
  { label: 'USSD Gateway', icon: Network },
  { label: 'eVoucher Platform', icon: Cloud },
  { label: 'Voucher Engine', icon: ReceiptText },
  { label: 'Merchant', icon: Store },
  { label: 'Settlement', icon: HandCoins },
];

const VALUE_POINTS = [
  { label: 'No smartphone required', icon: Smartphone },
  { label: 'No mobile data required', icon: Signal },
  { label: 'Works on GSM feature phones', icon: Network },
  { label: 'Accessible in rural communities', icon: Sprout },
  { label: 'Supports Government programmes', icon: Landmark },
  { label: 'Financial inclusion', icon: HandCoins },
  { label: 'Low-cost citizen access', icon: Wallet },
  { label: 'Secure PIN authentication', icon: LockKeyhole },
  { label: 'National merchant network', icon: Store },
];

const PROGRAMMES = [
  { label: 'Food Relief', icon: Utensils, journeyId: 'benefits' },
  { label: 'School Nutrition', icon: GraduationCap, journeyId: 'benefits' },
  { label: 'Youth Employment', icon: Zap, journeyId: 'benefits' },
  { label: 'Agriculture Support', icon: Sprout, journeyId: 'benefits' },
  { label: 'Disaster Relief', icon: ShieldCheck, journeyId: 'benefits' },
  { label: 'Municipal Services', icon: Landmark, journeyId: 'benefits' },
  { label: 'Healthcare Assistance', icon: HeartPulse, journeyId: 'benefits' },
];

const BADGES = [
  'POPIA Ready',
  'Secure PIN Authentication',
  'Audit Logging',
  'Multi-language Support',
  'API Enabled',
  'Merchant Network Ready',
  'Government Ready',
  'Scalable Cloud Platform',
];

const SECURITY_CONTROLS = [
  'PIN Authentication',
  'Session Timeout',
  'OTP Support',
  'Encrypted Communication',
  'Fraud Monitoring',
  'Audit Trail',
  'Secure APIs',
];

function createSessionId() {
  return `universal-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function entry(label: string, text: string, tone: TranscriptEntry['tone']): TranscriptEntry {
  return {
    id: `${label}-${Date.now()}-${Math.random()}`,
    label,
    text,
    tone,
  };
}

export default function UssdConsolePage() {
  const [msisdn] = useState('27780589029');
  const [sessionId, setSessionId] = useState(createSessionId());
  const [activeJourneyId, setActiveJourneyId] = useState('registration');
  const [activeStep, setActiveStep] = useState(0);
  const [language, setLanguage] = useState<keyof typeof LANGUAGE_SCREENS>('English');
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiState, setApiState] = useState('READY');
  const [phoneText, setPhoneText] = useState(LANGUAGE_SCREENS.English);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    entry('Platform', 'Universal access channel ready for citizen services.', 'platform'),
  ]);
  const [successCount, setSuccessCount] = useState(32420);

  const activeJourney = useMemo(
    () => JOURNEYS.find((journey) => journey.id === activeJourneyId) ?? JOURNEYS[0],
    [activeJourneyId]
  );

  useEffect(() => {
    if (activeJourneyId === 'registration' && activeStep === 0) {
      setPhoneText(`Choose Language

1 English
2 isiZulu
3 Sesotho
4 Setswana`);
      return;
    }

    const screens = activeJourney.phoneScreens;
    setPhoneText(screens[Math.min(activeStep, screens.length - 1)] ?? LANGUAGE_SCREENS[language]);
  }, [activeJourney, activeJourneyId, activeStep, language]);

  useEffect(() => {
    if (!demoMode) return;

    const timer = window.setInterval(() => {
      setActiveStep((current) => {
        const next = current + 1;
        if (next >= activeJourney.steps.length) {
          const currentIndex = JOURNEYS.findIndex((journey) => journey.id === activeJourney.id);
          const nextJourney = JOURNEYS[(currentIndex + 1) % JOURNEYS.length];
          setActiveJourneyId(nextJourney.id);
          setTranscript((items) => [
            ...items.slice(-9),
            entry('Demo Mode', `Advancing to ${nextJourney.label}.`, 'platform'),
          ]);
          setSuccessCount((count) => count + 1);
          return 0;
        }
        setTranscript((items) => [
          ...items.slice(-9),
          entry('Journey', activeJourney.steps[next] ?? 'Session updated', 'citizen'),
        ]);
        return next;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [activeJourney, demoMode]);

  async function callUssdApi(inputs: string[]) {
    setLoading(true);
    setApiState('PROCESSING');
    const nextSessionId = createSessionId();
    setSessionId(nextSessionId);

    try {
      let lastMessage = '';
      let lastState = '';

      for (const input of inputs) {
        const response = await fetch('/api/v1/ussd/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: nextSessionId,
            msisdn,
            text: input,
            provider: 'demo',
          }),
        });

        const payload = (await response.json()) as UssdApiResponse;
        lastMessage = payload.message ?? payload.error ?? lastMessage;
        lastState = payload.state ?? lastState;
      }

      if (lastMessage) setPhoneText(lastMessage);
      setApiState(lastState || 'COMPLETED');
      setTranscript((items) => [
        ...items.slice(-8),
        entry('Live USSD', lastMessage || 'Session completed successfully.', 'success'),
      ]);
      setSuccessCount((count) => count + 1);
    } catch (error: any) {
      setApiState('RETRY READY');
      setTranscript((items) => [
        ...items.slice(-8),
        entry('Platform', error?.message ?? 'USSD channel could not be reached.', 'platform'),
      ]);
    } finally {
      setLoading(false);
    }
  }

  function runJourney(journey: Journey) {
    setDemoMode(false);
    setActiveJourneyId(journey.id);
    setActiveStep(0);
    setTranscript([
      entry('Citizen', `${journey.label} selected.`, 'citizen'),
      entry('Platform', journey.steps[0] ?? 'Journey started.', 'platform'),
    ]);

    if (journey.apiInputs?.length) {
      void callUssdApi(journey.apiInputs);
    }
  }

  function resetExperience() {
    setDemoMode(false);
    setSessionId(createSessionId());
    setActiveJourneyId('registration');
    setActiveStep(0);
    setLanguage('English');
    setApiState('READY');
    setPhoneText(LANGUAGE_SCREENS.English);
    setTranscript([
      entry('Platform', 'Universal access channel ready for citizen services.', 'platform'),
    ]);
  }

  function updateLanguage(nextLanguage: keyof typeof LANGUAGE_SCREENS) {
    setLanguage(nextLanguage);
    setActiveJourneyId('registration');
    setActiveStep(0);
    setPhoneText(LANGUAGE_SCREENS[nextLanguage]);
    setTranscript((items) => [
      ...items.slice(-8),
      entry('Language', `Display language changed to ${nextLanguage}.`, 'platform'),
    ]);
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#20324A]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-lg border border-[#D7F3F6] bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#20B8C5]">
                Universal Access
              </p>
              <h1 className="mt-3 font-headline text-4xl font-bold tracking-tight text-[#20324A]">
                eVoucher Universal Access Platform
              </h1>
              <p className="mt-3 text-base font-medium text-[#64748B]">
                Secure USSD Financial Inclusion Channel for South Africa
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDemoMode((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                  demoMode ? 'bg-[#108995]' : 'bg-[#20B8C5] hover:bg-[#108995]'
                }`}
              >
                <Play className="h-4 w-4" />
                {demoMode ? 'Demo Mode Active' : 'Start Demo Mode'}
              </button>
              <button
                type="button"
                onClick={resetExperience}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B9E9EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#108995] hover:bg-[#EAFBFD]"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {KPI_CARDS.map(({ label, value, detail, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-[#E6EEF5] bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#20B8C5]/10 text-[#20B8C5]">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-[#64748B]">{label}</p>
              <p className="mt-2 font-headline text-2xl font-bold text-[#20324A]">
                {label === 'Successful Transactions Today' ? successCount.toLocaleString() : value}
              </p>
              <p className="mt-1 text-xs text-[#108995]">{detail}</p>
            </div>
          ))}
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-[0.95fr_1.15fr_0.9fr]">
          <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-headline text-lg font-bold text-[#20324A]">Citizen Journey</h2>
                <p className="mt-1 text-sm text-[#64748B]">Select a service path.</p>
              </div>
              <span className="rounded-full bg-[#EAFBFD] px-3 py-1 text-xs font-semibold text-[#108995]">
                {apiState}
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              {JOURNEYS.map((journey) => {
                const Icon = journey.icon;
                const selected = activeJourney.id === journey.id;
                return (
                  <button
                    key={journey.id}
                    type="button"
                    onClick={() => runJourney(journey)}
                    disabled={loading}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition ${
                      selected
                        ? 'border-[#20B8C5] bg-[#EAFBFD] text-[#108995]'
                        : 'border-[#E6EEF5] bg-white text-[#20324A] hover:border-[#20B8C5]'
                    } disabled:opacity-60`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{journey.label}</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-headline text-lg font-bold text-[#20324A]">
                  Feature Phone Access
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Any GSM phone can dial {SERVICE_CODE}.
                </p>
              </div>
              <Smartphone className="h-5 w-5 text-[#20B8C5]" />
            </div>
            <div className="mx-auto max-w-[320px] rounded-[2rem] border border-[#20324A] bg-[#17243A] p-4 shadow-[0_22px_40px_rgba(15,23,42,0.22)]">
              <div className="mb-3 flex items-center justify-between px-2 text-xs font-semibold text-white/80">
                <span>eVoucher</span>
                <span>{SERVICE_CODE}</span>
              </div>
              <div className="min-h-[355px] rounded-2xl border border-[#B9E9EE] bg-[#F8FEFF] p-4 font-mono text-[13px] leading-6 text-[#20324A] shadow-inner">
                <pre className="whitespace-pre-wrap">{phoneText}</pre>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="h-10 rounded-lg bg-white/10 text-sm font-bold text-white"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <h2 className="font-headline text-lg font-bold text-[#20324A]">Live Session</h2>
            <p className="mt-1 text-sm text-[#64748B]">Audience-friendly session trace.</p>
            <div className="mt-4 h-[520px] overflow-y-auto rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-3">
              <div className="space-y-3">
                {transcript.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      item.tone === 'success'
                        ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'
                        : item.tone === 'citizen'
                          ? 'border-[#B9E9EE] bg-[#EAFBFD] text-[#108995]'
                          : 'border-[#E6EEF5] bg-white text-[#20324A]'
                    }`}
                  >
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
                      {item.label}
                    </p>
                    <pre className="whitespace-pre-wrap font-sans">{item.text}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <h2 className="font-headline text-lg font-bold text-[#20324A]">
              Platform Architecture
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {ARCHITECTURE_FLOW.map(({ label, icon: Icon }, index) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex min-h-[88px] flex-1 flex-col justify-center rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-3">
                    <Icon className="mb-2 h-5 w-5 text-[#20B8C5]" />
                    <p className="text-sm font-bold text-[#20324A]">{label}</p>
                  </div>
                  {index < ARCHITECTURE_FLOW.length - 1 && (
                    <ChevronRight className="hidden h-4 w-4 text-[#94A3B8] md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <h2 className="font-headline text-lg font-bold text-[#20324A]">Why USSD Matters</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {VALUE_POINTS.map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 rounded-lg bg-[#F7F9FC] p-3">
                  <Icon className="h-4 w-4 shrink-0 text-[#20B8C5]" />
                  <p className="text-sm font-semibold text-[#20324A]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <h2 className="font-headline text-lg font-bold text-[#20324A]">
              Government Programme Examples
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PROGRAMMES.map(({ label, icon: Icon, journeyId }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => runJourney(JOURNEYS.find((journey) => journey.id === journeyId)!)}
                  className="flex items-center gap-3 rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-3 text-left text-sm font-semibold text-[#20324A] hover:border-[#20B8C5] hover:bg-[#EAFBFD]"
                >
                  <Icon className="h-4 w-4 text-[#20B8C5]" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-[#20B8C5]" />
              <h2 className="font-headline text-lg font-bold text-[#20324A]">
                Multi-language Demonstration
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(Object.keys(LANGUAGE_SCREENS) as Array<keyof typeof LANGUAGE_SCREENS>).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => updateLanguage(item)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm font-bold ${
                      language === item
                        ? 'border-[#20B8C5] bg-[#EAFBFD] text-[#108995]'
                        : 'border-[#E6EEF5] bg-[#F7F9FC] text-[#20324A]'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <h2 className="font-headline text-lg font-bold text-[#20324A]">Security Controls</h2>
            <div className="mt-4 grid gap-3">
              {SECURITY_CONTROLS.map((control) => (
                <div key={control} className="flex items-center gap-3 rounded-lg bg-[#F7F9FC] p-3">
                  <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                  <p className="text-sm font-semibold text-[#20324A]">{control}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#E6EEF5] bg-white p-5 shadow-sm">
            <h2 className="font-headline text-lg font-bold text-[#20324A]">
              Production Integration Architecture
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                'Mobile Networks',
                'USSD Gateway',
                'eVoucher API',
                'Voucher Engine',
                'Merchant Portal',
                'Reporting',
              ].map((item, index) => (
                <div key={item} className="rounded-lg border border-[#E6EEF5] bg-[#F7F9FC] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#20B8C5]">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#20324A]">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full bg-[#EAFBFD] px-3 py-1.5 text-xs font-bold text-[#108995]"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        <footer className="rounded-lg border border-[#D7F3F6] bg-[#EAFBFD] p-5 text-sm text-[#64748B]">
          <div className="flex flex-wrap items-center gap-3">
            <Globe2 className="h-5 w-5 text-[#20B8C5]" />
            <p>
              USSD is presented as one secure access channel in the unified eVoucher national
              digital commerce platform.
            </p>
            <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold text-[#108995]">
              <CheckCircle2 className="h-4 w-4" />
              Session {sessionId}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
