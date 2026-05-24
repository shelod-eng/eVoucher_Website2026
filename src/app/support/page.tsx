import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import SupportChatConsole from './components/SupportChatConsole';
import SupportTicketWorkspace from './components/SupportTicketWorkspace';

export const metadata: Metadata = {
  title: 'Support Channels - eVoucher Platform',
  description:
    'Customer support channels for eVoucher, including chatbot guidance, WhatsApp access, helpdesk routing, and ticket logging.',
};

const sprintTasks = [
  {
    id: 'Task 01',
    label: 'UX / Channel',
    title: 'Website Chatbot Integration',
    description:
      'Guide consumers through voucher purchase, redemption, and support journeys with a lightweight website assistant.',
    accent: 'sky',
    icon: 'CpuChipIcon',
  },
  {
    id: 'Task 02',
    label: 'Channel Expansion',
    title: 'WhatsApp Platform Integration',
    description:
      'Extend support and voucher guidance to WhatsApp for users who need a familiar mobile-first channel.',
    accent: 'emerald',
    icon: 'ChatBubbleLeftRightIcon',
  },
  {
    id: 'Task 03',
    label: 'Support Ops',
    title: 'Helpdesk Email Routing',
    description:
      'Route inbound support requests by category and start SLA timing automatically from first receipt.',
    accent: 'amber',
    icon: 'EnvelopeOpenIcon',
  },
  {
    id: 'Task 04',
    label: 'DevOps / ITSM',
    title: 'Ticket Logging via Jira / ServiceNow',
    description:
      'Track escalations from intake to resolution with ticket workflow and sponsor-facing accountability.',
    accent: 'violet',
    icon: 'TicketIcon',
  },
];

const whatsappJourneys = [
  'Voucher lookup and purchase assistance',
  'Redemption help and support follow-up',
  'Merchant and consumer query handoff',
  'Channel parity with USSD and web support flows',
];

function accentClasses(accent: string) {
  if (accent === 'emerald') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  }
  if (accent === 'amber') {
    return 'border-amber-200 bg-amber-50 text-amber-900';
  }
  if (accent === 'violet') {
    return 'border-violet-200 bg-violet-50 text-violet-900';
  }
  return 'border-sky-200 bg-sky-50 text-sky-900';
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.35),_transparent_32%),linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f8fafc_100%)]">
      <Header />

      <main className="pt-16">
        <section className="relative overflow-hidden px-4 py-20 lg:px-6 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[36px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-8 shadow-[0_30px_100px_-60px_rgba(15,118,110,0.55)] lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-4xl">
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                    Weekend Sprint
                  </p>
                  <h1 className="mt-4 font-headline text-4xl font-bold leading-tight text-slate-950 lg:text-6xl">
                    Support channels that move eVoucher closer to always-on service.
                  </h1>
                  <p className="mt-5 max-w-3xl font-body text-lg leading-8 text-slate-600">
                    This sprint focuses on four visible deliverables for `evoucher.co.za`: a website
                    chatbot, WhatsApp support entry point, helpdesk routing logic, and ticket
                    logging flow for Jira or ServiceNow escalation.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-950 px-6 py-5 text-white shadow-xl">
                  <p className="font-body text-xs uppercase tracking-[0.26em] text-sky-200">
                    Sprint Outcome
                  </p>
                  <p className="mt-2 font-headline text-2xl font-bold">4 Planned Deliverables</p>
                  <p className="mt-2 font-body text-sm text-slate-300">
                    Customer-facing channels, support operations, and sponsor-ready visibility.
                  </p>
                </div>
              </div>

              <div className="mt-10 grid gap-4 lg:grid-cols-2">
                {sprintTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-[28px] border p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.45)] ${accentClasses(task.accent)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/75 shadow-sm">
                        <Icon name={task.icon} size={28} variant="solid" className="text-current" />
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-current/15 bg-white/70 px-3 py-1 font-body text-xs font-semibold uppercase tracking-[0.2em]">
                            {task.id}
                          </span>
                          <span className="rounded-full border border-current/15 bg-white px-3 py-1 font-body text-xs font-semibold uppercase tracking-[0.2em]">
                            {task.label}
                          </span>
                        </div>
                        <h2 className="mt-4 font-headline text-2xl font-bold">{task.title}</h2>
                        <p className="mt-2 font-body text-sm leading-7 text-slate-600">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 lg:px-6">
          <div className="mx-auto max-w-7xl">
            <SupportChatConsole />
          </div>
        </section>

        <section className="px-4 py-8 lg:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-[0_24px_80px_-50px_rgba(5,150,105,0.4)] lg:p-8">
              <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                    Task 02
                  </p>
                  <h2 className="mt-3 font-headline text-3xl font-bold text-slate-950">
                    WhatsApp Platform Integration
                  </h2>
                  <p className="mt-4 font-body text-base leading-8 text-slate-600">
                    Add WhatsApp as an alternative support and guidance channel for consumers who
                    prefer mobile messaging over web or app navigation.
                  </p>
                  <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="font-body text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Ready-to-launch journeys
                    </p>
                    <ul className="mt-4 space-y-3">
                      {whatsappJourneys.map((journey) => (
                        <li key={journey} className="flex gap-3 font-body text-sm text-slate-700">
                          <Icon
                            name="CheckCircleIcon"
                            size={18}
                            variant="solid"
                            className="mt-0.5 text-emerald-600"
                          />
                          <span>{journey}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-[28px] bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-950 p-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">
                        Channel Expansion
                      </p>
                      <h3 className="mt-3 font-headline text-2xl font-bold">
                        WhatsApp support entry point
                      </h3>
                      <p className="mt-3 font-body text-sm leading-7 text-emerald-50/85">
                        Pre-fill a consumer help message and route the conversation into the same
                        support taxonomy used by the website and helpdesk intake.
                      </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                      <Icon
                        name="ChatBubbleLeftRightIcon"
                        size={28}
                        variant="solid"
                        className="text-emerald-100"
                      />
                    </div>
                  </div>

                  <div className="mt-8 rounded-[26px] bg-white/10 p-5 backdrop-blur-sm">
                    <p className="font-body text-sm text-emerald-50">
                      Suggested launch line:
                    </p>
                    <p className="mt-2 font-headline text-xl font-semibold">
                      "Hi eVoucher, I need help with voucher purchase or redemption."
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href="https://wa.me/27712345678?text=Hi%20eVoucher%2C%20I%20need%20help%20with%20voucher%20purchase%20or%20redemption."
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-headline text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                    >
                      <Icon name="PaperAirplaneIcon" size={18} variant="solid" className="text-emerald-700" />
                      <span>Launch WhatsApp</span>
                    </a>
                    <Link
                      href="/ussd-console"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 font-headline text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <Icon name="DevicePhoneMobileIcon" size={18} variant="solid" className="text-emerald-100" />
                      <span>Open USSD simulator</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 lg:px-6 lg:pb-20">
          <div className="mx-auto max-w-7xl">
            <SupportTicketWorkspace />
          </div>
        </section>
      </main>
    </div>
  );
}
