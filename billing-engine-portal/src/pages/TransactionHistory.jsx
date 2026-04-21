import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import BottomNav from '@/components/navigation/BottomNav';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ShoppingBag, CreditCard, ArrowDownLeft, ArrowUpRight, Gift, Users, Loader2 } from 'lucide-react';

export default function TransactionHistoryPage() {
  const [filter, setFilter] = useState('all');
  const [merchantId, setMerchantId] = useState(null);

  const { data: billingEvents = [], isLoading } = useQuery({
    queryKey: ['billing-events', merchantId],
    queryFn: async () => {
      try {
        const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL || import.meta.env.VITE_PORTAL_API_BASE_URL || 'http://localhost:3000';
        const url = new URL(`${mainAppUrl}/api/billing/events`);
        if (merchantId) {
          url.searchParams.append('merchantId', merchantId);
        }
        
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Failed to fetch billing events: ${response.status}`);
        }
        
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        console.error('[TransactionHistory] Error fetching billing events:', error);
        return [];
      }
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
  });

  const filteredTransactions = filter === 'all' 
    ? billingEvents 
    : billingEvents.filter(e => e.event_type === filter);

  const getIcon = (eventType) => {
    switch(eventType) {
      case 'payment_transaction': return <ShoppingBag className="w-5 h-5 text-purple-500" />;
      case 'voucher_redemption': return <CreditCard className="w-5 h-5 text-orange-500" />;
      case 'manual_adjustment': return <ArrowDownLeft className="w-5 h-5 text-blue-500" />;
      default: return <CreditCard className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBgColor = (eventType) => {
    switch(eventType) {
      case 'payment_transaction': return 'bg-purple-100';
      case 'voucher_redemption': return 'bg-orange-100';
      case 'manual_adjustment': return 'bg-blue-100';
      default: return 'bg-gray-100';
    }
  };

  const getEventLabel = (eventType) => {
    switch(eventType) {
      case 'payment_transaction': return 'Purchase';
      case 'voucher_redemption': return 'Redemption';
      case 'manual_adjustment': return 'Adjustment';
      default: return eventType;
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'payment_transaction', label: 'Purchases' },
    { id: 'voucher_redemption', label: 'Redemptions' },
  ];

  return (
    <MobileContainer>
      <div className="pb-24">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-6 px-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Profile')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">Transaction History</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-[#00A89D] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#00A89D] animate-spin" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card className="bg-gray-50 rounded-xl p-8 text-center border-0">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No billing events found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((event) => (
                <Card key={event.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${getBgColor(event.event_type)} flex items-center justify-center`}>
                        {getIcon(event.event_type)}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">
                          {getEventLabel(event.event_type)} 
                          {event.metadata?.voucherCode ? ` - ${event.metadata.voucherCode}` : ''}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(event.occurred_at).toLocaleDateString('en-ZA', { 
                            day: 'numeric', 
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        R{Number(event.gross_amount ?? 0).toFixed(2)}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Recorded
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav activePage="Profile" />
    </MobileContainer>
  );
}