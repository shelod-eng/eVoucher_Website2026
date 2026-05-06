'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/common/Header';

type SandboxScenario = {
  key: string;
  label: string;
  paymentMethod: string;
  initialStatus: string;
  finalStatus: string;
  description: string;
  requiresAuthorization?: boolean;
  redirectFlow?: boolean;
};

type SandboxCreateResponse = {
  transactionReference: string;
  paymentMethod: string;
  status: string;
  finalStatus: string;
  checkoutUrl?: string | null;
  scenario: SandboxScenario;
  metadata?: Record<string, unknown>;
};

export default function SandboxPaymentsPage() {
  const [scenarios, setScenarios] = useState<SandboxScenario[]>([]);
  const [scenarioKey, setScenarioKey] = useState('');
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SandboxCreateResponse | null>(null);
  const [otp, setOtp] = useState('123456');
  const [authResult, setAuthResult] = useState<{ status: string; authorizedAt: string } | null>(
    null
  );

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/sandbox/scenarios', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load sandbox scenarios.');
        setScenarios(data.scenarios ?? []);
        setScenarioKey(data.scenarios?.[0]?.key ?? '');
      } catch (loadError: any) {
        setError(loadError?.message || 'Failed to load sandbox scenarios.');
      } finally {
        setLoading(false);
      }
    };

    void loadScenarios();
  }, []);

  const selectedScenario = scenarios.find((scenario) => scenario.key === scenarioKey) ?? null;

  const handleCreate = async () => {
    try {
      setProcessing(true);
      setError('');
      setResult(null);
      setAuthResult(null);
      const response = await fetch('/api/v1/sandbox/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(amount),
          paymentMethod: selectedScenario?.paymentMethod,
          scenarioKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create sandbox payment.');
      setResult(data);
    } catch (createError: any) {
      setError(createError?.message || 'Failed to create sandbox payment.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAuthorize = async () => {
    if (!result) return;
    try {
      setProcessing(true);
      setError('');
      const response = await fetch('/api/v1/sandbox/payments/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transactionReference: result.transactionReference,
          scenarioKey: result.scenario.key,
          otp,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to authorize sandbox payment.');
      setAuthResult({
        status: data.status,
        authorizedAt: data.authorizedAt,
      });
    } catch (authorizeError: any) {
      setError(authorizeError?.message || 'Failed to authorize sandbox payment.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 px-4 pb-12">
        <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Internal Sandbox
            </p>
            <h1 className="mt-3 text-3xl font-bold text-foreground">Payment Scenario Runner</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Use this page to simulate isolated payment flows without touching the production
              customer checkout path.
            </p>

            {loading ? (
              <div className="mt-8 text-sm text-muted-foreground">Loading sandbox scenarios...</div>
            ) : (
              <div className="mt-8 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Scenario</label>
                  <select
                    value={scenarioKey}
                    onChange={(event) => setScenarioKey(event.target.value)}
                    className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                  >
                    {scenarios.map((scenario) => (
                      <option key={scenario.key} value={scenario.key}>
                        {scenario.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Amount</label>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                    inputMode="decimal"
                  />
                </div>

                {selectedScenario && (
                  <div className="rounded-2xl border border-border bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{selectedScenario.label}</p>
                    <p className="mt-1">{selectedScenario.description}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div>Method: {selectedScenario.paymentMethod}</div>
                      <div>Initial Status: {selectedScenario.initialStatus}</div>
                      <div>Final Status: {selectedScenario.finalStatus}</div>
                      <div>
                        Auth Required: {selectedScenario.requiresAuthorization ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={processing || !scenarioKey}
                  className="inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processing ? 'Running Scenario...' : 'Create Sandbox Payment'}
                </button>
              </div>
            )}

            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </section>

          <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Transaction Output
            </p>
            {!result ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Run a scenario to inspect sandbox transaction behavior, checkout URL generation, and
                authorization requirements.
              </p>
            ) : (
              <div className="mt-6 space-y-4 text-sm text-slate-700">
                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <div className="font-semibold text-slate-900">
                    {result.scenario.label} - {result.status}
                  </div>
                  <div className="mt-2">Ref: {result.transactionReference}</div>
                  <div>Method: {result.paymentMethod}</div>
                  <div>Final Status: {result.finalStatus}</div>
                  <div>Checkout URL: {result.checkoutUrl || 'N/A'}</div>
                </div>

                {result.scenario.requiresAuthorization ? (
                  <div className="rounded-2xl border border-border p-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      OTP / Authorization Code
                    </label>
                    <input
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAuthorize}
                      disabled={processing}
                      className="mt-3 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processing ? 'Submitting...' : 'Authorize Scenario'}
                    </button>
                  </div>
                ) : null}

                {authResult ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    <div className="font-semibold">Authorization Result: {authResult.status}</div>
                    <div className="mt-1 text-xs">{authResult.authorizedAt}</div>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
