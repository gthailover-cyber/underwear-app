
import React, { useState, useEffect } from 'react';
import { X, Check, Coins, CreditCard, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';
import { TRANSLATIONS, OMISE_CONFIG } from '../constants';
import { Language } from '../types';
import { supabase } from '../lib/supabaseClient';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onTopUp: (amount: number) => void;
  language: Language;
}

declare global {
  interface Window {
    OmiseCard: any;
  }
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, balance, onTopUp, language }) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[language];
  const amounts = [50, 100, 300, 500, 1000, 2000, 5000];

  const handleOmisePayment = () => {
    const { OmiseCard } = window;

    if (!OmiseCard) {
      setError('Payment system (Omise) is still loading. Please wait a few seconds.');
      return;
    }

    try {
      OmiseCard.configure({
        publicKey: OMISE_CONFIG.PUBLIC_KEY,
        displayAmount: false,
        frameLabel: 'GThaiLover Wallet',
        frameColor: '#dc2626',
        submitLabel: 'PAY NOW',
        currency: 'THB'
      });

      OmiseCard.open({
        amount: selectedAmount * 100,
        currency: 'THB',
        defaultPaymentMethod: 'promptpay',
        otherPaymentMethods: ['credit_card', 'truemoney', 'internet_banking'],
        onCreateTokenSuccess: (nonce: string) => {
          if (nonce.startsWith('tokn_')) {
            processCharge(nonce, 'card');
          } else if (nonce.startsWith('src_')) {
            processCharge(nonce, 'source');
          }
        },
        onFormClosed: () => {
          // User closed the form
        }
      });
    } catch (err: any) {
      console.error('Omise initialization error:', err);
      setError('Could not start payment system. Check your network or Public Key.');
    }
  };

  const processCharge = async (tokenOrSource: string, type: 'card' | 'source') => {
    setIsProcessing(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data, error: funcError } = await supabase.functions.invoke('omise-topup', {
        body: {
          token: tokenOrSource,
          amount: selectedAmount,
          userId: user.id
        }
      });

      if (funcError) throw funcError;

      console.log('[Charge Response]:', data);

      // Handle PromptPay or Redirect-based payments (Highest Priority)
      if (data.status === 'pending' && data.authorize_uri) {
        console.log('[Redirecting to]:', data.authorize_uri);
        window.location.href = data.authorize_uri;
        return;
      }

      // Handle Instant Success (Credit Card/Immediate Payment)
      if (data.success && data.status === 'successful') {
        onTopUp(selectedAmount);
        setIsProcessing(false);
        setIsSuccess(true);

        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || 'Payment processing failed or incomplete');
      }
    } catch (err: any) {
      console.error('Charge error:', err);
      setError(err.message || 'Payment failed. Please try another method.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-md"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-gray-900 rounded-[2.5rem] border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">

        {/* Header - Premium Gradient */}
        <div className="p-6 pb-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-br from-gray-900 via-gray-900 to-red-900/20">
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2 uppercase">
              <ShieldCheck className="text-red-500" size={24} />
              {t.myWallet}
            </h2>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Professional Secure Payment</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2.5 bg-gray-800/80 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-all disabled:opacity-50 border border-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-fade-in">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-500/40 relative">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
              <Check size={48} className="text-white relative z-10" />
            </div>
            <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">SUCCESS!</h3>
            <p className="text-gray-400 font-medium">Added <span className="text-white font-bold">฿{selectedAmount}</span> to your balance.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">

            {/* Professional Balance Card */}
            <div className="relative overflow-hidden rounded-[2rem] p-8 bg-gradient-to-br from-red-600 to-red-900 shadow-2xl shadow-red-950/50">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Coins size={120} />
              </div>
              <div className="relative z-10 flex flex-col">
                <span className="text-xs text-red-100 font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Available Balance</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-athletic tracking-wider">฿{balance.toLocaleString()}</span>
                  <span className="text-red-200 text-sm font-bold opacity-60">THB</span>
                </div>
              </div>

              {/* Decorative dots */}
              <div className="absolute bottom-4 right-6 flex gap-1">
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
              </div>
            </div>

            {/* Select Amount Grid */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Select Recharge Amount</h3>
                <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Fast Coins</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {amounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setError(null); }}
                    className={`group relative overflow-hidden py-5 rounded-2xl border-2 transition-all active:scale-95 ${selectedAmount === amount
                      ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-900/30'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-800'
                      }`}
                  >
                    <div className="flex flex-col items-center relative z-10">
                      <span className={`text-xl font-black tracking-tight ${selectedAmount === amount ? 'text-white' : 'text-gray-200'}`}>฿{amount.toLocaleString()}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 opacity-60 ${selectedAmount === amount ? 'text-red-100' : 'text-gray-500'}`}>
                        {amount} Coins
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Badge */}
            <div className="bg-gray-800/30 border border-gray-800 rounded-2xl p-4 flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-300">Supported Payment Methods</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-tighter mt-0.5">PromptPay, Credit Card, TrueMoney, iBanking</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20 animate-fade-in">
                <AlertCircle size={14} />
                <p className="font-bold">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Action - Powered by Omise */}
        {!isSuccess && (
          <div className="p-6 pt-2 border-t border-gray-800 bg-gray-900/50">
            <button
              onClick={handleOmisePayment}
              disabled={isProcessing}
              className={`w-full py-5 rounded-[1.5rem] font-black text-lg flex flex-col items-center justify-center gap-0.5 transition-all shadow-2xl ${isProcessing
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-white hover:bg-gray-100 text-black active:scale-[0.98] shadow-white/5'
                }`}
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-3 border-gray-500 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="uppercase tracking-tighter">SECURE TOP UP</span>
                  <span className="text-[10px] opacity-60">Total: ฿{selectedAmount.toLocaleString()}</span>
                </>
              )}
            </button>

            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <span className="text-[8px] font-black uppercase text-gray-400 tracking-[0.2em]">Securely Powered by</span>
                <img src="https://www.omise.co/assets/logo-white-9333504fb4f7c184ed392576b971a8f946059d48b94548db55d5b76615f33385.png" className="h-4" alt="Omise" />
              </div>
              <div className="flex items-center gap-4 opacity-20">
                <img src="https://omise-file.s3.amazonaws.com/assets/pms/visa.png" className="h-3" alt="Visa" />
                <img src="https://omise-file.s3.amazonaws.com/assets/pms/mastercard.png" className="h-3" alt="Mastercard" />
                <img src="https://omise-file.s3.amazonaws.com/assets/pms/jcb.png" className="h-3" alt="JCB" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WalletModal;