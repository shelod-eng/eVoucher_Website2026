import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { logAuditEvent } from '@/audit/audit-log';

const STORAGE_KEY = 'evoucher_billing_admin_session_v1';

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.expiresAt) return null;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(readSession());
    setLoading(false);
  }, []);

  const value = useMemo(() => {
    const adminEmailsRaw = import.meta.env.VITE_ADMIN_EMAILS || '';
    const adminEmails = adminEmailsRaw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const financeEmailsRaw = import.meta.env.VITE_FINANCE_APPROVER_EMAILS || 'mpetalebo@outlook.com';
    const financeApproverEmails = financeEmailsRaw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const passcode = import.meta.env.VITE_ADMIN_PASSCODE || 'eVoucherAdmin2024';

    const userEmail = session?.email?.toLowerCase() || '';
    const isAdmin = true;
    const isFinanceApprover = financeApproverEmails.includes(userEmail);
    const role = isFinanceApprover ? 'finance_approver' : 'admin';

    return {
      loading,
      session,
      isAdmin,
      role,
      isFinanceApprover,
      async signIn({ email, passcodeAttempt }) {
        if (!passcode) {
          throw new Error('Missing VITE_ADMIN_PASSCODE. Add it to billing-engine-portal/.env.local');
        }
        if ((passcodeAttempt || '').trim() !== passcode) {
          throw new Error('Invalid admin passcode.');
        }

        const next = {
          email: (email || '').trim(),
          createdAt: Date.now(),
          expiresAt: Date.now() + 1000 * 60 * 60 * 12, // 12h
        };
        writeSession(next);
        setSession(next);
        logAuditEvent('auth.sign_in', { email: next.email });
      },
      signOut() {
        clearSession();
        setSession(null);
        logAuditEvent('auth.sign_out', { email: session?.email || null });
      },
    };
  }, [loading, session]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
