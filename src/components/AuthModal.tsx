import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Lock, User, Phone, ArrowRight, ShieldCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api.ts';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, login, register, adminLogin } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'admin' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states - Strictly: username, mobile, password, confirmPassword
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  React.useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
      setErrorMessage('');
      setSuccessMessage('');
      if (authModalMode === 'admin') {
        setUsername('admin');
        setPassword('admin123');
      }
    }
  }, [authModalMode, authModalOpen]);

  const switchTab = (newMode: 'login' | 'register' | 'admin' | 'reset') => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
    if (newMode === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (username === 'admin') {
      setUsername('');
      setPassword('');
    }
  };

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ usernameOrMobile: username || mobile, password });
      } else if (mode === 'register') {
        await register({
          username,
          mobile,
          password,
          confirmPassword,
        });
      } else if (mode === 'admin') {
        await adminLogin({
          username: username.trim() || 'admin',
          password: password || 'admin123'
        });
      } else if (mode === 'reset') {
        const res = await api.resetPassword({ username, mobile, newPassword: password, confirmPassword });
        setSuccessMessage(res.message);
        setTimeout(() => {
          setMode('login');
          setSuccessMessage('');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantAdminLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await adminLogin({ username: 'admin', password: 'admin123' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to login as admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#064E3B] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold">
              N
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {mode === 'login' && 'User Login / لاگ ان'}
                {mode === 'register' && 'Sign Up / نیا اکاؤنٹ بنائیں'}
                {mode === 'admin' && 'Admin Portal Access / ایڈمن لاگ ان'}
                {mode === 'reset' && 'Reset Password / پاسورڈ ری سیٹ'}
              </h3>
              <p className="text-xs text-emerald-200">Noorani Poultry Farm</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers if not reset */}
        {mode !== 'reset' && (
          <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-emerald-900 border-b-2 border-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Farmer Login
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-emerald-900 border-b-2 border-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => switchTab('admin')}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                mode === 'admin'
                  ? 'bg-white text-emerald-900 border-b-2 border-amber-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admin Panel
            </button>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Admin Credentials Banner with 1-Click Login */}
          {mode === 'admin' && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>نیا ایڈمن پاسورڈ تیار ہے</span>
                </span>
                <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded font-mono font-bold">
                  Active
                </span>
              </div>
              <div className="text-[11px] font-mono text-amber-900 space-y-0.5 bg-white p-2 rounded-lg border border-amber-200">
                <div>Username: <strong className="text-slate-900 font-bold">admin</strong></div>
                <div>New Password: <strong className="text-emerald-800 font-bold">admin123</strong></div>
              </div>
              <button
                type="button"
                onClick={handleInstantAdminLogin}
                disabled={loading}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ایک کلک سے ایڈمن لاگ ان کریں (Instant Login)</span>
              </button>
            </div>
          )}

          {/* 1. Username Field (Common to login, register, admin) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {mode === 'login' ? 'Username or Mobile Number / یوزر نیم یا نمبر' : 'Username / یوزر نیم'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder={mode === 'login' ? 'e.g. farooq12 or 03001234567' : 'e.g. farooq12'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 2. Mobile Number (Strictly for register and reset) */}
          {(mode === 'register' || mode === 'reset') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number / موبائل نمبر (11 ہندسے)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="03001234567"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* 3. Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {mode === 'reset' ? 'New Password / نیا پاسورڈ' : 'Password / پاسورڈ'}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setErrorMessage(''); }}
                  className="text-xs text-emerald-700 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder={mode === 'admin' ? 'admin123' : 'پاسورڈ درج کریں'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 4. Confirm Password (Only for register and reset) */}
          {(mode === 'register' || mode === 'reset') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password / کنفرم پاسورڈ
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="دوبارہ پاسورڈ درج کریں"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#064E3B] hover:bg-[#053F30] text-white font-semibold rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm mt-2"
          >
            {loading ? (
              <span>براہ کرم انتظار کریں...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'لاگ ان کریں (Sign In)'}
                  {mode === 'register' && 'اکاؤنٹ بنائیں (Sign Up)'}
                  {mode === 'admin' && 'ایڈمن پینل لاگ ان (Admin Access)'}
                  {mode === 'reset' && 'پاسورڈ ری سیٹ کریں'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {mode === 'reset' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-slate-600 hover:text-emerald-800 font-medium cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
