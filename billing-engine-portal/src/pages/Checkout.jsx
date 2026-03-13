import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileContainer from '@/components/ui/MobileContainer';
import GoldButton from '@/components/ui/GoldButton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard, Building2, Wallet, Check, Loader2 } from 'lucide-react';

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });
  
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('productId');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.VoucherProduct.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const voucherCode = 'EV' + Math.random().toString(36).substr(2, 8).toUpperCase();
      
      // Create voucher instance
      await base44.entities.VoucherInstance.create({
        voucherProductId: product.id,
        merchantId: product.merchantId,
        merchantName: product.merchantName,
        faceValue: product.faceValue,
        remainingBalance: product.faceValue,
        purchasePrice: product.consumerPrice,
        voucherCode: voucherCode,
        status: 'active',
        purchaseDate: new Date().toISOString(),
      });

      // Create transaction
      await base44.entities.Transaction.create({
        type: 'purchase',
        amount: product.consumerPrice,
        merchantId: product.merchantId,
        merchantName: product.merchantName,
        paymentMethod: paymentMethod,
        status: 'completed',
        reference: voucherCode,
        description: `Purchased R${product.faceValue} ${product.merchantName} voucher`,
      });

      // Create ledger entries for proper accounting
      await base44.entities.LedgerEntry.create({
        entryType: 'consumer_payment',
        amount: product.consumerPrice,
        merchantId: product.merchantId,
        merchantName: product.merchantName,
        reference: voucherCode,
        description: `Consumer paid R${product.consumerPrice}`,
      });

      await base44.entities.LedgerEntry.create({
        entryType: 'platform_revenue',
        amount: product.platformMargin,
        merchantId: product.merchantId,
        merchantName: product.merchantName,
        reference: voucherCode,
        description: `Platform revenue (4% of R${product.faceValue})`,
      });

      await base44.entities.LedgerEntry.create({
        entryType: 'merchant_payout_liability',
        amount: product.merchantPayout,
        merchantId: product.merchantId,
        merchantName: product.merchantName,
        reference: voucherCode,
        description: `Merchant payout pending (92% of R${product.faceValue})`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setCompleted(true);
    },
  });

  const handlePurchase = async () => {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    purchaseMutation.mutate();
    setProcessing(false);
  };

  if (isLoading) {
    return (
      <MobileContainer>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00A89D] animate-spin" />
        </div>
      </MobileContainer>
    );
  }

  if (completed) {
    return (
      <MobileContainer>
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Successful!</h1>
          <p className="text-gray-500 text-center mb-2">
            Your R{product?.faceValue} {product?.merchantName} voucher is ready
          </p>
          <p className="text-gray-400 text-sm text-center mb-8">
            Check your wallet to view and redeem
          </p>
          <div className="w-full space-y-3">
            <Link to={createPageUrl('ConsumerWallet')} className="block">
              <GoldButton className="w-full h-12">View My Vouchers</GoldButton>
            </Link>
            <Link to={createPageUrl('Shop')} className="block">
              <GoldButton variant="outline" className="w-full h-12">Buy More</GoldButton>
            </Link>
          </div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="pb-6">
        {/* Header */}
        <div className="bg-[#00A89D] pt-6 pb-6 px-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Shop')}>
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-white">Checkout</h1>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Order Summary */}
          <Card className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-[#00A89D]/10 flex items-center justify-center">
                <span className="text-xl font-bold text-[#00A89D]">{product?.merchantName?.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{product?.merchantName}</h3>
                <p className="text-gray-500 text-sm">{product?.description}</p>
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Voucher Value</span>
                <span className="text-gray-900">R{product?.faceValue}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount (4%)</span>
                <span className="text-green-600">-R{product?.faceValue - product?.consumerPrice}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-900 font-bold">You Pay</span>
                <span className="text-[#00A89D] font-bold text-xl">R{product?.consumerPrice}</span>
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <h2 className="font-bold text-gray-900 mb-3">Payment Method</h2>
          <div className="space-y-3 mb-6">
            <Card 
              className={`rounded-xl p-4 cursor-pointer transition-all ${
                paymentMethod === 'card' ? 'border-2 border-[#00A89D] bg-[#00A89D]/5' : 'border border-gray-200'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  paymentMethod === 'card' ? 'bg-[#00A89D]' : 'bg-gray-100'
                }`}>
                  <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Credit / Debit Card</p>
                  <p className="text-gray-500 text-xs">Visa, Mastercard accepted</p>
                </div>
              </div>
            </Card>

            <Card 
              className={`rounded-xl p-4 cursor-pointer transition-all ${
                paymentMethod === 'eft' ? 'border-2 border-[#00A89D] bg-[#00A89D]/5' : 'border border-gray-200'
              }`}
              onClick={() => setPaymentMethod('eft')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  paymentMethod === 'eft' ? 'bg-[#00A89D]' : 'bg-gray-100'
                }`}>
                  <Building2 className={`w-5 h-5 ${paymentMethod === 'eft' ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Instant EFT</p>
                  <p className="text-gray-500 text-xs">Pay from your bank</p>
                </div>
              </div>
            </Card>

            <Card 
              className={`rounded-xl p-4 cursor-pointer transition-all ${
                paymentMethod === 'wallet' ? 'border-2 border-[#00A89D] bg-[#00A89D]/5' : 'border border-gray-200'
              }`}
              onClick={() => setPaymentMethod('wallet')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  paymentMethod === 'wallet' ? 'bg-[#00A89D]' : 'bg-gray-100'
                }`}>
                  <Wallet className={`w-5 h-5 ${paymentMethod === 'wallet' ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">eVoucher Wallet</p>
                  <p className="text-gray-500 text-xs">Use your wallet balance</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Card Details */}
          {paymentMethod === 'card' && (
            <div className="space-y-3 mb-6">
              <Input 
                placeholder="Card Number" 
                value={cardDetails.number}
                onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                className="h-14 bg-gray-50 border-gray-200 text-gray-900"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  placeholder="MM/YY" 
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                  className="h-14 bg-gray-50 border-gray-200 text-gray-900"
                />
                <Input 
                  placeholder="CVV" 
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                  className="h-14 bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
            </div>
          )}

          {/* Pay Button */}
          <GoldButton 
            className="w-full h-14 text-lg" 
            onClick={handlePurchase}
            disabled={processing}
          >
            {processing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </div>
            ) : (
              `Pay R${product?.consumerPrice}`
            )}
          </GoldButton>

          <p className="text-center text-gray-400 text-xs mt-4">
            Secure payment powered by eVoucher
          </p>
        </div>
      </div>
    </MobileContainer>
  );
}