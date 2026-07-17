/**
 * eVoucher Shared Design System
 * Premium fintech components used across all authenticated pages.
 */
'use client';

import { ReactNode } from 'react';

// ─── Colour tokens (matches tailwind.css) ────────────────────────────────────
export const BRAND = {
  heroGradient: 'bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0891b2]',
  heroGradientR: 'bg-gradient-to-r from-[#064e3b] via-[#0d9488] to-[#0891b2]',
  savingsGradient: 'bg-gradient-to-r from-success/10 to-teal-50',
  cardHover: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
  cardBase: 'rounded-2xl border border-border bg-white shadow-sm',
  inputBase:
    'w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
  btnPrimary:
    'rounded-xl bg-primary px-5 py-2.5 font-headline text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95',
  btnOutline:
    'rounded-xl border border-primary px-5 py-2.5 font-headline text-sm font-bold text-primary transition-all hover:bg-primary/10 active:scale-95',
  btnGhost:
    'rounded-xl border border-border px-5 py-2.5 font-headline text-sm font-bold text-foreground transition-all hover:bg-muted active:scale-95',
};

// ─── Merchant logo map ────────────────────────────────────────────────────────
export const MERCHANT_LOGOS: Record<string, string> = {
  shoprite: '/assets/images/merchants/shoprite.png',
  'pick n pay': '/assets/images/merchants/picknpay.png',
  picknpay: '/assets/images/merchants/picknpay.png',
  checkers: '/assets/images/merchants/checkers.png',
  clicks: '/assets/images/merchants/clicks.png',
  'dis-chem': '/assets/images/merchants/dischem.png',
  dischem: '/assets/images/merchants/dischem.png',
  pep: '/assets/images/merchants/pep.png',
  game: '/assets/images/merchants/game.png',
  boxer: '/assets/images/merchants/boxer.png',
  woolworths: '/assets/images/merchants/woolworths.png',
  engen: '/assets/images/merchants/engen.png',
  'mr price': '/assets/images/merchants/mr-price.png',
  mrprice: '/assets/images/merchants/mr-price.png',
  usave: '/assets/images/merchants/usave.png',
  kalapeng: '/assets/images/merchants/kalapeng.png',
};
export const PLACEHOLDER_LOGO = '/assets/images/merchants/placeholder-merchant.svg';

export function getMerchantLogo(name: string): string {
  const key = String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
  return MERCHANT_LOGOS[key] ?? PLACEHOLDER_LOGO;
}

// ─── PageShell ────────────────────────────────────────────────────────────────
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}

// ─── PageContent ─────────────────────────────────────────────────────────────
export function PageContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto max-w-7xl px-4 pb-20 pt-20 lg:px-6 ${className}`}>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

// ─── PremiumHero ─────────────────────────────────────────────────────────────
interface StatItem { label: string; value: string; sub?: string }
interface PremiumHeroProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  stats?: StatItem[];
  actions?: ReactNode;
}
export function PremiumHero({ eyebrow = 'eVoucher Platform', title, subtitle, stats, actions }: PremiumHeroProps) {
  return (
    <section className={`overflow-hidden rounded-3xl ${BRAND.heroGradient} p-6 text-white shadow-xl lg:p-8`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-1 font-headline text-xs font-semibold uppercase tracking-widest text-white/60">
            {eyebrow}
          </p>
          <h1 className="font-headline text-3xl font-bold lg:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
          {actions && <div className="mt-4">{actions}</div>}
        </div>
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="min-w-[120px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <p className="font-headline text-xl font-bold text-white">{s.value}</p>
                <p className="text-[11px] font-semibold text-white/70">{s.label}</p>
                {s.sub && <p className="text-[10px] text-white/50">{s.sub}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-headline text-xl font-bold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-success/20 bg-success/5' : 'border-border bg-white'} shadow-sm`}>
      <p className={`font-headline text-2xl font-bold ${accent ? 'text-success' : 'text-foreground'}`}>
        {value}
      </p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── ActionCard ──────────────────────────────────────────────────────────────
