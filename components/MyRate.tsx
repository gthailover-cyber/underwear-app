
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Video, MapPin, Package, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface MyRateProps {
  language: Language;
  onBack: () => void;
}

const MyRate: React.FC<MyRateProps> = ({ language, onBack }) => {
  const t = TRANSLATIONS[language];
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rates, setRates] = useState({
    eventLive: '10', // Default start at 10 as requested
    productPresentation: '0',
    onsiteEvent: '0'
  });

  // Fetch existing rates from Supabase on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('rate_event_live, rate_product_presentation, rate_onsite')
            .eq('id', user.id)
            .single();

          if (error) {
            // If error is about missing column, we silently ignore fetch and rely on defaults
            // allowing user to save later which might trigger the column creation instruction
            console.warn("Could not fetch rates (likely columns missing):", error.message);
          }

          if (data) {
            setRates({
              // If value exists in DB use it, otherwise default to 10 for Event Live, 0 for others
              eventLive: data.rate_event_live !== null ? data.rate_event_live.toString() : '10',
              productPresentation: data.rate_product_presentation !== null ? data.rate_product_presentation.toString() : '0',
              onsiteEvent: data.rate_onsite !== null ? data.rate_onsite.toString() : '0'
            });
          }
        }
      } catch (error) {
        console.error("Error fetching rates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  const handleChange = (key: string, value: string) => {
    // Allow only numbers
    if (!/^\d*$/.test(value)) return;
    setRates(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const updates = {
        rate_event_live: parseInt(rates.eventLive) || 0,
        rate_product_presentation: parseInt(rates.productPresentation) || 0,
        rate_onsite: parseInt(rates.onsiteEvent) || 0,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      alert(t.rateSaved || "Rates saved successfully!");
    } catch (error: any) {
      console.error("Error saving rates:", error);

      // Handle specific Supabase/PostgREST error for missing columns (PGRST204)
      // Also catching generic message match just in case
      const isColumnMissing =
        error.code === 'PGRST204' ||
        (error.message && error.message.includes('Could not find the')) ||
        (error.message && error.message.includes('column'));

      if (isColumnMissing) {
        const msg = language === 'th'
          ? "ไม่พบคอลัมน์ในฐานข้อมูล! กรุณารันคำสั่ง SQL ในไฟล์ 'supabase_rates_migration.txt' ที่ SQL Editor ของ Supabase"
          : "Database columns missing! Please run the SQL in 'supabase_rates_migration.txt' in Supabase SQL Editor to add the rate columns.";

        setErrorMessage(msg);
        // Don't alert generic error, just show the specific instructional one
        alert(msg);
      } else {
        setErrorMessage(error.message || "An unknown error occurred");
        alert("Failed to save rates: " + (error.message || "Unknown error"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="pb-24 animate-fade-in bg-black min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="text-xl font-athletic tracking-wide text-white">{t.myRateTitle}</h2>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <p className="text-gray-400 text-sm">{t.myRateDesc}</p>

        {errorMessage && (
          <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-start gap-3 animate-pulse">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-red-200 text-sm font-bold mb-1">Save Failed</p>
              <p className="text-red-300 text-xs leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Event Live Rate */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg group focus-within:border-red-600 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center border border-red-600/30">
              <Video size={20} className="text-red-500" />
            </div>
            <h3 className="text-white font-bold text-lg">{t.eventLiveRate}</h3>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">Coins</span>
            <input
              type="text"
              inputMode="numeric"
              value={rates.eventLive === '0' ? '' : rates.eventLive}
              onChange={(e) => handleChange('eventLive', e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-xl py-4 pl-16 pr-24 text-white text-2xl font-bold font-athletic focus:outline-none focus:border-red-600 text-right placeholder-gray-700"
              placeholder="10"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 uppercase font-bold bg-gray-900 px-2 py-1 rounded">
              {t.perHour}
            </span>
          </div>
        </div>

        {/* Product Presentation Rate */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg group focus-within:border-blue-600 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-600/30">
              <Package size={20} className="text-blue-500" />
            </div>
            <h3 className="text-white font-bold text-lg">{t.productPresentationRate}</h3>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">Coins</span>
            <input
              type="text"
              inputMode="numeric"
              value={rates.productPresentation === '0' ? '' : rates.productPresentation}
              onChange={(e) => handleChange('productPresentation', e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-xl py-4 pl-16 pr-24 text-white text-2xl font-bold font-athletic focus:outline-none focus:border-blue-600 text-right placeholder-gray-700"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 uppercase font-bold bg-gray-900 px-2 py-1 rounded">
              {t.perHour}
            </span>
          </div>
        </div>

        {/* Onsite Event Rate */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg group focus-within:border-yellow-600 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-900/30 flex items-center justify-center border border-yellow-600/30">
              <MapPin size={20} className="text-yellow-500" />
            </div>
            <h3 className="text-white font-bold text-lg">{t.onsiteEventRate}</h3>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">Coins</span>
            <input
              type="text"
              inputMode="numeric"
              value={rates.onsiteEvent === '0' ? '' : rates.onsiteEvent}
              onChange={(e) => handleChange('onsiteEvent', e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-xl py-4 pl-16 pr-24 text-white text-2xl font-bold font-athletic focus:outline-none focus:border-yellow-600 text-right placeholder-gray-700"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 uppercase font-bold bg-gray-900 px-2 py-1 rounded">
              {t.perHour}
            </span>
          </div>
        </div>

        <div className="pt-4 pb-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={20} /> {t.saveRates}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyRate;
