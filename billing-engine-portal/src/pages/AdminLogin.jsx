import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/auth/admin-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, session, isAdmin, signOut } = useAdminAuth();

  const from = useMemo(() => location.state?.from || '/BillingEngine', [location.state]);

  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn({ email, passcodeAttempt: passcode });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>eVoucher Billing Admin</CardTitle>
          <p className="text-sm text-gray-600">
            Sign in to access the billing engine portal.
          </p>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="mb-4 rounded-md border bg-white p-3">
              <p className="text-sm text-gray-700">
                Signed in as <span className="font-medium">{session.email}</span>.
              </p>
              {isAdmin ? (
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => navigate('/BillingEngine')}>Go to Dashboard</Button>
                  <Button variant="secondary" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-red-600 mt-2">
                  This email is not in <code className="font-mono">VITE_ADMIN_EMAILS</code>.
                </p>
              )}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Admin passcode</label>
              <Input
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode"
                type="password"
                autoComplete="current-password"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Set this in <code className="font-mono">billing-engine-portal/.env.local</code> as{' '}
                <code className="font-mono">VITE_ADMIN_PASSCODE</code>.
              </p>
            </div>

            {error ? (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {error}
              </div>
            ) : null}

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
