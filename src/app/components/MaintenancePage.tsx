import React from 'react';
import Image from 'next/image';

export default function MaintenancePage() {
  return (
    <main className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex flex-col justify-between p-6 sm:p-8 md:p-12 relative overflow-hidden">
      {/* Background Decorative Glow Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Branding */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 overflow-hidden rounded-xl bg-slate-800/80 border border-white/10 p-1.5 shadow-lg flex items-center justify-center">
            <Image
              src="/assets/images/branding/evoucher-logo.png"
              alt="eVoucher Logo"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-headline font-bold text-lg sm:text-xl tracking-tight text-white">
            eVoucher
          </span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          Maintenance Mode
        </div>
      </header>

      {/* Main Content Area */}
      <section className="my-auto py-12 flex flex-col items-center text-center z-10 max-w-3xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl w-full">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm font-semibold tracking-wide">
            eVoucher Digital Platform
          </div>

          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            We&apos;re Currently Under Construction
          </h1>

          <div className="space-y-4 text-slate-300 text-base sm:text-lg leading-relaxed font-body max-w-2xl mx-auto">
            <p>
              The eVoucher Digital Platform is currently offline while we complete a scheduled
              maintenance and transition process.
            </p>
            <p>We are taking this time to prepare and enhance the platform for its next phase.</p>
            <p>
              We appreciate your patience and understanding and look forward to welcoming you back
              soon.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-slate-400 font-medium text-sm sm:text-base">
              Thank you for your continued interest in eVoucher.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Copyright */}
      <footer className="w-full max-w-5xl mx-auto text-center z-10 text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} eVoucher Digital Platform. All rights reserved.</p>
      </footer>
    </main>
  );
}
