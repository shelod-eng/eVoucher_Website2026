'use client';

import { useMemo, useState } from 'react';

type UssdApiResponse = {
  success?: boolean;
  action?: 'CON' | 'END';
  message?: string;
  state?: string;
  error?: string;
};

type TranscriptEntry = {
  id: string;
  from: 'user' | 'ussd';
  text: string;
  action?: 'CON' | 'END';
};

function createSessionId() {
  return `sim-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export default function UssdConsolePage() {
  const [msisdn, setMsisdn] = useState('27780589029');
  const [sessionId, setSessionId] = useState(createSessionId());
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [lastState, setLastState] = useState<string>('WELCOME');
  const [lastAction, setLastAction] = useState<'CON' | 'END' | ''>('');
  const [copied, setCopied] = useState(false);

  const quickKeys = useMemo(() => ['1', '2', '3', '4', '5', '8', '9', '0'], []);
  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/ussd-console` : '';
  const qrUrl = currentUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}`
    : '';
  const lastUssdMessage = [...transcript].reverse().find((entry) => entry.from === 'ussd')?.text;

  async function sendToSimulator(inputText: string) {
    if (!msisdn.trim()) return;
    if (inputText !== '' && !sessionStarted) return;

    setLoading(true);
    setTranscript((current) => [
      ...current,
      {
        id: `u-${Date.now()}-${Math.random()}`,
        from: 'user',
        text: inputText === '' ? '[Dial / Start]' : inputText,
      },
    ]);

    try {
      const response = await fetch('/api/v1/ussd/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          msisdn,
          text: inputText,
        }),
      });

      const payload = (await response.json()) as UssdApiResponse;
      const message = payload.message ?? payload.error ?? 'No response';
      const action = payload.action;

      setLastState(payload.state ?? '');
      setLastAction(action ?? '');
      if (!sessionStarted) setSessionStarted(true);

      setTranscript((current) => [
        ...current,
        {
          id: `s-${Date.now()}-${Math.random()}`,
          from: 'ussd',
          text: message,
          action,
        },
      ]);
    } catch (error: any) {
      setTranscript((current) => [
        ...current,
        {
          id: `e-${Date.now()}-${Math.random()}`,
          from: 'ussd',
          text: error?.message ?? 'Failed to call USSD simulator',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startNewSession() {
    setSessionId(createSessionId());
    setTranscript([]);
    setLastState('WELCOME');
    setLastAction('');
    setCustomInput('');
    setSessionStarted(false);
  }

  async function copyConsoleLink() {
    if (!currentUrl || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">USSD Console (Simulator)</h1>
          <p className="mt-2 text-sm text-slate-600">
            Test eVoucher USSD flow visually before MTN/Vodacom aggregator go-live. Fully mobile
            friendly for demos.
          </p>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Open on Mobile</h2>
            <p className="mt-1 text-sm text-slate-600">
              Scan QR from your phone to open this simulator instantly.
            </p>
            <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="USSD console QR code"
                  className="h-32 w-32 rounded-lg border border-slate-200"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-slate-200 text-xs text-slate-500">
                  QR loading...
                </div>
              )}
              <div className="w-full max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Link</p>
                <p className="mt-1 break-all rounded-md bg-slate-50 p-2 text-xs text-slate-700">
                  {currentUrl || 'Open this page in browser to generate link'}
                </p>
                <button
                  type="button"
                  onClick={copyConsoleLink}
                  className="mt-3 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                >
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Feature Phone Preview</h2>
            <div className="mt-3 rounded-xl border bg-[#53d17a] p-3 text-[#08120c] shadow-inner">
              <div className="border-b border-[#1d3f2a] pb-2 text-center text-xs font-bold tracking-[0.2em]">
                *120*384#
              </div>
              <pre className="mt-3 min-h-[210px] whitespace-pre-wrap text-[13px] leading-6">
                {lastUssdMessage ||
                  `Welcome to eVoucher

1. Register
2. Login / Continue
3. Shop
4. Wallet
5. Redeem
0. Exit`}
              </pre>
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Session Controls</h2>

            <label className="mt-4 block text-sm font-medium text-slate-700">MSISDN</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              value={msisdn}
              onChange={(event) => setMsisdn(event.target.value)}
              placeholder="27780589029"
            />

            <label className="mt-4 block text-sm font-medium text-slate-700">Session ID</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
            />

            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <div>
                <span className="font-semibold">Session Started:</span>{' '}
                {sessionStarted ? 'Yes' : 'No'}
              </div>
              <div className="mt-1">
                <span className="font-semibold">State:</span> {lastState || '-'}
              </div>
              <div className="mt-1">
                <span className="font-semibold">Action:</span> {lastAction || '-'}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => sendToSimulator('')}
                disabled={loading}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Start / Dial
              </button>
              <button
                onClick={startNewSession}
                disabled={loading}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                New Session
              </button>
            </div>

            <h3 className="mt-6 text-sm font-semibold text-slate-800">Quick Keys</h3>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {quickKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => sendToSimulator(key)}
                  disabled={loading || !sessionStarted}
                  className="rounded-lg border border-slate-300 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {key}
                </button>
              ))}
            </div>
            {!sessionStarted && (
              <p className="mt-2 text-xs text-amber-600">Tap Start / Dial to enable keys.</p>
            )}

            <h3 className="mt-6 text-sm font-semibold text-slate-800">Custom Input</h3>
            <div className="mt-2 flex gap-2">
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                value={customInput}
                onChange={(event) => setCustomInput(event.target.value)}
                placeholder="Voucher code or menu input"
              />
              <button
                onClick={() => {
                  const text = customInput.trim();
                  if (!text) return;
                  setCustomInput('');
                  sendToSimulator(text);
                }}
                disabled={loading || !sessionStarted}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Live Transcript</h2>
            <div className="mt-4 h-[500px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 sm:h-[580px]">
              {transcript.length === 0 ? (
                <p className="text-sm text-slate-500">No activity yet. Click Start / Dial.</p>
              ) : (
                <div className="space-y-3">
                  {transcript.map((entry) => (
                    <div
                      key={entry.id}
                      className={`max-w-[92%] rounded-lg px-3 py-2 text-sm ${
                        entry.from === 'user'
                          ? 'ml-auto bg-teal-600 text-white'
                          : 'mr-auto border border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      <div className="mb-1 text-[11px] font-semibold opacity-80">
                        {entry.from === 'user'
                          ? 'You'
                          : `USSD${entry.action ? ` (${entry.action})` : ''}`}
                      </div>
                      <pre className="whitespace-pre-wrap font-sans">{entry.text}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
