import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { apiLogin, getProfile } from '../utils/udyanStorage';

const LogoIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 256 256"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 128.005 191.173 C 128.448 156.208 156.93 128 192 128 L 192 64 L 128 64 C 128 99.346 99.346 128 64 128 L 64 192 L 128 192 Z M 192 256 L 64 256 C 28.654 256 0 227.346 0 192 L 0 64 L 64 64 L 64 0 L 192 0 C 227.346 0 256 28.654 256 64 L 256 192 L 192 192 Z" />
  </svg>
);

const AuthShell: React.FC<{ children: React.ReactNode; title: string; description: string }> = ({
  children,
  title,
  description,
}) => (
  <div className="min-h-screen bg-[#F4F2F7] text-[#0D0D0D] relative overflow-hidden font-norms">
    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#D9D2F0] blur-3xl opacity-80" />
    <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-[#BFB7E3] blur-3xl opacity-70" />
    <div className="absolute top-1/4 left-8 w-40 h-40 rounded-full border border-[#D9D2F0] opacity-70" />
    <div className="absolute bottom-16 right-10 w-56 h-56 rounded-full border border-[#BFB7E3] opacity-60" />

    <div className="relative z-10 min-h-screen flex flex-col">
      <header className="px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-[#0D0D0D]">
            <LogoIcon className="w-8 h-8 text-[#7E78B5]" />
            <span className="text-2xl font-medium tracking-tight">Udyam-AI</span>
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-full text-[#4B4963] hover:text-[#0D0D0D] font-medium transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-full bg-[#0D0D0D] text-[#F4F2F7] hover:bg-[#4B4963] transition-colors font-medium"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <section className="hidden lg:block">
            <div className="relative rounded-[2rem] overflow-hidden min-h-[34rem] border border-[#D9D2F0] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#F4F2F7] via-[#D9D2F0] to-[#7E78B5]" />
              <div className="absolute inset-0 opacity-35" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #4B4963 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }} />
              <div className="absolute inset-x-0 bottom-0 p-10 text-[#0D0D0D]">
                <p className="inline-flex items-center px-4 py-2 rounded-full bg-[#F4F2F7]/80 text-sm font-medium backdrop-blur">
                  AI compliance copilot
                </p>
                <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight">
                  Manage compliance from one intelligent workspace.
                </h1>
                <p className="mt-5 text-[#4B4963] text-lg leading-relaxed max-w-lg">
                  Track licenses, renewals, documents, and government form workflows with Udyam-AI.
                </p>
              </div>
            </div>
          </section>

          <section className="w-full max-w-md mx-auto lg:max-w-none">
            <div className="mb-8">
              <p className="text-[#7E78B5] font-semibold tracking-wide text-sm uppercase">{title}</p>
              <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-[#0D0D0D]">{description}</h1>
            </div>
            {children}
          </section>
        </div>
      </main>
    </div>
  </div>
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Status states
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const data = await apiLogin(email, password);
      
      if (data.onboardingCompleted) {
        navigate('/udyan');
      } else {
        // Fetch profile to verify Aadhaar/PAN status
        const profile = await getProfile();
        if (profile.aadhaar || profile.pan) {
          navigate('/udyan/onboarding');
        } else {
          navigate('/udyan/identity');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" description="Log in to your Udyam-AI workspace.">
      <form onSubmit={handleSubmit} className="rounded-[2rem] bg-[#E7E4EE] border border-[#D9D2F0] shadow-xl p-6 md:p-8">
        {errorMsg && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 items-center text-red-700">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#4B4963] mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A79FD8]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#F4F2F7] border border-[#BFB7E3] text-[#0D0D0D] placeholder:text-[#A79FD8] focus:outline-none focus:ring-2 focus:ring-[#7E78B5] focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#4B4963] mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A79FD8]" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#F4F2F7] border border-[#BFB7E3] text-[#0D0D0D] placeholder:text-[#A79FD8] focus:outline-none focus:ring-2 focus:ring-[#7E78B5] focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((open) => !open)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7E78B5] hover:text-[#0D0D0D] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-[#4B4963] cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[#BFB7E3] text-[#7E78B5] focus:ring-[#7E78B5]"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-[#7E78B5] hover:text-[#0D0D0D] transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#0D0D0D] text-[#F4F2F7] text-base font-semibold hover:bg-[#4B4963] transition-colors flex justify-center items-center gap-2 disabled:bg-gray-600"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              'Log in'
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-[#4B4963]">
          Do not have an account?{' '}
          <Link to="/signup" className="font-semibold text-[#7E78B5] hover:text-[#0D0D0D] transition-colors">
            Sign up
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
