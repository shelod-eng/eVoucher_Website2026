'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation'; // Corrected import for useRouter
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { AuthChangeEvent, Session } from '@supabase/supabase-js'; // Import AuthChangeEvent and Session types

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Supabase Auth needs a moment to process the URL hash with the access_token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthReady(true);
      } else if (event === 'SIGNED_OUT') {
        // If user signs out before setting password, they'll need to restart
        setMessage({ type: 'error', text: 'Session expired or invalid. Please request a new reset link.' });
        setIsAuthReady(false);
      }
    });

    // Initial check in case the session is already set from the URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthReady(true);
      } else {
        setMessage({ type: 'error', text: 'Invalid or expired reset link. Please request a new one.' });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully! Redirecting to login...' });
      
      // Redirect to merchant login after successful update
      setTimeout(() => {
        router.push('/merchant/login'); // Or a generic /login page
      }, 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.16),_transparent_50%),#f4fbfa]">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-border">
          <div className="text-center mb-8">
            <Icon name="LockClosedIcon" size={32} variant="solid" className="text-primary mx-auto mb-4" />
            <h1 className="font-headline font-bold text-3xl text-foreground mb-2">Set New Password</h1>
            <p className="text-muted-foreground font-body">Enter your new password below.</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {isAuthReady ? (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-headline font-semibold text-foreground mb-2">New Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 font-body" placeholder="••••••••" />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-headline font-semibold text-foreground mb-2">Confirm New Password</label>
                <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 font-body" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          ) : (
            <div className="text-center text-muted-foreground font-body">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
              <p>Loading reset link...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}