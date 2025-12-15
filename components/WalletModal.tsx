import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Check, Coins } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onTopUp: (amount: number) => void;
  language: Language;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, balance, onTopUp, language }) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'truemoney'>('truemoney');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const t = TRANSLATIONS[language];
  
  const amounts = [50, 100, 300, 500, 1000, 2000];

  if (!isOpen) return null;

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate API Call
    setTimeout(() => {
      onTopUp(selectedAmount);
      setIsProcessing(false);
      setIsSuccess(true);
      // Close modal after showing success
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 pb-2 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800">
          <h2 className="text-xl font-athletic tracking-wide text-white flex items-center gap-2">
            <Coins className="text-yellow-400" />
            {t.wallet}
          </h2>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Overlay */}
        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
              <Check size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{t.paymentSuccess}</h3>
            <p className="text-gray-400">+{selectedAmount} {t.coins}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Current Balance Card */}
            <div className="bg-gradient-to-br from-red-900 to-black border border-red-800/50 rounded-2xl p-6 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
               <span className="text-sm text-red-200 font-medium uppercase tracking-wider">{t.currentBalance}</span>
               <div className="text-4xl font-black text-white mt-2 flex items-center justify-center gap-2 font-athletic">
                 <Coins size={32} className="text-yellow-400" />
                 {balance.toLocaleString()}
               </div>
               <div className="mt-4 inline-block bg-black/40 backdrop-blur rounded-full px-3 py-1 text-xs text-gray-300 border border-white/10">
                 {t.exchangeRate}
               </div>
            </div>

            {/* Select Amount */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">{t.selectAmount}</h3>
              <div className="grid grid-cols-3 gap-3">
                {amounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={`py-4 rounded-xl border font-bold text-lg flex flex-col items-center justify-center transition-all ${
                      selectedAmount === amount 
                      ? 'bg-white text-black border-white shadow-lg shadow-white/10 scale-105' 
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:bg-gray-750'
                    }`}
                  >
                    <span>฿{amount}</span>
                    <span className="text-[10px] font-normal opacity-70 mt-1">={amount} Coins</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">{t.paymentMethod}</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('truemoney')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    paymentMethod === 'truemoney'
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                      <Smartphone size={20} />
                    </div>
                    <span className="font-medium">{t.truemoney}</span>
                  </div>
                  {paymentMethod === 'truemoney' && <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-black ring-2 ring-orange-500"></div>}
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    paymentMethod === 'card'
                    ? 'bg-blue-500/10 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                      <CreditCard size={20} />
                    </div>
                    <span className="font-medium">{t.creditDebit}</span>
                  </div>
                  {paymentMethod === 'card' && <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-black ring-2 ring-blue-500"></div>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Action */}
        {!isSuccess && (
          <div className="p-6 border-t border-gray-800 bg-gray-900">
             <button
               onClick={handlePayment}
               disabled={isProcessing}
               className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                 isProcessing 
                 ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                 : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50 active:scale-95'
               }`}
             >
               {isProcessing ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   {t.processing}
                 </>
               ) : (
                 `${t.payNow} ฿${selectedAmount}`
               )}
             </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default WalletModal;