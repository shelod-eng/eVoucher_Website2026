import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GoldButton from '@/components/ui/GoldButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, 
  TrendingUp, DollarSign, FileCheck, Search, Flag, Eye, Link2
} from 'lucide-react';
import moment from 'moment';

export default function ReconciliationTool({ ledgerEntries, settlements }) {
  const queryClient = useQueryClient();
  const [reconciling, setReconciling] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [discrepancyDialog, setDiscrepancyDialog] = useState(false);
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Automatic matching algorithm
  const matchedItems = useMemo(() => {
    const matches = [];
    const unmatched = [];
    
    settlements
      .filter(s => s.status === 'paid')
      .forEach(settlement => {
        // Find matching ledger entry (posted payout)
        const matchingLedger = ledgerEntries.find(entry => 
          entry.entryType === 'merchant_payout_posted' &&
          entry.merchantId === settlement.merchantId &&
          Math.abs(entry.amount - settlement.amount) < 0.01 &&
          moment(entry.created_date).isSame(moment(settlement.settlementDate), 'day')
        );
        
        if (matchingLedger) {
          matches.push({
            settlement,
            ledgerEntry: matchingLedger,
            status: settlement.reconciled ? 'reconciled' : 'matched',
            confidence: 'high'
          });
        } else {
          // Try fuzzy matching (same merchant, similar amount, within 3 days)
          const fuzzyMatch = ledgerEntries.find(entry =>
            entry.entryType === 'merchant_payout_posted' &&
            entry.merchantId === settlement.merchantId &&
            Math.abs(entry.amount - settlement.amount) < 10 &&
            Math.abs(moment(entry.created_date).diff(moment(settlement.settlementDate), 'days')) <= 3
          );
          
          if (fuzzyMatch) {
            matches.push({
              settlement,
              ledgerEntry: fuzzyMatch,
              status: settlement.reconciled ? 'reconciled' : 'fuzzy_match',
              confidence: 'medium',
              discrepancy: Math.abs(settlement.amount - fuzzyMatch.amount)
            });
          } else {
            unmatched.push({
              settlement,
              status: 'unmatched',
              confidence: 'low'
            });
          }
        }
      });
    
    return { matches, unmatched };
  }, [ledgerEntries, settlements]);
  
  // Calculate reconciliation status
  const reconciliationData = useMemo(() => {
    const liabilities = ledgerEntries
      .filter(e => e.entryType === 'merchant_payout_liability')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const posted = ledgerEntries
      .filter(e => e.entryType === 'merchant_payout_posted')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const settled = settlements
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + s.amount, 0);
    
    const platformRevenue = ledgerEntries
      .filter(e => e.entryType === 'platform_revenue')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const consumerPayments = ledgerEntries
      .filter(e => e.entryType === 'consumer_payment')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const discrepancy = Math.abs((liabilities - posted) - (settled || 0));
    const isBalanced = discrepancy < 0.01; // Allow for rounding
    
    return {
      liabilities,
      posted,
      settled,
      platformRevenue,
      consumerPayments,
      discrepancy,
      isBalanced,
      totalMatched: matchedItems.matches.filter(m => m.status === 'reconciled').length,
      totalUnmatched: matchedItems.unmatched.length,
      totalFuzzyMatch: matchedItems.matches.filter(m => m.status === 'fuzzy_match').length,
      totalAwaitingReconciliation: matchedItems.matches.filter(m => m.status === 'matched').length
    };
  }, [ledgerEntries, settlements, matchedItems]);
  
  const reconcileMutation = useMutation({
    mutationFn: async (settlementId) => {
      await base44.entities.Settlement.update(settlementId, {
        reconciled: true,
        reconciledDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settlements']);
    }
  });
  
  const flagDiscrepancyMutation = useMutation({
    mutationFn: async ({ settlementId, note }) => {
      await base44.entities.Settlement.update(settlementId, {
        status: 'failed',
        notes: note
      });
      
      // Create a ledger entry for the discrepancy
      await base44.entities.LedgerEntry.create({
        entryType: 'merchant_payout_liability',
        amount: selectedItem.settlement.amount,
        merchantId: selectedItem.settlement.merchantId,
        merchantName: selectedItem.settlement.merchantName,
        reference: `DISCREPANCY-${settlementId}`,
        description: `Flagged discrepancy: ${note}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settlements']);
      queryClient.invalidateQueries(['allLedger']);
      setDiscrepancyDialog(false);
      setDiscrepancyNote('');
      setSelectedItem(null);
    }
  });
  
  const handleReconcile = async (settlementId) => {
    await reconcileMutation.mutateAsync(settlementId);
  };
  
  const handleFlagDiscrepancy = () => {
    if (!selectedItem || !discrepancyNote.trim()) return;
    flagDiscrepancyMutation.mutate({
      settlementId: selectedItem.settlement.id,
      note: discrepancyNote
    });
  };
  
  // Filter items based on search
  const filteredMatches = matchedItems.matches.filter(item =>
    item.settlement.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.settlement.transactionReference?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredUnmatched = matchedItems.unmatched.filter(item =>
    item.settlement.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.settlement.transactionReference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Dashboard View */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 p-4 text-white">
          <CheckCircle2 className="w-6 h-6 mb-2" />
          <p className="text-2xl font-bold">{reconciliationData.totalMatched}</p>
          <p className="text-xs text-white/80">Reconciled</p>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 p-4 text-white">
          <Link2 className="w-6 h-6 mb-2" />
          <p className="text-2xl font-bold">{reconciliationData.totalAwaitingReconciliation}</p>
          <p className="text-xs text-white/80">Auto-Matched</p>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 p-4 text-white">
          <AlertTriangle className="w-6 h-6 mb-2" />
          <p className="text-2xl font-bold">{reconciliationData.totalFuzzyMatch}</p>
          <p className="text-xs text-white/80">Fuzzy Match</p>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 p-4 text-white">
          <XCircle className="w-6 h-6 mb-2" />
          <p className="text-2xl font-bold">{reconciliationData.totalUnmatched}</p>
          <p className="text-xs text-white/80">Unmatched</p>
        </Card>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by merchant or reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Summary Card */}
      <Card className={`border-0 shadow-lg p-4 ${
        reconciliationData.isBalanced 
          ? 'bg-gradient-to-br from-green-500 to-green-600' 
          : 'bg-gradient-to-br from-orange-500 to-orange-600'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
            <h3 className="font-semibold mb-1">Overall Status</h3>
            <p className="text-sm text-white/80">Ledger vs Settlements</p>
          </div>
          {reconciliationData.isBalanced ? (
            <CheckCircle2 className="w-10 h-10 text-white" />
          ) : (
            <AlertTriangle className="w-10 h-10 text-white" />
          )}
        </div>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
          <p className="text-xs text-white/80 mb-1">Status</p>
          <p className="text-xl font-bold text-white">
            {reconciliationData.isBalanced ? 'Balanced' : 'Discrepancy Found'}
          </p>
          {!reconciliationData.isBalanced && (
            <p className="text-sm text-white/90 mt-1">
              Difference: R{reconciliationData.discrepancy.toFixed(2)}
            </p>
          )}
        </div>
      </Card>
      
      {/* Ledger Breakdown */}
      <Card className="bg-white border-0 shadow-md p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <FileCheck className="w-5 h-5 text-[#00A89D] mr-2" />
          Ledger Breakdown
        </h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Consumer Payments</span>
            <span className="font-semibold text-gray-900">R{reconciliationData.consumerPayments.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Platform Revenue (4%)</span>
            <span className="font-semibold text-green-600">R{reconciliationData.platformRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Merchant Liabilities</span>
            <span className="font-semibold text-orange-600">R{reconciliationData.liabilities.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Payouts Posted</span>
            <span className="font-semibold text-blue-600">R{reconciliationData.posted.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 bg-gray-50 rounded">
            <span className="text-sm font-semibold text-gray-900">Settlements Paid</span>
            <span className="font-bold text-gray-900">R{reconciliationData.settled.toLocaleString()}</span>
          </div>
        </div>
      </Card>
      
      {/* Matched Items - Awaiting Reconciliation */}
      {filteredMatches.filter(m => m.status === 'matched').length > 0 && (
        <Card className="bg-white border-0 shadow-md p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Link2 className="w-5 h-5 text-blue-600 mr-2" />
              Auto-Matched ({filteredMatches.filter(m => m.status === 'matched').length})
            </h3>
            <Badge className="bg-blue-100 text-blue-800">High Confidence</Badge>
          </div>
          
          <div className="space-y-2">
            {filteredMatches.filter(m => m.status === 'matched').map((item) => (
              <div key={item.settlement.id} className="bg-blue-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.settlement.merchantName}</p>
                    <p className="text-xs text-gray-500">{moment(item.settlement.settlementDate).format('DD MMM YYYY')}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Matched
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600 mb-3">
                  <span>Settlement: R{item.settlement.amount?.toLocaleString()}</span>
                  <span>Ledger: R{item.ledgerEntry.amount?.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <GoldButton 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleReconcile(item.settlement.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Reconcile
                  </GoldButton>
                  <GoldButton 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setDiscrepancyDialog(true);
                    }}
                  >
                    <Flag className="w-4 h-4" />
                  </GoldButton>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Fuzzy Matches - Require Review */}
      {filteredMatches.filter(m => m.status === 'fuzzy_match').length > 0 && (
        <Card className="bg-white border-0 shadow-md p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              Fuzzy Match ({filteredMatches.filter(m => m.status === 'fuzzy_match').length})
            </h3>
            <Badge className="bg-orange-100 text-orange-800">Review Needed</Badge>
          </div>
          
          <div className="space-y-2">
            {filteredMatches.filter(m => m.status === 'fuzzy_match').map((item) => (
              <div key={item.settlement.id} className="bg-orange-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.settlement.merchantName}</p>
                    <p className="text-xs text-gray-500">{moment(item.settlement.settlementDate).format('DD MMM YYYY')}</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Partial
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-gray-600">Settlement: R{item.settlement.amount?.toLocaleString()}</span>
                  <span className="text-gray-600">Ledger: R{item.ledgerEntry.amount?.toLocaleString()}</span>
                </div>
                {item.discrepancy > 0 && (
                  <div className="bg-red-100 rounded px-2 py-1 mb-3">
                    <p className="text-xs text-red-800">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Discrepancy: R{item.discrepancy.toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <GoldButton 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleReconcile(item.settlement.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Accept Match
                  </GoldButton>
                  <GoldButton 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setDiscrepancyDialog(true);
                    }}
                  >
                    <Flag className="w-4 h-4" />
                  </GoldButton>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Unmatched Items */}
      {filteredUnmatched.length > 0 && (
        <Card className="bg-white border-0 shadow-md p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              Unmatched ({filteredUnmatched.length})
            </h3>
            <Badge className="bg-red-100 text-red-800">Investigation Required</Badge>
          </div>
          
          <div className="space-y-2">
            {filteredUnmatched.map((item) => (
              <div key={item.settlement.id} className="bg-red-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.settlement.merchantName}</p>
                    <p className="text-xs text-gray-500">{moment(item.settlement.settlementDate).format('DD MMM YYYY')}</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    No Match
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600 mb-3">
                  <span>Settlement: R{item.settlement.amount?.toLocaleString()}</span>
                  <span className="text-red-600">No ledger entry found</span>
                </div>
                <GoldButton 
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedItem(item);
                    setDiscrepancyDialog(true);
                  }}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Flag for Investigation
                </GoldButton>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Reconciled Items Summary */}
      {reconciliationData.totalMatched > 0 && (
        <Card className="bg-green-50 border-0 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-green-900 font-semibold">{reconciliationData.totalMatched} Items Reconciled</p>
              <p className="text-sm text-green-700">All matched and verified</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Discrepancy Dialog */}
      <Dialog open={discrepancyDialog} onOpenChange={setDiscrepancyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Discrepancy</DialogTitle>
            <DialogDescription>
              Document the issue for investigation and resolution
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {selectedItem.settlement.merchantName}
                </p>
                <p className="text-xs text-gray-600">
                  Settlement: R{selectedItem.settlement.amount?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">
                  Date: {moment(selectedItem.settlement.settlementDate).format('DD MMM YYYY')}
                </p>
                {selectedItem.ledgerEntry && (
                  <p className="text-xs text-gray-600">
                    Ledger: R{selectedItem.ledgerEntry.amount?.toLocaleString()}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Investigation Notes
                </label>
                <Textarea
                  placeholder="Describe the discrepancy and next steps..."
                  value={discrepancyNote}
                  onChange={(e) => setDiscrepancyNote(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3">
                <GoldButton
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setDiscrepancyDialog(false);
                    setDiscrepancyNote('');
                    setSelectedItem(null);
                  }}
                >
                  Cancel
                </GoldButton>
                <GoldButton
                  className="flex-1"
                  onClick={handleFlagDiscrepancy}
                  disabled={!discrepancyNote.trim() || flagDiscrepancyMutation.isPending}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Flag Issue
                </GoldButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}