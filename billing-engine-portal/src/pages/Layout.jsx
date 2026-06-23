
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/auth/admin-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Layout({ children }) {
  const { session, signOut } = useAdminAuth();
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const showBillingNav =
    path.startsWith('/billingengine') ||
    path.startsWith('/settlementpayouts') ||
    path.startsWith('/transactionhistory') ||
    path.startsWith('/voucherledger') ||
    path.startsWith('/auditlog') ||
    path.startsWith('/userroles') ||
    path.startsWith('/banklinkage') ||
    path.startsWith('/bankserv') ||
    path.startsWith('/logistics') ||
    path.startsWith('/bulkupload') ||
    path.startsWith('/controls');

  return (
    <div className="min-h-screen bg-[#06182d] text-white">
      <style>{`
        :root {
          --background: 214 60% 10%;
          --foreground: 0 0% 100%;
          --card: 215 55% 14%;
          --card-foreground: 0 0% 100%;
          --popover: 215 55% 14%;
          --popover-foreground: 0 0% 100%;
          --primary: 174 62% 47%;
          --primary-foreground: 0 0% 100%;
          --secondary: 215 35% 18%;
          --secondary-foreground: 0 0% 100%;
          --muted: 215 35% 18%;
          --muted-foreground: 210 15% 70%;
          --accent: 174 62% 47%;
          --accent-foreground: 0 0% 100%;
          --destructive: 0 62% 50%;
          --destructive-foreground: 0 0% 100%;
          --border: 215 30% 22%;
          --input: 215 30% 22%;
          --ring: 174 62% 47%;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #E5E7EB transparent;
        }
        
        *::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 4px;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        input, textarea, select {
          font-size: 16px !important;
        }
      `}</style>

      <div className="bg-gradient-to-r from-[#06182d] via-[#0b2b53] to-[#06182d] px-6 py-4 flex items-center gap-4 text-white border-b border-white/10">
        <div className="flex items-center gap-3 font-bold">
          <div className="w-9 h-9 bg-[#00A89D] rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
            <span className="text-xs font-black">EV</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">Billing Engine</span>
              <Badge className="bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                System Operational
              </Badge>
            </div>
            <div className="text-xs text-blue-100/70">eVoucher Financial Operations Centre</div>
          </div>
        </div>

        <div className="h-5 w-px bg-white/20" />

        <nav className="flex gap-2 text-sm">
          <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/BillingEngine">
            Dashboard
          </Link>
          <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/TechSpec">
            Tech Spec
          </Link>
          <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/AuditLog">
            Audit Log
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {session?.email ? (
            <span className="text-xs text-blue-100">Admin: {session.email}</span>
          ) : null}
          {session ? (
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          ) : null}
        </div>
      </div>

      {showBillingNav ? (
        <div className="px-6 pt-4">
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm min-w-max">
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/BillingEngine">Overview</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/BillingEngine?tab=invoices">Invoices</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/SettlementPayouts">Settlements</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/VoucherLedger">Voucher Ledger</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/BankLinkage">Bank Linkage</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/BankServ">BankServ</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/Logistics">Logistics</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/SettlementPayouts?tab=reconciliation">Reconciliation</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/BulkUpload">Bulk Upload</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/AuditLog">Audit Log</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/UserRoles">User Roles</Link>
              <Link className="px-3 py-1 rounded-lg hover:bg-white/10" to="/Controls">Controls</Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="px-6 py-6">{children}</div>
    </div>
  );
}
