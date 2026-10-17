import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  KeyRound, 
  ShieldCheck,
  Building,
  Terminal,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'admin' | 'reset';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccess,
}) => {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'admin' | 'reset'>(defaultMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        await signUp({ email, password, fullName, phone });
        setSuccessMsg('Account created successfully! You are now logged in.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else if (mode === 'login' || mode === 'admin') {
        await signIn({ email, password });
        setSuccessMsg('Signed in successfully.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 900);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySchemaPath = () => {
    navigator.clipboard.writeText('/supabase/schema.sql');
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0F2942] to-blue-900 text-white flex items-center justify-center shadow-md">
            {mode === 'admin' ? <ShieldCheck className="w-5 h-5 text-orange-400" /> : <User className="w-5 h-5 text-orange-400" />}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
              {mode === 'admin' ? 'Staff Authentication' : 'Supabase Auth Portal'}
            </span>
            <h3 className="text-xl font-extrabold text-[#0F2942] font-heading mt-0.5">
              {mode === 'register' && 'Create Customer Account'}
              {mode === 'login' && 'Customer Login'}
              {mode === 'admin' && 'Authorized Staff Login'}
              {mode === 'reset' && 'Reset Password'}
            </h3>
          </div>
        </div>

        {/* Supabase Not Configured Warning Helper */}
        {!isConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2 text-amber-900">
            <div className="flex items-center space-x-2 font-bold text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Connect Your Supabase Project</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your environment or secrets.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] border-t border-amber-200/60">
              <span>SQL Schema: <strong>/supabase/schema.sql</strong></span>
              <button
                type="button"
                onClick={handleCopySchemaPath}
                className="font-bold text-amber-900 hover:text-black underline flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedSql ? 'Copied!' : 'Copy Path'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Full Name & Phone (Register only) */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Full Name / Organization *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alhaji Babatunde Alabi"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-slate-800 font-medium focus:outline-none focus:border-orange-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-slate-800 font-medium focus:outline-none focus:border-orange-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-slate-800 font-medium focus:outline-none focus:border-orange-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Password (for login, register, admin) */}
          {mode !== 'reset' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-bold text-slate-700 uppercase">
                  Password *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-[11px] text-orange-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-slate-800 font-medium focus:outline-none focus:border-orange-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-slate-800 font-medium focus:outline-none focus:border-orange-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 shadow-md shadow-orange-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            <span>
              {loading ? 'Processing...' : (
                mode === 'register' ? 'Register Account' :
                mode === 'login' ? 'Sign In as Customer' :
                mode === 'admin' ? 'Verify Admin Staff Access' :
                'Send Password Reset Link'
              )}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Mode Switcher Tabs */}
        <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2 text-center text-xs">
          {mode === 'login' && (
            <>
              <p className="text-slate-600">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setMode('register');
                  }}
                  className="font-bold text-orange-600 hover:underline"
                >
                  Register Here
                </button>
              </p>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('admin');
                }}
                className="text-slate-400 hover:text-slate-700 text-[11px]"
              >
                Log in as authorized Staff / Admin
              </button>
            </>
          )}

          {mode === 'register' && (
            <p className="text-slate-600">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('login');
                }}
                className="font-bold text-orange-600 hover:underline"
              >
                Sign In
              </button>
            </p>
          )}

          {mode === 'admin' && (
            <p className="text-slate-600">
              Not staff?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('login');
                }}
                className="font-bold text-orange-600 hover:underline"
              >
                Return to Customer Login
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <p className="text-slate-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('login');
                }}
                className="font-bold text-orange-600 hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
