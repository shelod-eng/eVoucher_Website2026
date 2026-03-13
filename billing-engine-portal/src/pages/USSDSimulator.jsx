import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import GoldButton from '@/components/ui/GoldButton';
import { Phone, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function USSDSimulator() {
  const queryClient = useQueryClient();
  const [screen, setScreen] = useState('initial');
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [sessionData, setSessionData] = useState({});
  const [error, setError] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['consumerProfile'],
    queryFn: async () => {
      try {
        const profiles = await base44.entities.ConsumerProfile.list();
        return profiles[0] || null;
      } catch (err) {
        return null;
      }
    }
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      try {
        return await base44.entities.Merchant.filter({ status: 'active' });
      } catch (err) {
        return [];
      }
    }
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        return await base44.entities.VoucherProduct.filter({ status: 'active' });
      } catch (err) {
        return [];
      }
    }
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: ['myVouchers'],
    queryFn: async () => {
      try {
        if (!profile) return [];
        return await base44.entities.VoucherInstance.filter({ 
          consumerId: profile.userId,
          status: 'active'
        });
      } catch (err) {
        return [];
      }
    },
    enabled: !!profile
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ productId, product }) => {
      try {
        const voucherCode = 'V' + Math.random().toString(36).substr(2, 8).toUpperCase();
        
        const voucher = await base44.entities.VoucherInstance.create({
          voucherProductId: productId,
          merchantId: product.merchantId,
          merchantName: product.merchantName,
          consumerId: profile.userId,
          consumerEmail: profile.email,
          faceValue: product.faceValue,
          remainingBalance: product.faceValue,
          purchasePrice: product.consumerPrice,
          voucherCode,
          status: 'active',
          purchaseDate: new Date().toISOString()
        });

        await base44.entities.Transaction.create({
          type: 'purchase',
          amount: product.consumerPrice,
          userId: profile.userId,
          userEmail: profile.email,
          merchantId: product.merchantId,
          merchantName: product.merchantName,
          voucherInstanceId: voucher.id,
          paymentMethod: 'wallet',
          status: 'completed',
          reference: `USSD-${Date.now()}`
        });

        await base44.entities.ConsumerProfile.update(profile.id, {
          walletBalance: (profile.walletBalance || 0) - product.consumerPrice,
          totalSpent: (profile.totalSpent || 0) + product.consumerPrice
        });

        return voucher;
      } catch (err) {
        throw new Error('Purchase failed: ' + err.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myVouchers']);
      queryClient.invalidateQueries(['consumerProfile']);
    }
  });

  const redeemMutation = useMutation({
    mutationFn: async ({ voucherId, amount }) => {
      try {
        const voucher = vouchers.find(v => v.id === voucherId);
        if (!voucher) throw new Error('Voucher not found');
        
        const newBalance = voucher.remainingBalance - amount;
        const newStatus = newBalance <= 0 ? 'fully_redeemed' : 
                         newBalance < voucher.faceValue ? 'partially_redeemed' : 'active';

        await base44.entities.VoucherInstance.update(voucherId, {
          remainingBalance: Math.max(0, newBalance),
          status: newStatus
        });

        await base44.entities.Transaction.create({
          type: 'redemption',
          amount,
          userId: profile.userId,
          userEmail: profile.email,
          merchantId: voucher.merchantId,
          merchantName: voucher.merchantName,
          voucherInstanceId: voucherId,
          status: 'completed',
          reference: `USSD-REDEEM-${Date.now()}`
        });

        return { voucher, newBalance };
      } catch (err) {
        throw new Error('Redemption failed: ' + err.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myVouchers']);
    }
  });

  const getScreen = () => {
    try {
      switch (screen) {
        case 'initial':
          return {
            title: 'eVoucher USSD',
            message: 'Welcome to eVoucher\n\n1. Buy Voucher\n2. My Vouchers\n3. Check Balance\n4. Redeem Voucher\n0. Exit',
            expectInput: true
          };

        case 'buy_select_merchant':
          return {
            title: 'Buy Voucher',
            message: `Select Merchant:\n\n${merchants.slice(0, 5).map((m, i) => `${i + 1}. ${m.name}`).join('\n')}\n0. Back`,
            expectInput: true
          };

        case 'buy_select_amount':
          const selectedMerchant = merchants[sessionData.merchantIndex];
          const merchantProducts = products.filter(p => p.merchantId === selectedMerchant?.id);
          return {
            title: 'Select Amount',
            message: `${selectedMerchant?.name} Vouchers:\n\n${merchantProducts.slice(0, 5).map((p, i) => 
              `${i + 1}. R${p.faceValue} (Pay R${p.consumerPrice})`
            ).join('\n')}\n0. Back`,
            expectInput: true
          };

        case 'buy_confirm':
          const product = products.filter(p => p.merchantId === merchants[sessionData.merchantIndex]?.id)[sessionData.productIndex];
          return {
            title: 'Confirm Purchase',
            message: `Merchant: ${product?.merchantName}\nAmount: R${product?.faceValue}\nPrice: R${product?.consumerPrice}\n\nYour Balance: R${profile?.walletBalance || 0}\n\n1. Confirm\n0. Cancel`,
            expectInput: true
          };

        case 'buy_success':
          return {
            title: 'Purchase Successful',
            message: `Voucher purchased!\nCode: ${sessionData.voucherCode}\nValue: R${sessionData.voucherValue}\n\nSaved R${sessionData.savedAmount}!\n\n0. Main Menu`,
            expectInput: true
          };

        case 'my_vouchers':
          if (vouchers.length === 0) {
            return {
              title: 'My Vouchers',
              message: 'You have no active vouchers.\n\n0. Main Menu',
              expectInput: true
            };
          }
          return {
            title: 'My Vouchers',
            message: `You have ${vouchers.length} voucher(s):\n\n${vouchers.slice(0, 5).map((v, i) => 
              `${i + 1}. ${v.merchantName}\n   R${v.remainingBalance}/${v.faceValue}`
            ).join('\n')}\n\n0. Main Menu`,
            expectInput: true
          };

        case 'check_balance':
          return {
            title: 'Account Balance',
            message: `Wallet: R${profile?.walletBalance || 0}\nActive Vouchers: ${vouchers.length}\nTotal Voucher Value: R${vouchers.reduce((sum, v) => sum + v.remainingBalance, 0)}\n\n0. Main Menu`,
            expectInput: true
          };

        case 'redeem_select':
          return {
            title: 'Select Voucher',
            message: `Choose voucher to redeem:\n\n${vouchers.slice(0, 5).map((v, i) => 
              `${i + 1}. ${v.merchantName} - R${v.remainingBalance}`
            ).join('\n')}\n0. Back`,
            expectInput: true
          };

        case 'redeem_amount':
          const redeemVoucher = vouchers[sessionData.voucherIndex];
          return {
            title: 'Enter Amount',
            message: `${redeemVoucher?.merchantName}\nAvailable: R${redeemVoucher?.remainingBalance}\n\nEnter amount to redeem:\n(or 0 to cancel)`,
            expectInput: true
          };

        case 'redeem_confirm':
          const confirmVoucher = vouchers[sessionData.voucherIndex];
          return {
            title: 'Confirm Redemption',
            message: `Merchant: ${confirmVoucher?.merchantName}\nRedeem: R${sessionData.redeemAmount}\n\n1. Confirm\n0. Cancel`,
            expectInput: true
          };

        case 'redeem_success':
          return {
            title: 'Redemption Success',
            message: `Redeemed R${sessionData.redeemAmount}\nRemaining: R${sessionData.remainingBalance}\n\nThank you!\n\n0. Main Menu`,
            expectInput: true
          };

        case 'error':
          return {
            title: 'Error',
            message: `${error}\n\n0. Main Menu`,
            expectInput: true
          };

        case 'exit':
          return {
            title: 'Thank You',
            message: 'Thank you for using eVoucher USSD service.',
            expectInput: false
          };

        default:
          return {
            title: 'Error',
            message: 'Invalid screen. Press 0 to return.',
            expectInput: true
          };
      }
    } catch (err) {
      return {
        title: 'System Error',
        message: 'An error occurred. Press 0 to restart.',
        expectInput: true
      };
    }
  };

  const handleInput = async (value) => {
    try {
      setError('');
      const choice = value.trim();

      if (choice === '0' && screen !== 'initial') {
        if (['buy_select_amount', 'buy_confirm', 'redeem_amount', 'redeem_confirm'].includes(screen)) {
          setScreen(history[history.length - 1] || 'initial');
          setHistory(history.slice(0, -1));
        } else {
          setScreen('initial');
          setHistory([]);
          setSessionData({});
        }
        setInput('');
        return;
      }

      switch (screen) {
        case 'initial':
          if (choice === '1') {
            setHistory([...history, screen]);
            setScreen('buy_select_merchant');
          } else if (choice === '2') {
            setHistory([...history, screen]);
            setScreen('my_vouchers');
          } else if (choice === '3') {
            setHistory([...history, screen]);
            setScreen('check_balance');
          } else if (choice === '4') {
            if (vouchers.length === 0) {
              setError('You have no vouchers to redeem');
              setScreen('error');
            } else {
              setHistory([...history, screen]);
              setScreen('redeem_select');
            }
          } else if (choice === '0') {
            setScreen('exit');
          }
          break;

        case 'buy_select_merchant':
          const merchantIdx = parseInt(choice) - 1;
          if (merchantIdx >= 0 && merchantIdx < merchants.length) {
            setSessionData({ ...sessionData, merchantIndex: merchantIdx });
            setHistory([...history, screen]);
            setScreen('buy_select_amount');
          }
          break;

        case 'buy_select_amount':
          const merchantProds = products.filter(p => p.merchantId === merchants[sessionData.merchantIndex]?.id);
          const prodIdx = parseInt(choice) - 1;
          if (prodIdx >= 0 && prodIdx < merchantProds.length) {
            const selectedProduct = merchantProds[prodIdx];
            if ((profile?.walletBalance || 0) < selectedProduct.consumerPrice) {
              setError('Insufficient wallet balance');
              setScreen('error');
            } else {
              setSessionData({ ...sessionData, productIndex: prodIdx });
              setHistory([...history, screen]);
              setScreen('buy_confirm');
            }
          }
          break;

        case 'buy_confirm':
          if (choice === '1') {
            const merchantProds2 = products.filter(p => p.merchantId === merchants[sessionData.merchantIndex]?.id);
            const product = merchantProds2[sessionData.productIndex];
            
            try {
              const voucher = await purchaseMutation.mutateAsync({ 
                productId: product.id, 
                product 
              });
              
              setSessionData({
                voucherCode: voucher.voucherCode,
                voucherValue: voucher.faceValue,
                savedAmount: (voucher.faceValue - voucher.purchasePrice).toFixed(2)
              });
              setScreen('buy_success');
            } catch (err) {
              setError(err.message);
              setScreen('error');
            }
          }
          break;

        case 'redeem_select':
          const voucherIdx = parseInt(choice) - 1;
          if (voucherIdx >= 0 && voucherIdx < vouchers.length) {
            setSessionData({ ...sessionData, voucherIndex: voucherIdx });
            setHistory([...history, screen]);
            setScreen('redeem_amount');
          }
          break;

        case 'redeem_amount':
          const amount = parseFloat(choice);
          const voucher = vouchers[sessionData.voucherIndex];
          if (amount > 0 && amount <= voucher.remainingBalance) {
            setSessionData({ ...sessionData, redeemAmount: amount });
            setHistory([...history, screen]);
            setScreen('redeem_confirm');
          } else if (amount > voucher.remainingBalance) {
            setError('Amount exceeds voucher balance');
            setScreen('error');
          }
          break;

        case 'redeem_confirm':
          if (choice === '1') {
            try {
              const result = await redeemMutation.mutateAsync({
                voucherId: vouchers[sessionData.voucherIndex].id,
                amount: sessionData.redeemAmount
              });
              
              setSessionData({
                ...sessionData,
                remainingBalance: result.newBalance
              });
              setScreen('redeem_success');
            } catch (err) {
              setError(err.message);
              setScreen('error');
            }
          }
          break;

        default:
          setScreen('initial');
      }

      setInput('');
    } catch (err) {
      setError('An unexpected error occurred');
      setScreen('error');
      setInput('');
    }
  };

  const currentScreen = getScreen();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          {/* Phone Header */}
          <div className="bg-black text-white p-3 flex items-center justify-between">
            <Phone className="w-5 h-5" />
            <span className="font-mono text-sm">*120*384#</span>
            <Link to={createPageUrl('Landing')}>
              <Home className="w-5 h-5 cursor-pointer hover:text-gray-300" />
            </Link>
          </div>

          {/* USSD Screen */}
          <div className="bg-green-400 p-6 font-mono text-sm text-black min-h-[400px]">
            <div className="font-bold mb-3 text-center border-b-2 border-black pb-2">
              {currentScreen.title}
            </div>
            <div className="whitespace-pre-wrap mb-4">
              {currentScreen.message}
            </div>

            {currentScreen.expectInput && (
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold">&gt;</span>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleInput(input);
                      }
                    }}
                    className="bg-white border-black text-black font-mono flex-1 h-8"
                    placeholder="Enter choice"
                    autoFocus
                  />
                </div>
                <GoldButton
                  className="w-full mt-3 bg-black text-green-400 hover:bg-gray-900"
                  onClick={() => handleInput(input)}
                  disabled={!input.trim()}
                >
                  Send
                </GoldButton>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-gray-700 text-gray-300 p-3 text-xs text-center">
            Feature Phone USSD Simulation • Enter number and press Send
          </div>
        </Card>
      </div>
    </div>
  );
}