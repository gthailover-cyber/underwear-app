
import React from 'react';
import { ShoppingBag, Gavel, X } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface LiveSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'selling' | 'auction') => void;
  language: Language;
}

const LiveSelectionModal: React.FC<LiveSelectionModalProps> = ({ isOpen, onClose, onSelect, language }) => {
  const t = TRANSLATIONS[language];
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
         <div className="p-6 text-center">
            <h2 className="text-xl font-athletic text-white mb-6 tracking-wide">{t.liveSelectionTitle}</h2>
            <div className="space-y-4">
               <button
                 onClick={() => onSelect('selling')}
                 className="w-full bg-gray-800 hover:bg-red-900/20 border border-gray-700 hover:border-red-500 rounded-2xl p-6 flex items-center gap-4 group transition-all relative overflow-hidden active:scale-95"
               >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-red-900/50 z-10">
                     <ShoppingBag className="text-white" size={24} />
                  </div>
                  <div className="text-left z-10">
                     <h3 className="text-lg font-bold text-white">{t.liveSelling}</h3>
                     <p className="text-xs text-gray-400">{t.liveSellingDesc}</p>
                  </div>
               </button>

               <button
                 onClick={() => onSelect('auction')}
                 className="w-full bg-gray-800 hover:bg-yellow-900/20 border border-gray-700 hover:border-yellow-500 rounded-2xl p-6 flex items-center gap-4 group transition-all relative overflow-hidden active:scale-95"
               >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-yellow-900/50 z-10">
                     <Gavel className="text-black" size={24} />
                  </div>
                  <div className="text-left z-10">
                     <h3 className="text-lg font-bold text-white">{t.liveAuction}</h3>
                     <p className="text-xs text-gray-400">{t.liveAuctionDesc}</p>
                  </div>
               </button>
            </div>
         </div>
         <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white bg-gray-800/50 p-1 rounded-full">
            <X size={20} />
         </button>
      </div>
    </div>
  );
}

export default LiveSelectionModal;
