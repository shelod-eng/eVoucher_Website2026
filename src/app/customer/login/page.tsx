'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/customer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="UserCircleIcon" size={32} variant="solid" className="text-primary" />
              </div>
              <h1 className="font-headline font-bold text-3xl text-foreground mb-2">Customer Portal</h1>
              <p className="text-muted-foreground font-body">Sign in to access your vouchers</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start space-x-3">
                <Icon name="ExclamationCircleIcon" size={20} variant="solid" className="text-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error font-body">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-headline font-semibold text-foreground mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 font-body"
                  placeholder="thandi@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-headline font-semibold text-foreground mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 font-body"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground font-body">
                Don't have an account?{' '}
                <Link href="/" className="text-primary font-semibold hover:underline">
                  Join now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}