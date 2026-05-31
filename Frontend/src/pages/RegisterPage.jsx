import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { UserPlus, User, Mail, Lock, Briefcase, Wallet, ShieldCheck, ChevronRight } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { walletAddress, isConnected, connectWallet } = useWallet();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CONSUMER');
  const [customWallet, setCustomWallet] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const navigate = useNavigate();

  const handleWalletLink = async () => {
    if (!isConnected) {
      const address = await connectWallet();
      if (address) setCustomWallet(address);
    } else {
      setCustomWallet(walletAddress);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const activeWallet = customWallet || (isConnected ? walletAddress : '');

    const result = await register(name, email, password, role, activeWallet);
    setLoading(false);

    if (result.success) {
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Join AgroChain's verified agriculture network
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            {success}
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  System Role
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  >
                    <option value="CONSUMER">Consumer / Investor</option>
                    <option value="FARMER">Farmer</option>
                    <option value="TESTER">Quality Authority</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {role === 'FARMER' ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/10">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Quick Onboarding Enabled</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">Farmers do not need a digital wallet to start. You can securely link one later when you need to verify crops.</p>
                  </div>
                </div>
                {!showWallet && (
                  <button 
                    type="button"
                    onClick={() => setShowWallet(true)}
                    className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
                  >
                    I have a wallet already <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Recommended: Link your MetaMask wallet now for full Web3 functionality.</p>
                <button
                  type="button"
                  onClick={handleWalletLink}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm"
                >
                  <Wallet className="h-4 w-4" /> {isConnected ? 'Wallet Connected' : 'Connect MetaMask'}
                </button>
              </div>
            )}

            {(showWallet || role !== 'FARMER') && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Wallet Address (Optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Wallet className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={customWallet || (isConnected ? walletAddress : '')}
                    onChange={(e) => setCustomWallet(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                    placeholder="0x..."
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Create {role.charAt(0) + role.slice(1).toLowerCase()} Account
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
