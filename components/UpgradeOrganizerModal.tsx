
import React, { useState } from 'react';
import { X, Crown, CheckCircle, ChevronRight, Coins } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface UpgradeOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  walletBalance: number;
  onConfirmUpgrade: () => void;
  onTopUpRedirect: () => void;
}

const UpgradeOrganizerModal: React.FC<UpgradeOrganizerModalProps> = ({ 
  isOpen, 
  onClose, 
  language, 
  walletBalance, 
  onConfirmUpgrade,
  onTopUpRedirect
}) => {
  const t = TRANSLATIONS[language];
  const [isProcessing, setIsProcessing] = useState(false);
  const UPGRADE_PRICE = 5000;
  const canAfford = walletBalance >= UPGRADE_PRICE;

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
        onConfirmUpgrade();
        setIsProcessing(false);
        onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-gradient-to-b from-yellow-900 to-gray-900 rounded-3xl border border-yellow-600/50 shadow-2xl overflow-hidden animate-fade-in">
         
         <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-yellow-500/20 to-transparent pointer-events-none"></div>

         <button 
           onClick={onClose}
           className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-yellow-100 hover:text-white hover:bg-black/60 z-10"
         >
           <X size={20} />
         </button>

         <div className="p-8 flex flex-col items-center text-center relative z-0">
             <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50 mb-6 animate-pulse">
                <Crown size={48} className="text-black fill-black" />
             </div>
             
             <h2 className="text-2xl font-athletic text-white uppercase tracking-wide mb-2">
                 {t.upgradeTitle}
             </h2>
             <p className="text-sm text-yellow-100/80 mb-6 leading-relaxed">
                 {t.upgradeDesc}
             </p>

             <div className="bg-black/40 rounded-xl p-4 w-full mb-6 border border-yellow-500/20">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-widest">Price</span>
                    <span className="text-xl font-black text-yellow-400 font-athletic flex items-center gap-1">
                        <Coins size={16} /> 5,000
                    </span>
                </div>
                <div className="h-px bg-white/10 my-2"></div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase tracking-widest">Balance</span>
                    <span className={`text-sm font-bold ${canAfford ? 'text-white' : 'text-red-500'}`}>
                        {walletBalance.toLocaleString()} Coins
                    </span>
                </div>
             </div>

             {canAfford ? (
                 <button 
                   onClick={handleUpgrade}
                   disabled={isProcessing}
                   className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl font-bold text-black text-lg shadow-lg shadow-yellow-900/50 hover:from-yellow-400 hover:to-yellow-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                    {isProcessing ? (
                        <>
                           <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                           Processing...
                        </>
                    ) : (
                        t.upgradeButton
                    )}
                 </button>
             ) : (
                 <button 
                   onClick={onTopUpRedirect}
                   className="w-full py-4 bg-red-600 rounded-xl font-bold text-white text-lg shadow-lg shadow-red-900/50 hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                    {t.topUp} <ChevronRight size={20} />
                 </button>
             )}
             
             {!canAfford && (
                 <p className="text-xs text-red-400 mt-3 font-medium">{t.insufficientForUpgrade}</p>
             )}
         </div>
      </div>
    </div>
  );
};

export default UpgradeOrganizerModal;
