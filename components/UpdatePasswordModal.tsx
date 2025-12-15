
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Save } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface UpdatePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({ isOpen, onClose, language }) => {
  const t = TRANSLATIONS[language];
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setMessage({ type: 'success', text: t.passwordUpdated });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
      
      <div className="relative w-full max-w-sm bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-fade-in p-8">
         <h2 className="text-xl font-bold text-white text-center mb-2">{t.setNewPasswordTitle}</h2>
         <p className="text-sm text-gray-400 text-center mb-6">{t.setNewPasswordDesc}</p>

         <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-500" size={20} />
                <input 
                    type={showPassword ? "text" : "password"}
                    placeholder={t.newPassword}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                    required
                    minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-500 hover:text-white"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            {message && (
                <div className={`text-xs text-center font-bold p-2 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {message.text}
                </div>
            )}

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Save size={18} /> {t.updatePassword}
                    </>
                )}
            </button>
         </form>
      </div>
    </div>
  );
};

export default UpdatePasswordModal;
