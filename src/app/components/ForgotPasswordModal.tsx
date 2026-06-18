'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X, Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'consumer' | 'merchant';
}

/**
 * ForgotPasswordModal provides a secure interface for password resets.
 * It handles both Supabase Auth-managed users and custom table-based users.
 */
export default function ForgotPasswordModal({ isOpen, onClose, userType }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const supabase = createClientComponentClient();

  if (!isOpen) return null; // Only render if open

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password reset link sent! Check your email inbox.' });
      
      // Close modal after showing success state
      setTimeout(() => {
        onClose();
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setMessage(null);
      }, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send reset link.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A1F44]/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden relative border border-slate-100 animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-10">
          <div className="mb-8">
            <h2 className="text-[24px] font-bold text-[#0A1F44] leading-tight">Secure Password Reset</h2>
            <p className="text-[16px] text-[#4A4A4A] mt-2 font-normal leading-relaxed">
              Enter your registered email below. We'll send you a secure link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSendResetLink} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A1F44]">Account Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:border-transparent transition-all placeholder:text-slate-300"
                placeholder="e.g. j.doe@example.co.za"
              />
            </div>

            {message && (
              <div className={`p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : (message.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-red-50 text-red-700 border border-red-100')
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : (message.type === 'info' ? <Mail className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />)}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-[#00BFA5] to-[#0A1F44] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4 active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Secure. Verified. Bank-Grade Encryption.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}