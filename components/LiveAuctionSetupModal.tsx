
import React, { useState } from 'react';
import { X, Clock, Timer, Gavel } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface LiveAuctionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (durationMs: number, startingPrice: number) => void;
  language: Language;
}

const DURATIONS = [
  { label: '30 min', value: 30 * 60 * 1000 },
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '1.30 hour', value: 90 * 60 * 1000 },
  { label: '2 hours', value: 120 * 60 * 1000 },
];

const LiveAuctionSetupModal: React.FC<LiveAuctionSetupModalProps> = ({ isOpen, onClose, onConfirm, language }) => {
  const t = TRANSLATIONS[language];
  const [selectedDuration, setSelectedDuration] = useState<number>(DURATIONS[0].value);
  const [startingPrice, setStartingPrice] = useState<string>('');

  if (!isOpen) return null;

  const handleStart = () => {
    if (!startingPrice) return;
    onConfirm(selectedDuration, Number(startingPrice));
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-fade-in flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-athletic text-white tracking-wide flex items-center gap-2">
            <Gavel size={20} className="text-yellow-500" />
            {t.auctionSetupTitle}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
           
           {/* Duration Selector */}
           <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-3 block flex items-center gap-1">
                 <Clock size={12} /> {t.duration}
              </label>
              <div className="grid grid-cols-2 gap-3">
                 {DURATIONS.map((dur) => (
                    <button
                      key={dur.value}
                      onClick={() => setSelectedDuration(dur.value)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                         selectedDuration === dur.value 
                         ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/20' 
                         : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                       {dur.label}
                    </button>
                 ))}
              </div>
           </div>

           {/* Price Input */}
           <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">
                 {t.startingPrice} (THB)
              </label>
              <input 
                type="number" 
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white text-2xl font-bold focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 placeholder-gray-600 text-center"
              />
           </div>

           {/* Start Button */}
           <button 
             onClick={handleStart}
             disabled={!startingPrice}
             className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
               startingPrice
                 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black shadow-yellow-900/50 hover:from-yellow-400 hover:to-yellow-300 active:scale-95'
                 : 'bg-gray-800 text-gray-500 cursor-not-allowed'
             }`}
           >
             <Timer size={20} /> {t.startAuction}
           </button>
        </div>

      </div>
    </div>
  );
};

export default LiveAuctionSetupModal;
