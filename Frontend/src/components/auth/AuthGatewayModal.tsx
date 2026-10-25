import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

export const AuthGatewayModal: React.FC = () => {
  const { login, enterDemoMode, isLoading } = useAuth();

  // Mode: 'login' | 'demo_name' | 'forgot_email' | 'forgot_otp'
  const [viewMode, setViewMode] = useState<'login' | 'demo_name' | 'forgot_email' | 'forgot_otp'>('login');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status & Error
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your username/email and password');
      return;
    }

    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
      setError(msg);
    }
  };

  const handleLaunchDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName.trim()) {
      setError('Please enter your name to personalize your demo experience');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await enterDemoMode(demoName.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Please enter your registered email address');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authService.forgotPassword(resetEmail.trim());
      setSuccessMsg(`Verification code sent! Please check ${resetEmail.trim()}`);
      setViewMode('forgot_otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !newPassword.trim()) {
      setError('Please fill in both the OTP code and your new password');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authService.resetPassword(resetEmail.trim(), otpCode.trim(), newPassword);
      setSuccessMsg('Password reset successfully! Please sign in with your new password.');
      setViewMode('login');
      setPassword('');
      setIdentifier(resetEmail);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check your OTP code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08120D]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
        {/* Modal Top Header with Logo */}
        <div className="p-6 pb-4 text-center border-b border-[#DCE9E1]/80 dark:border-[#20372B]/80 bg-gradient-to-b from-[#E8F7EF]/40 dark:from-[#13261C]/40 to-transparent">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-[#13261C] p-1 border border-[#DCE9E1] dark:border-[#20372B] shadow-sm mb-3">
            <img src="/aiu-logo.webp" alt="AIU Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h2 className="text-xl font-extrabold text-[#17211B] dark:text-[#EAF7EF] tracking-tight flex items-center justify-center gap-2">
            AIU Workspace
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] uppercase tracking-wide">
              Secure Cloud
            </span>
          </h2>
          <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-1 font-medium">
            Personal Productivity & Knowledge Architecture
          </p>
        </div>

        {/* Alerts: Error & Success */}
        <div className="px-6 pt-4">
          {error && (
            <div className="p-3 mb-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 mb-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* View Mode 1: Standard Login Form */}
        {viewMode === 'login' && (
          <form onSubmit={handleLogin} className="p-6 pt-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="AIUAdmin or your@email.com"
                  autoComplete="username"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  required
                />
                <User className="w-4 h-4 text-[#8A9890] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('forgot_email');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] font-semibold text-[#237A57] dark:text-[#6DD6A0] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-mono"
                  required
                />
                <Lock className="w-4 h-4 text-[#8A9890] absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Workspace'}</span>
            </button>

            {/* Divider for Live Demo */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#DCE9E1] dark:border-[#20372B]"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-[#8A9890] dark:text-[#6F8A7A] uppercase tracking-wider">
                Or Explore Publicly
              </span>
              <div className="flex-grow border-t border-[#DCE9E1] dark:border-[#20372B]"></div>
            </div>

            {/* Launch Live Demo CTA */}
            <button
              type="button"
              onClick={() => {
                setViewMode('demo_name');
                setError(null);
                setSuccessMsg(null);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 group"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Explore Live Demo (Interactive Sandbox)</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="text-[10px] text-center text-[#8A9890] dark:text-[#6F8A7A] pt-1">
              Private invite-only cloud • Authorized accounts only
            </p>
          </form>
        )}

        {/* View Mode 2: Demo Name Gate */}
        {viewMode === 'demo_name' && (
          <form onSubmit={handleLaunchDemo} className="p-6 pt-2 space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#E8F7EF] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-xs space-y-1">
              <span className="font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#237A57] dark:text-[#6DD6A0]" />
                Interactive Workspace Tour
              </span>
              <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] leading-relaxed">
                Test features, aviation goals, IT projects, and rich task breakdown with full interactive sandbox access.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1.5">
                Your Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  placeholder="e.g. Kasun Fernando / Dr. Kevin"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  autoFocus
                  required
                />
                <User className="w-4 h-4 text-[#8A9890] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              <span>Launch Personalized Tour</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setError(null);
              }}
              className="w-full text-center text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-colors cursor-pointer py-1"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* View Mode 3: Forgot Password (Email Step) */}
        {viewMode === 'forgot_email' && (
          <form onSubmit={handleRequestOtp} className="p-6 pt-2 space-y-4">
            <div className="text-xs text-[#66736B] dark:text-[#9BB5A5] leading-relaxed">
              Enter your registered email address. We will generate and send a 6-digit verification code to your email.
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  autoFocus
                  required
                />
                <Mail className="w-4 h-4 text-[#8A9890] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>Send 6-Digit Verification Code</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setError(null);
              }}
              className="w-full text-center text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-colors cursor-pointer py-1"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* View Mode 4: Reset Password (OTP Code + New Password) */}
        {viewMode === 'forgot_otp' && (
          <form onSubmit={handleResetPassword} className="p-6 pt-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1.5">
                6-Digit Verification Code (OTP)
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full text-center tracking-widest text-base font-mono py-2 rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-bold"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Reset Password & Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('forgot_email');
                setError(null);
              }}
              className="w-full text-center text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-colors cursor-pointer py-1"
            >
              ← Resend Code / Change Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
