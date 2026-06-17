'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import bcrypt from 'bcryptjs';

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClientComponentClient();

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setIsLoading(false);
      return;
    }

    try {
      const tableName = userType === 'consumer' ? 'users' : 'merchants';
      
      // Requirement: Hash the password for custom table updates
      // For standard Supabase Auth, updateUser handles hashing internally
      const hashedPassword = await bcrypt.hash(password, 10);

      const { error } = await supabase
        .from(tableName)
        .update({ password: hashedPassword })
        .eq('email', email);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully.' });
      
      // Close modal after showing success state
      setTimeout(() => {
        onClose();
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setMessage(null);
      }, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative border border-slate-100 animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0A1F44]">Reset Password</h2>
            <p className="text-slate-500 mt-1">Enter your details to update your {userType} password</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:border-transparent transition-all"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className={`p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#0A1F44] text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2 active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}