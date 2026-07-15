"use client";

import { useState } from 'react';

type UssdResponse = {
  success?: boolean;
  action?: 'CON' | 'END';
  message?: string;
  state?: string;
  error?: string;
};

export default function UssdVerifyPage() {
  const [provider, setProvider] = useState('simulator');
  const [msisdn, setMsisdn] = useState('27780589029');
  const [serviceCode, setServiceCode] = useState('');
  const [networkCode, setNetworkCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UssdResponse | null>(null);

  async function submit() {
    if (!msisdn.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const resp = await fetch('/api/v1/ussd/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `web-${Date.now()}`,
          msisdn: msisdn.trim(),
          provider: provider.trim(),
          serviceCode: serviceCode.trim() || undefined,
          networkCode: networkCode.trim() || undefined,
          text: '',
        }),
      });

      const payload = (await resp.json()) as UssdResponse;
      setResult(payload);
    } catch (err: any) {
      setResult({ success: false, error: String(err?.message ?? err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <main className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-3">USSD: Provider + MSISDN Verify</h1>

        <label className="block text-sm font-medium text-slate-700">Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="mt-1 mb-3 w-full rounded-md border px-3 py-2"
        >
          <option value="simulator">Simulator</option>
          <option value="twilio">Twilio</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <label className="block text-sm font-medium text-slate-700">MSISDN</label>
        <input
          value={msisdn}
          onChange={(e) => setMsisdn(e.target.value)}
          placeholder="e.g. 27780589029"
          className="mt-1 mb-3 w-full rounded-md border px-3 py-2"
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Network Code</label>
            <input
              value={networkCode}
              onChange={(e) => setNetworkCode(e.target.value)}
              placeholder="optional"
              className="mt-1 mb-3 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Service Code</label>
            <input
              value={serviceCode}
              onChange={(e) => setServiceCode(e.target.value)}
              placeholder="optional"
              className="mt-1 mb-3 w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={loading}
            className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Verify MSISDN'}
          </button>
        </div>

        {result && (
          <div className="mt-6 rounded border bg-slate-50 p-3">
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  );
}