export function ActionCard({
  emoji,
  label,
  desc,
  gradient,
  onClick,
}: {
  emoji: string;
  label: string;
  desc?: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-2xl shadow-md transition-transform duration-300 group-hover:scale-110`}
      >
        {emoji}
      </div>
      <p className="text-center font-headline text-xs font-bold leading-tight text-foreground">
        {label}
      </p>
      {desc && (
        <p className="hidden text-center text-[10px] text-muted-foreground sm:block">{desc}</p>
      )}
    </button>
  );
}

// ─── MerchantLogo ─────────────────────────────────────────────────────────────
export function MerchantLogo({ name, src, size = 10 }: { name: string; src: string; size?: number }) {
  return (
    <div
      className={`flex h-${size} w-${size} shrink-0 items-center justify-center rounded-xl border border-border bg-white p-1 shadow-sm`}
    >
      <img
        src={src}
        alt={name}
        className="h-full w-full object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).src = PLACEHOLDER_LOGO;
        }}
      />
    </div>
  );
}

// ─── VoucherProgressBar ───────────────────────────────────────────────────────
export function VoucherProgressBar({ pct, status = 'active' }: { pct: number; status?: string }) {
  const color =
    status === 'active'
      ? 'bg-gradient-to-r from-primary to-teal-400'
      : status === 'partial'
        ? 'bg-gradient-to-r from-amber-400 to-orange-400'
        : 'bg-muted-foreground/30';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── ActivityTimeline ─────────────────────────────────────────────────────────
interface ActivityItem {
  id: string;
  merchant: string;
  typeLabel: string;
  amount: number;
  savings?: number;
  createdAt: string;
  icon?: string;
}
export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No transactions yet. Start shopping to see your activity.
      </p>
    );
  }
  return (
    <div className="relative space-y-0">
      <div className="absolute bottom-2 left-4 top-2 w-0.5 bg-border" />
      {items.map((item, i) => {
        const date = new Date(item.createdAt);
        const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
        const label =
          diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : date.toLocaleDateString('en-ZA', { weekday: 'long' });
        return (
          <div
            key={item.id}
            className={`relative flex gap-4 pb-4 ${i === items.length - 1 ? 'pb-0' : ''}`}
          >
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white text-xs font-bold text-primary">
              {item.icon ?? '✓'}
            </div>
            <div className="flex flex-1 items-start justify-between rounded-xl border border-border bg-white px-3 py-2.5 shadow-sm">
              <div>
                <p className="font-headline text-sm font-bold text-foreground">{item.merchant}</p>
                <p className="text-[11px] text-muted-foreground">
                  {item.typeLabel} · {label}
                </p>
              </div>
              <div className="text-right">
                <p className="font-headline text-sm font-semibold text-foreground">
                  R{Number(item.amount).toFixed(2)}
                </p>
                {Number(item.savings ?? 0) > 0 && (
                  <p className="text-[11px] font-semibold text-success">
                    Saved R{Number(item.savings).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SavingsStrip ─────────────────────────────────────────────────────────────
export function SavingsStrip({
  amount,
  onShop,
}: {
  amount: number;
  onShop: () => void;
}) {
  if (amount <= 0) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-success/20 bg-gradient-to-r from-success/10 to-teal-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-headline text-xs font-semibold uppercase tracking-widest text-success">
            This Month
          </p>
          <p className="font-headline text-2xl font-bold text-foreground">
            You saved R{amount.toFixed(2)} 🎉
          </p>
          <p className="text-sm text-muted-foreground">Keep shopping to increase your savings.</p>
        </div>
        <button onClick={onShop} className={BRAND.btnPrimary}>
          Shop More
        </button>
      </div>
    </section>
  );
}

// ─── LoadingSkeleton ──────────────────────────────────────────────────────────
export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-48 rounded-3xl bg-muted" />
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-muted" />
        <div className="h-64 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-error/20 bg-error/10 p-4">
      <p className="text-sm text-error">{message}</p>
    </div>
  );
}

// ─── SuccessBanner ────────────────────────────────────────────────────────────
export function SuccessBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-success/20 bg-success/10 p-3">
      <p className="text-xs text-success">{message}</p>
    </div>
  );
}

// ─── TabBar ───────────────────────────────────────────────────────────────────
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="grid rounded-xl border border-border bg-white p-1.5 shadow-sm" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-lg py-2 font-headline text-sm font-semibold capitalize transition-all ${
            active === tab.id
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active === tab.id ? 'bg-white/20' : 'bg-muted'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
