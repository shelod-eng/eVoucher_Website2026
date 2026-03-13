import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import GoldButton from '@/components/ui/GoldButton';
import { MessageSquare, Send, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function SMSSimulator() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([
    {
      from: 'eVoucher',
      text: 'Welcome to eVoucher SMS! Commands:\nBAL - Check balance\nBUY - Purchase voucher\nVOUCHERS - View vouchers\nREDEEM - Redeem voucher\nHELP - Show commands',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

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
          consumerId: profile.userId 
        });
      } catch (err) {
        return [];
      }
    },
    enabled: !!profile
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (from, text) => {
    setMessages(prev => [...prev, { from, text, timestamp: new Date() }]);
  };

  const purchaseMutation = useMutation({
    mutationFn: async ({ product }) => {
      try {
        const voucherCode = 'V' + Math.random().toString(36).substr(2, 8).toUpperCase();
        
        const voucher = await base44.entities.VoucherInstance.create({
          voucherProductId: product.id,
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
          reference: `SMS-${Date.now()}`
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
    mutationFn: async ({ voucher, amount }) => {
      try {
        const newBalance = voucher.remainingBalance - amount;
        const newStatus = newBalance <= 0 ? 'fully_redeemed' : 
                         newBalance < voucher.faceValue ? 'partially_redeemed' : 'active';

        await base44.entities.VoucherInstance.update(voucher.id, {
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
          voucherInstanceId: voucher.id,
          status: 'completed',
          reference: `SMS-REDEEM-${Date.now()}`
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

  const handleCommand = async (command) => {
    try {
      const cmd = command.trim().toUpperCase();
      addMessage('You', command);

      if (cmd === 'BAL' || cmd === 'BALANCE') {
        const totalVouchers = vouchers.reduce((sum, v) => sum + v.remainingBalance, 0);
        addMessage('eVoucher', 
          `Your Balance:\n\nWallet: R${profile?.walletBalance || 0}\nActive Vouchers: ${vouchers.filter(v => v.status === 'active').length}\nTotal Voucher Value: R${totalVouchers.toFixed(2)}`
        );
      } 
      else if (cmd === 'VOUCHERS') {
        if (vouchers.length === 0) {
          addMessage('eVoucher', 'You have no vouchers.\n\nReply BUY to purchase a voucher.');
        } else {
          const voucherList = vouchers.slice(0, 5).map((v, i) => 
            `${i + 1}. ${v.merchantName}\n   Code: ${v.voucherCode}\n   Balance: R${v.remainingBalance}/${v.faceValue}\n   Status: ${v.status}`
          ).join('\n\n');
          addMessage('eVoucher', `Your Vouchers:\n\n${voucherList}`);
        }
      }
      else if (cmd === 'BUY') {
        const merchantList = merchants.slice(0, 5).map((m, i) => 
          `${i + 1}. ${m.name}`
        ).join('\n');
        addMessage('eVoucher', 
          `Available Merchants:\n\n${merchantList}\n\nReply with merchant number to see vouchers.\nExample: BUY 1`
        );
      }
      else if (cmd.startsWith('BUY ')) {
        const parts = cmd.split(' ');
        const merchantNum = parseInt(parts[1]);
        
        if (merchantNum > 0 && merchantNum <= merchants.length) {
          const merchant = merchants[merchantNum - 1];
          const merchantProducts = products.filter(p => p.merchantId === merchant.id);
          
          if (merchantProducts.length === 0) {
            addMessage('eVoucher', `${merchant.name} has no vouchers available.`);
          } else {
            const productList = merchantProducts.slice(0, 5).map((p, i) => 
              `${i + 1}. R${p.faceValue} voucher\n   Pay: R${p.consumerPrice}\n   Save: R${(p.faceValue - p.consumerPrice).toFixed(2)}`
            ).join('\n\n');
            addMessage('eVoucher', 
              `${merchant.name} Vouchers:\n\n${productList}\n\nTo purchase, reply:\nBUY ${merchantNum} <voucher number>\nExample: BUY ${merchantNum} 1`
            );
          }
        } else if (parts.length === 3) {
          const merchantIdx = parseInt(parts[1]) - 1;
          const productIdx = parseInt(parts[2]) - 1;
          
          if (merchantIdx >= 0 && merchantIdx < merchants.length) {
            const merchant = merchants[merchantIdx];
            const merchantProducts = products.filter(p => p.merchantId === merchant.id);
            
            if (productIdx >= 0 && productIdx < merchantProducts.length) {
              const product = merchantProducts[productIdx];
              
              if ((profile?.walletBalance || 0) < product.consumerPrice) {
                addMessage('eVoucher', 
                  `Insufficient balance!\n\nRequired: R${product.consumerPrice}\nYour Balance: R${profile?.walletBalance || 0}\n\nPlease add funds to your wallet.`
                );
              } else {
                try {
                  const voucher = await purchaseMutation.mutateAsync({ product });
                  addMessage('eVoucher', 
                    `✅ Purchase Successful!\n\nMerchant: ${product.merchantName}\nVoucher Code: ${voucher.voucherCode}\nValue: R${voucher.faceValue}\nYou Paid: R${voucher.purchasePrice}\nYou Saved: R${(voucher.faceValue - voucher.purchasePrice).toFixed(2)}\n\nNew Balance: R${((profile?.walletBalance || 0) - product.consumerPrice).toFixed(2)}`
                  );
                } catch (err) {
                  addMessage('eVoucher', `❌ Purchase failed: ${err.message}`);
                }
              }
            }
          }
        }
      }
      else if (cmd === 'REDEEM') {
        if (vouchers.filter(v => v.status === 'active').length === 0) {
          addMessage('eVoucher', 'You have no active vouchers to redeem.');
        } else {
          const activeVouchers = vouchers.filter(v => v.status === 'active').slice(0, 5);
          const voucherList = activeVouchers.map((v, i) => 
            `${i + 1}. ${v.merchantName}\n   Code: ${v.voucherCode}\n   Balance: R${v.remainingBalance}`
          ).join('\n\n');
          addMessage('eVoucher', 
            `Select voucher to redeem:\n\n${voucherList}\n\nReply: REDEEM <number> <amount>\nExample: REDEEM 1 50`
          );
        }
      }
      else if (cmd.startsWith('REDEEM ')) {
        const parts = cmd.split(' ');
        if (parts.length === 3) {
          const voucherIdx = parseInt(parts[1]) - 1;
          const amount = parseFloat(parts[2]);
          const activeVouchers = vouchers.filter(v => v.status === 'active');
          
          if (voucherIdx >= 0 && voucherIdx < activeVouchers.length) {
            const voucher = activeVouchers[voucherIdx];
            
            if (amount <= 0) {
              addMessage('eVoucher', '❌ Invalid amount. Amount must be greater than 0.');
            } else if (amount > voucher.remainingBalance) {
              addMessage('eVoucher', 
                `❌ Amount exceeds voucher balance!\n\nRequested: R${amount}\nAvailable: R${voucher.remainingBalance}`
              );
            } else {
              try {
                const result = await redeemMutation.mutateAsync({ voucher, amount });
                addMessage('eVoucher', 
                  `✅ Redemption Successful!\n\nMerchant: ${voucher.merchantName}\nRedeemed: R${amount}\nRemaining: R${result.newBalance.toFixed(2)}\n\nShow this message to merchant.`
                );
              } catch (err) {
                addMessage('eVoucher', `❌ Redemption failed: ${err.message}`);
              }
            }
          } else {
            addMessage('eVoucher', '❌ Invalid voucher number.');
          }
        } else {
          addMessage('eVoucher', '❌ Invalid format. Use: REDEEM <number> <amount>');
        }
      }
      else if (cmd === 'HELP') {
        addMessage('eVoucher', 
          `eVoucher SMS Commands:\n\nBAL - Check balance\nBUY - Purchase voucher\nVOUCHERS - View vouchers\nREDEEM - Redeem voucher\nHELP - Show this help\n\nFor support, visit our website or call customer service.`
        );
      }
      else {
        addMessage('eVoucher', 
          `❌ Unknown command: "${command}"\n\nType HELP to see available commands.`
        );
      }
    } catch (err) {
      addMessage('eVoucher', `❌ Error: An unexpected error occurred. Please try again.`);
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      handleCommand(input);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          {/* Phone Header */}
          <div className="bg-black text-white p-3 flex items-center justify-between">
            <MessageSquare className="w-5 h-5" />
            <span className="font-mono text-sm">SMS Gateway</span>
            <Link to={createPageUrl('Landing')}>
              <Home className="w-5 h-5 cursor-pointer hover:text-gray-300" />
            </Link>
          </div>

          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-4 bg-gray-100">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 ${msg.from === 'You' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    msg.from === 'You'
                      ? 'bg-[#00A89D] text-white'
                      : 'bg-white text-gray-900 border border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-xs mb-1">{msg.from}</div>
                  <div className="whitespace-pre-wrap text-sm">{msg.text}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {moment(msg.timestamp).format('HH:mm')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-gray-700 p-3 flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend();
                }
              }}
              className="flex-1 bg-gray-800 border-gray-600 text-white"
              placeholder="Type command (e.g., BAL, BUY, HELP)"
            />
            <GoldButton
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </GoldButton>
          </div>

          {/* Instructions */}
          <div className="bg-gray-700 text-gray-300 p-3 text-xs text-center">
            Feature Phone SMS Simulation • Type HELP for commands
          </div>
        </Card>
      </div>
    </div>
  );
}