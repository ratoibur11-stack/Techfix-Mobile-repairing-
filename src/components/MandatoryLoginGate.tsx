import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  Wrench, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  User as UserIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { CustomerUser } from '../types';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/firebase';
import { processUserLoginProfile } from '../lib/authUtils';
import { BUSINESS_DETAILS } from '../data/initialData';

interface MandatoryLoginGateProps {
  onCustomerLogin: (user: CustomerUser) => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const MandatoryLoginGate: React.FC<MandatoryLoginGateProps> = ({
  onCustomerLogin
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      const profile = processUserLoginProfile(user);
      onCustomerLogin(profile);
    } catch (err: any) {
      console.warn('Customer Google Sign-In note:', err);
      setErrorMsg('Google Sign-In was cancelled or popup was closed. You can also sign in with Email & Password below.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!passwordInput || passwordInput.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const cleanEmail = emailInput.trim();

    try {
      if (authMode === 'signup') {
        const displayName = nameInput.trim() || cleanEmail.split('@')[0];
        const user = await signUpWithEmail(cleanEmail, passwordInput, displayName);
        const profile = processUserLoginProfile(user);
        onCustomerLogin(profile);
      } else {
        const user = await signInWithEmail(cleanEmail, passwordInput);
        const profile = processUserLoginProfile(user);
        onCustomerLogin(profile);
      }
    } catch (err: any) {
      console.warn('Authentication error:', err?.code, err?.message);
      let errorText = 'Authentication failed. Please verify your email and password.';
      
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        errorText = 'Incorrect password. Please verify your credentials and try again.';
      } else if (err?.code === 'auth/user-not-found') {
        errorText = 'No account found with this email. Please switch to "Sign Up" to create an account.';
      } else if (err?.code === 'auth/email-already-in-use') {
        errorText = 'An account with this email already exists. Please switch to "Sign In" to log in.';
      } else if (err?.message) {
        errorText = err.message;
      }

      setErrorMsg(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-slate-950 flex flex-col justify-between text-slate-100 font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Wrench className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  TECHFIX
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30 font-bold">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Goalpara, Assam • Mobile Repairing & Accessories Lab
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{BUSINESS_DETAILS.phone}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>{BUSINESS_DETAILS.address}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Gate Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4 z-10">
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 backdrop-blur-xl">
          
          {/* Header & Lock Notice */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-xl shadow-cyan-500/20 mb-1">
              <Lock className="w-7 h-7 text-white" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Account Login Required
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sign In to Your TECHFIX Account
            </h1>

            {/* Privacy Explanation */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-left space-y-1.5">
              <p className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Private & Secure Portal Access</span>
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Please log in with your account to access repair services. <strong>You will only see the smartphone repairs and quotations submitted by you</strong>. Your repair details and account activity are strictly private and cannot be viewed by other users.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* One-Click Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm rounded-2xl shadow-lg shadow-white/5 transition flex items-center justify-center gap-3 border border-slate-300 cursor-pointer disabled:opacity-50"
          >
            <GoogleIcon />
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
              OR WITH EMAIL & PASSWORD
            </span>
          </div>

          {/* Switch Tab: Login vs Sign Up */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                authMode === 'login'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                authMode === 'signup'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Email / Gmail Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimum 6 characters"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying account...</span>
              ) : (
                <>
                  <span>{authMode === 'signup' ? 'Create Account & Enter Portal' : 'Login to My Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Guarantee Footer Note */}
          <div className="text-center pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>All user data is encrypted and strictly scoped to individual user accounts.</span>
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3 px-4 text-center text-[11px] text-slate-500">
        © {new Date().getFullYear()} TECHFIX PRO. All rights reserved. Goalpara, Assam.
      </footer>
    </div>
  );
};
