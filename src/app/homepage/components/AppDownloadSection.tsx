'use client';

const APK_URL =
  process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL ||
  'https://github.com/shelod-eng/eVoucher_Website2026/releases/download/v1.0.0/eVoucher_APK_Version1_16-June2026.apk';

export default function AppDownloadSection() {
  return (
    <section className="bg-white py-20 border-y border-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Content and Badges */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#00BFA5]/10 text-[#00BFA5] rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00BFA5] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00BFA5]"></span>
                </span>
                <span>Verified Build v1.0.0</span>
              </div>
              <h2 className="text-2xl font-bold text-[#0A1F44]">Take eVoucher with you</h2>
              <p className="text-base font-normal text-[#4A4A4A] leading-relaxed max-w-lg">
                Experience the full power of South Africa&apos;s digital voucher infrastructure on
                your mobile device. Secure, lightweight, and optimized for low-bandwidth
                environments.
              </p>
            </div>

            {/* Compliance Badges Area */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100">
              {['POPIA', 'SARB', 'FIC'].map((acronym) => (
                <div key={acronym} className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00BFA5]" />
                  <span className="text-[11px] font-bold text-[#0A1F44] tracking-widest uppercase">
                    {acronym}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Panels */}
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Android Fintech Card */}
              <div className="space-y-3">
                <a
                  href={APK_URL}
                  download="eVoucher_SouthAfrica_v1.apk"
                  className="flex items-center justify-center gap-4 px-6 py-4 bg-gradient-to-br from-[#00BFA5] to-[#0A1F44] text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98] border border-white/10 group"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                    <path d="M17.523 15.3414C17.067 15.3414 16.697 14.9714 16.697 14.5154C16.697 14.0594 17.067 13.6894 17.523 13.6894C17.979 13.6894 18.349 14.0594 18.349 14.5154C18.349 14.9714 17.979 15.3414 17.523 15.3414ZM6.477 15.3414C6.021 15.3414 5.651 14.9714 5.651 14.5154C5.651 14.0594 6.021 13.6894 6.477 13.6894C6.933 13.6894 7.303 14.0594 7.303 14.5154C7.303 14.9714 6.933 15.3414 6.477 15.3414ZM17.935 11.2334L19.782 8.03342C19.912 7.80842 19.835 7.52042 19.61 7.39042C19.385 7.26042 19.097 7.33742 18.967 7.56242L17.085 10.8224C15.631 10.1614 13.911 9.79142 12 9.79142C10.089 9.79142 8.369 10.1614 6.915 10.8224L5.033 7.56242C4.903 7.33742 4.615 7.26042 4.39 7.39042C4.165 7.26042 4.088 7.80842 4.218 8.03342L6.065 11.2334C3.041 12.8714 1 15.9314 1 19.5014H23C23 15.9314 20.959 12.8714 17.935 11.2334Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider opacity-80 font-bold leading-tight">
                      Get it for
                    </div>
                    <div className="text-base">Android</div>
                  </div>
                </a>
                <p className="text-[10px] text-[#4A4A4A] text-center italic opacity-70">
                  Direct APK side-load
                </p>
              </div>

              {/* iOS Clean Panel */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-4 px-6 py-4 bg-white border border-slate-200 text-[#0A1F44] rounded-xl font-semibold shadow-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#0A1F44]">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.97 9.1 22C7.79 22.03 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider opacity-60 font-bold leading-tight">
                      Install for
                    </div>
                    <div className="text-base">Apple iOS</div>
                  </div>
                </div>
                <p className="text-[10px] text-[#4A4A4A] text-center italic opacity-70">
                  Add to Home Screen
                </p>
              </div>
            </div>

            {/* Bottom Fintech Status Line */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">
                  TestFlight Beta: In Review
                </span>
              </div>
              <span className="text-[9px] text-[#4A4A4A] font-bold uppercase tracking-[0.2em] opacity-60">
                Secure. Verified. Bank-Grade Encryption.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
