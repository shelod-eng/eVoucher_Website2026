import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GoldButton from '@/components/ui/GoldButton';
import { 
  Heart, 
  TrendingUp, 
  Users, 
  Sparkles,
  ArrowLeft,
  DollarSign,
  PieChart,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function StakeholderTipping() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipperName: '',
    tipperEmail: '',
    tipperType: 'partner',
    amount: '',
    purpose: 'platform_growth',
    message: '',
    paymentMethod: 'bank_transfer'
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['stakeholderTips'],
    queryFn: () => base44.entities.StakeholderTip.list('-created_date'),
  });

  const createTipMutation = useMutation({
    mutationFn: async (tipData) => {
      const amount = parseFloat(tipData.amount);
      
      // Allocate tip based on purpose
      let allocation = {};
      switch (tipData.purpose) {
        case 'platform_growth':
          allocation = {
            platformOperations: amount * 0.5,
            merchantSubsidies: amount * 0.2,
            consumerRewards: amount * 0.2,
            technologyInvestment: amount * 0.1
          };
          break;
        case 'merchant_support':
          allocation = {
            platformOperations: amount * 0.1,
            merchantSubsidies: amount * 0.7,
            consumerRewards: amount * 0.1,
            technologyInvestment: amount * 0.1
          };
          break;
        case 'consumer_rewards':
          allocation = {
            platformOperations: amount * 0.1,
            merchantSubsidies: amount * 0.1,
            consumerRewards: amount * 0.7,
            technologyInvestment: amount * 0.1
          };
          break;
        case 'technology_upgrade':
          allocation = {
            platformOperations: amount * 0.2,
            merchantSubsidies: amount * 0.1,
            consumerRewards: amount * 0.1,
            technologyInvestment: amount * 0.6
          };
          break;
        default:
          allocation = {
            platformOperations: amount * 0.25,
            merchantSubsidies: amount * 0.25,
            consumerRewards: amount * 0.25,
            technologyInvestment: amount * 0.25
          };
      }

      return await base44.entities.StakeholderTip.create({
        ...tipData,
        amount,
        allocationBreakdown: allocation,
        status: 'received',
        transactionReference: `TIP-${Date.now()}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stakeholderTips']);
      setShowForm(false);
      setFormData({
        tipperName: '',
        tipperEmail: '',
        tipperType: 'partner',
        amount: '',
        purpose: 'platform_growth',
        message: '',
        paymentMethod: 'bank_transfer'
      });
    }
  });

  const totalTips = tips.reduce((sum, tip) => sum + tip.amount, 0);
  const totalAllocated = tips.filter(t => t.status === 'allocated').reduce((sum, tip) => sum + tip.amount, 0);
  const platformFunds = tips.reduce((sum, tip) => sum + (tip.allocationBreakdown?.platformOperations || 0), 0);
  const merchantSubsidies = tips.reduce((sum, tip) => sum + (tip.allocationBreakdown?.merchantSubsidies || 0), 0);
  const consumerRewards = tips.reduce((sum, tip) => sum + (tip.allocationBreakdown?.consumerRewards || 0), 0);
  const techInvestment = tips.reduce((sum, tip) => sum + (tip.allocationBreakdown?.technologyInvestment || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    createTipMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('BillingEngine')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="w-8 h-8 text-pink-500" />
                Stakeholder Tipping
              </h1>
              <p className="text-gray-500">Support eVoucher's social impact mission</p>
            </div>
          </div>
          {!showForm && (
            <GoldButton onClick={() => setShowForm(true)}>
              <DollarSign className="w-4 h-4 mr-2" />
              Give a Tip
            </GoldButton>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-pink-200 bg-white/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tips Received</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-pink-600">R{totalTips.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{tips.length} contributions</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Platform Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">R{platformFunds.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Infrastructure funding</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Merchant Subsidies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">R{merchantSubsidies.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Supporting merchants</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-white/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Consumer Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">R{consumerRewards.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Community benefits</p>
            </CardContent>
          </Card>
        </div>

        {/* Tip Form */}
        {showForm && (
          <Card className="mb-6 border-pink-200 bg-white/90">
            <CardHeader>
              <CardTitle>Make a Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Your Name / Organization</label>
                    <Input
                      value={formData.tipperName}
                      onChange={(e) => setFormData({ ...formData, tipperName: e.target.value })}
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email</label>
                    <Input
                      type="email"
                      value={formData.tipperEmail}
                      onChange={(e) => setFormData({ ...formData, tipperEmail: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Stakeholder Type</label>
                    <Select value={formData.tipperType} onValueChange={(v) => setFormData({ ...formData, tipperType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="donor">Donor</SelectItem>
                        <SelectItem value="community_member">Community Member</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Amount (ZAR)</label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Purpose</label>
                    <Select value={formData.purpose} onValueChange={(v) => setFormData({ ...formData, purpose: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="platform_growth">Platform Growth</SelectItem>
                        <SelectItem value="merchant_support">Merchant Support</SelectItem>
                        <SelectItem value="consumer_rewards">Consumer Rewards</SelectItem>
                        <SelectItem value="technology_upgrade">Technology Upgrade</SelectItem>
                        <SelectItem value="community_impact">Community Impact</SelectItem>
                        <SelectItem value="general">General Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Message (Optional)</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Share why you're supporting eVoucher..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <GoldButton type="submit">
                    <Heart className="w-4 h-4 mr-2" />
                    Contribute R{formData.amount || '0'}
                  </GoldButton>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recent Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tips.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No contributions yet. Be the first to support!</p>
                </div>
              ) : (
                tips.map((tip) => (
                  <div key={tip.id} className="flex items-start justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{tip.tipperName}</h4>
                        <p className="text-sm text-gray-600 capitalize">{tip.tipperType.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500 mt-1">{moment(tip.created_date).format('MMM D, YYYY')}</p>
                        {tip.message && (
                          <p className="text-sm text-gray-700 mt-2 italic">"{tip.message}"</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-pink-600">R{tip.amount.toLocaleString()}</p>
                      <Badge className="mt-2 bg-purple-100 text-purple-800 capitalize">
                        {tip.purpose.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}