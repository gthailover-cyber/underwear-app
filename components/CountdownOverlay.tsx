
import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface CountdownOverlayProps {
  count: number;
  isActive: boolean;
  language: Language;
}

const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count, isActive, language }) => {
  const t = TRANSLATIONS[language];

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in">
      <div className="text-gray-400 font-athletic uppercase tracking-widest text-lg mb-8 animate-pulse">
        {t.startingIn}
      </div>
      <div 
        key={count} 
        className="text-[180px] font-black text-white font-athletic leading-none animate-ping-scale"
      >
        {count}
      </div>
      <style>{`
        @keyframes pingScale {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-ping-scale {
          animation: pingScale 0.9s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CountdownOverlay;
