'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';

interface Merchant {
  id: string;
  business_name: string;
  status: string;
  onboarding_fee_paid: boolean;
  charity_donation_amount: number;
  default_total_discount_pct: number;
  created_at: string;
  approved_at: string | null;
  email: string;
  phone: string;
  bank_name: string | null;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  payout_date: string | null;
  created_at: string;
}

export default function MerchantDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/merchant/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      void fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/v1/merchant/dashboard', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load merchant dashboard');
      }
      setMerchant(data.merchant || null);
      setPayouts(data.payouts || []);
    } catch (dashboardError: any) {
      setError(dashboardError?.message || 'Failed to load merchant dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/merchant/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/10';
      case 'approved':
        return 'text-primary bg-primary/10';
      case 'pending':
        return 'text-warning bg-warning/10';
      case 'suspended':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const totalPayouts = payouts.reduce((sum, payout) => sum + Number(payout.amount), 0);
  const pendingPayouts = payouts
    .filter((payout) => payout.status === 'pending')
    .reduce((sum, payout) => sum + Number(payout.amount), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-muted rounded-2xl" />
              <div className="grid md:grid-cols-3 gap-6">
                <div className="h-48 bg-muted rounded-2xl" />
                <div className="h-48 bg-muted rounded-2xl" />
                <div className="h-48 bg-muted rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-primary/5">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-headline font-bold text-3xl lg:text-4xl text-foreground mb-2">
                {merchant?.business_name || 'Merchant Dashboard'}
              </h1>
              <p className="text-muted-foreground font-body">
                Safe outputs only: onboarding status and payout status.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-6 py-3 bg-card border border-border rounded-lg font-headline font-semibold hover:bg-muted transition-all duration-300"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={20} variant="outline" />
              <span>Sign Out</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error font-body">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Icon name="CheckBadgeIcon" size={24} variant="solid" className="text-secondary" />
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-headline font-semibold ${getStatusColor(merchant?.status || 'pending')}`}
                >
                  {merchant?.status?.toUpperCase()}
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-body mb-1">Onboarding Status</p>
              <p className="text-2xl font-headline font-bold text-foreground capitalize">{merchant?.status}</p>
            </div>

            <div className="bg-gradient-to-br from-success to-success/80 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Icon name="BanknotesIcon" size={32} variant="solid" className="opacity-80" />
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon name="ArrowTrendingUpIcon" size={24} variant="outline" />
                </div>
              </div>
              <p className="text-sm opacity-90 mb-1">Total Paid Out</p>
              <p className="text-4xl font-headline font-bold">R{totalPayouts.toFixed(2)}</p>
            </div>

            <div className="bg-gradient-to-br from-warning to-warning/80 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Icon name="ClockIcon" size={32} variant="solid" className="opacity-80" />
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon name="CurrencyDollarIcon" size={24} variant="outline" />
                </div>
              </div>
              <p className="text-sm opacity-90 mb-1">Pending Payouts</p>
              <p className="text-4xl font-headline font-bold">R{pendingPayouts.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline font-bold text-2xl text-foreground">Business Details</h2>
                <Icon name="BuildingStorefrontIcon" size={24} variant="solid" className="text-secondary" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-body text-muted-foreground">Business Name</span>
                  <span className="font-headline font-semibold text-foreground">{merchant?.business_name}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-body text-muted-foreground">Onboarding Fee</span>
                  <div className="flex items-center space-x-2">
                    {merchant?.onboarding_fee_paid ? (
                      <>
                        <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success" />
                        <span className="font-headline font-semibold text-success">Paid</span>
                      </>
                    ) : (
                      <span className="font-headline font-semibold text-warning">Pending</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-body text-muted-foreground">Charity Contribution</span>
                  <span className="font-headline font-semibold text-foreground">
                    R{Number(merchant?.charity_donation_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-body text-muted-foreground">Default Discount Budget</span>
                  <span className="font-headline font-semibold text-foreground">
                    {Number(merchant?.default_total_discount_pct || 5).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-body text-muted-foreground">Member Since</span>
                  <span className="font-headline font-semibold text-foreground">
                    {merchant?.created_at ? new Date(merchant.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline font-bold text-2xl text-foreground">Payout Status</h2>
                <Icon name="BanknotesIcon" size={24} variant="solid" className="text-success" />
              </div>

              <div className="space-y-4">
                {payouts.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="BanknotesIcon" size={48} variant="outline" className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-body">No payouts yet</p>
                  </div>
                ) : (
                  payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            payout.status === 'completed' ? 'bg-success/10' : 'bg-warning/10'
                          }`}
                        >
                          <Icon
                            name={payout.status === 'completed' ? 'CheckCircleIcon' : 'ClockIcon'}
                            size={20}
                            variant="solid"
                            className={payout.status === 'completed' ? 'text-success' : 'text-warning'}
                          />
                        </div>
                        <div>
                          <p className="font-headline font-semibold text-foreground capitalize">{payout.status}</p>
                          <p className="text-sm text-muted-foreground font-body">
                            {payout.payout_date ? new Date(payout.payout_date).toLocaleDateString() : 'Processing'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-headline font-bold text-lg text-foreground">
                          R{Number(payout.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground font-body">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
