
import React, { useState } from 'react';
import { Mail, Lock, User, Facebook, Chrome, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface AuthPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ language, onLanguageChange }) => {
  const t = TRANSLATIONS[language];
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Only for register
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: fullName,
              role: 'supporter'
            }
          }
        });
        if (error) throw error;
        alert(t.registerSuccess);
        setIsLogin(true); // Switch to login after success
      }
    } catch (error: any) {
      setErrorMsg(isLogin ? t.loginError : t.registerError);
      console.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Redirects back to this app
      });
      if (error) throw error;
      alert(t.resetLinkSent);
      setIsForgotPassword(false);
      setIsLogin(true);
    } catch (error: any) {
      setErrorMsg(t.resetError);
      console.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Social login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">

      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80"
          className="w-full h-full object-cover opacity-40 grayscale"
          alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20 flex gap-2">
        <button onClick={() => onLanguageChange('th')} className={`text-xs font-bold px-2 py-1 rounded ${language === 'th' ? 'bg-red-600 text-white' : 'bg-black/40 text-gray-400'}`}>TH</button>
        <button onClick={() => onLanguageChange('en')} className={`text-xs font-bold px-2 py-1 rounded ${language === 'en' ? 'bg-red-600 text-white' : 'bg-black/40 text-gray-400'}`}>EN</button>
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-md p-6 animate-fade-in">

        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-athletic italic tracking-wider text-white mb-2">
            GunderWear<span className="text-red-600">.LIVE</span>
          </h1>
          <p className="text-gray-400 text-sm font-light">
            {isForgotPassword
              ? t.resetPasswordDesc
              : (isLogin ? t.welcomeDesc : t.createDesc)}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {isForgotPassword ? (
            // --- FORGOT PASSWORD VIEW ---
            <>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">{t.resetPasswordTitle}</h2>

              <form onSubmit={handleResetPasswordRequest} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-500" size={20} />
                  <input
                    type="email"
                    placeholder={t.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                    required
                  />
                </div>

                {errorMsg && (
                  <p className="text-red-500 text-xs text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/50 hover:from-red-500 hover:to-red-400 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t.sendResetLink
                  )}
                </button>
              </form>

              <button
                onClick={() => setIsForgotPassword(false)}
                className="w-full mt-6 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {t.backToLogin}
              </button>
            </>
          ) : (
            // --- LOGIN / REGISTER VIEW ---
            <>
              {/* Toggle Tabs */}
              <div className="flex bg-black/40 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  {t.signIn}
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  {t.signUp}
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">

                {/* Full Name (Register Only) */}
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-500" size={20} />
                    <input
                      type="text"
                      placeholder={t.fullName}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                      required={!isLogin}
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-500" size={20} />
                  <input
                    type="email"
                    placeholder={t.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-500" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Forgot Password (Login Only) */}
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {t.forgotPassword}
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {errorMsg && (
                  <p className="text-red-500 text-xs text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                    {errorMsg}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/50 hover:from-red-500 hover:to-red-400 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? t.signIn : t.signUp} <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-black/0 backdrop-blur-md text-gray-500 rounded bg-gray-900">{t.orContinueWith}</span>
                </div>
              </div>

              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  <Chrome size={20} /> Google
                </button>
                <button
                  onClick={() => handleSocialLogin('facebook')}
                  className="flex items-center justify-center gap-2 py-3 bg-[#1877F2] text-white rounded-xl font-bold hover:bg-[#166fe5] transition-colors"
                >
                  <Facebook size={20} /> Facebook
                </button>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
