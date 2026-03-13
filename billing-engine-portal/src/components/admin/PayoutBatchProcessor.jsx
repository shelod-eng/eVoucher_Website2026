import React from 'react';
import { Card } from '@/components/ui/card';
import GoldButton from '@/components/ui/GoldButton';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Building2, Plus, AlertCircle } from 'lucide-react';

export default function PayoutBatchProcessor({ merchantPayouts, onCreateBatch, isCreating }) {
  const totalAmount = merchantPayouts.reduce((sum, m) => sum + m.pendingAmount, 0);
  
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-[#00A89D] to-teal-600 border-0 p-4 shadow-lg">
        <div className="text-white mb-4">
          <h3 className="font-semibold mb-1">Create Settlement Batch</h3>
          <p className="text-sm text-white/80">Process pending merchant payouts</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <Building2 className="w-5 h-5 text-white/80 mb-1" />
            <p className="text-xs text-white/80">Merchants</p>
            <p className="text-xl font-bold text-white">{merchantPayouts.length}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <DollarSign className="w-5 h-5 text-yellow-300 mb-1" />
            <p className="text-xs text-white/80">Total Amount</p>
            <p className="text-xl font-bold text-white">R{totalAmount.toLocaleString()}</p>
          </div>
        </div>
        
        <GoldButton 
          className="w-full bg-white text-[#00A89D] hover:bg-gray-100"
          onClick={onCreateBatch}
          disabled={isCreating || merchantPayouts.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? 'Creating Batch...' : 'Create Batch'}
        </GoldButton>
      </Card>
      
      {/* Pending Payouts List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Merchants Ready for Payout</h3>
        
        {merchantPayouts.length === 0 && (
          <Card className="bg-white border-0 shadow-md p-6 text-center">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No pending payouts</p>
            <p className="text-xs text-gray-400 mt-1">All merchants have been settled</p>
          </Card>
        )}
        
        {merchantPayouts.map((merchant) => (
          <Card key={merchant.id} className="bg-white border-0 shadow-md p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00A89D] to-teal-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{merchant.name?.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{merchant.name}</h4>
                <p className="text-xs text-gray-500">{merchant.email}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#00A89D]">R{merchant.pendingAmount?.toLocaleString()}</p>
                <Badge variant="outline" className="text-xs">Pending</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">Bank</p>
                <p className="text-gray-900 font-medium truncate">{merchant.bankName || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">Account</p>
                <p className="text-gray-900 font-medium">{merchant.accountNumber || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">Branch</p>
                <p className="text-gray-900 font-medium">{merchant.branchCode || 'N/A'}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}