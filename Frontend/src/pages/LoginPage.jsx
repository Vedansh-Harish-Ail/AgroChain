import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { Mail, Lock, Eye, EyeOff, Sparkles, SunIcon as Sunburst } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    showLoading("Verifying your credentials & logging in...");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);
    hideLoading();

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-6 px-4">
      <div className="w-full relative max-w-5xl overflow-hidden flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60">
        
        {/* Left Content Section */}
        <div className="bg-black text-white p-8 md:p-12 md:w-1/2 relative overflow-hidden flex flex-col justify-between min-h-[350px] md:min-h-[550px]">
          {/* Gradients and shapes overlay */}
          <div 
            className="w-full h-full z-[2] absolute inset-0 opacity-90"
            style={{
              background: 'linear-gradient(to top, transparent, rgba(0,0,0,0.95))'
            }}
          />
          <div className="flex absolute inset-0 z-[2] overflow-hidden backdrop-blur-2xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-[40rem] w-[4rem] opacity-30 overflow-hidden"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.85) 69%, rgba(255,255,255,0.15) 100%)'
                }}
              />
            ))}
          </div>
          <div className="w-[15rem] h-[15rem] bg-emerald-600 absolute z-[1] rounded-full bottom-0 left-0 -translate-x-1/4 translate-y-1/4 blur-2xl opacity-75"></div>
          <div className="w-[8rem] h-[5rem] bg-white absolute z-[1] rounded-full bottom-0 left-4 blur-xl opacity-30"></div>
          <div className="w-[8rem] h-[5rem] bg-white absolute z-[1] rounded-full bottom-0 left-12 blur-xl opacity-20"></div>

          {/* Logo / Brand */}
          <div className="flex items-center gap-2 text-lg font-bold z-10 relative">
            <div className="size-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="size-4 text-emerald-400 animate-pulse" />
            </div>
            <span className="tracking-wide text-base">AgroChain</span>
          </div>

          {/* Slogan */}
          <h1 className="text-2xl md:text-3xl font-medium leading-tight z-10 tracking-tight relative mt-auto">
            Secure & transparent agricultural supply chain powered by Blockchain.
          </h1>
        </div>

        {/* Right Login Section */}
        <div className="p-8 md:p-12 md:w-1/2 flex flex-col justify-center bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 z-10">
          <div className="flex flex-col items-start mb-8">
            <div className="text-emerald-600 mb-4 bg-emerald-500/10 p-2.5 rounded-2xl">
              <Sunburst className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-medium mb-1.5 tracking-tight text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-left text-slate-500 dark:text-slate-400 text-sm">
              Sign in to access your AgroChain portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm mb-2 font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  placeholder="name@example.com"
                  className="text-sm w-full py-2.5 pl-10 pr-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2 font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className="text-sm w-full py-2.5 pl-10 pr-10 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-600/10 mt-2"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center text-slate-500 dark:text-slate-400 text-sm mt-3">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-emerald-600 hover:underline">
                Register here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
