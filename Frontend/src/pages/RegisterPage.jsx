import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { 
  UserPlus, User, Mail, Lock, Briefcase, Wallet, 
  ShieldCheck, ChevronRight, Sparkles, Eye, EyeOff,
  Phone, KeyRound
} from 'lucide-react';

export default function RegisterPage() {
  const { register, sendSmsOtp, sendEmailOtp } = useAuth();
  const { walletAddress, isConnected, connectWallet } = useWallet();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CONSUMER');
  const [customWallet, setCustomWallet] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [coveragePins, setCoveragePins] = useState('');
  
  // Email OTP States
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  
  // SMS OTP States
  const [smsOtp, setSmsOtp] = useState('');
  const [smsOtpSent, setSmsOtpSent] = useState(false);
  const [sendingSmsOtp, setSendingSmsOtp] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  
  const [devOtpMessage, setDevOtpMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Email Countdown Effect
  useEffect(() => {
    let timer;
    if (emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  // SMS Countdown Effect
  useEffect(() => {
    let timer;
    if (smsCountdown > 0) {
      timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [smsCountdown]);

  const handleWalletLink = async () => {
    if (!isConnected) {
      const address = await connectWallet();
      if (address) setCustomWallet(address);
    } else {
      setCustomWallet(walletAddress);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!email) {
      setError('Please enter an email address first.');
      return;
    }
    setError('');
    setDevOtpMessage('');
    setSendingEmailOtp(true);
    const result = await sendEmailOtp(email);
    setSendingEmailOtp(false);
    if (result.success) {
      setEmailOtpSent(true);
      setSuccess('Email verification code sent successfully! Please check your inbox.');
      if (result.data?.dev_otp) {
        setDevOtpMessage(`Developer Fallback Email OTP: ${result.data.dev_otp}`);
      }
      setEmailCountdown(60);
    } else {
      setError(result.message);
    }
  };

  const handleSendSmsOtp = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number first.');
      return;
    }
    setError('');
    setDevOtpMessage('');
    setSendingSmsOtp(true);
    const result = await sendSmsOtp(phoneNumber);
    setSendingSmsOtp(false);
    if (result.success) {
      setSmsOtpSent(true);
      setSuccess('SMS OTP code generated! Check terminal or dev box.');
      if (result.data?.dev_otp) {
        setDevOtpMessage(`Developer Fallback SMS OTP: ${result.data.dev_otp}`);
      }
      setSmsCountdown(60);
    } else {
      setError(result.message);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!phoneNumber) {
      setError('Phone number is required.');
      return;
    }
    if (!emailOtp) {
      setError('Email verification OTP is required.');
      return;
    }
    if (!smsOtp) {
      setError('SMS verification OTP is required (type "123456" in dev).');
      return;
    }

    setLoading(true);

    const activeWallet = customWallet || (isConnected ? walletAddress : '');

    const locationData = ['INSPECTOR', 'TESTER'].includes(role) 
      ? { district, pin_code: pinCode, coverage_pins: coveragePins } 
      : {};

    const result = await register(name, email, password, role, activeWallet, phoneNumber, emailOtp, smsOtp, locationData);
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
    <div className="flex min-h-[75vh] items-center justify-center py-4 px-4">
      <div className="w-full relative max-w-6xl overflow-hidden flex flex-col md:flex-row-reverse bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60">
        
        {/* Right Content Section (Visual Panel) */}
        <div className="bg-black text-white p-6 md:p-8 md:w-[42%] relative overflow-hidden flex flex-col justify-between min-h-[180px] md:min-h-0">
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
          <div className="flex items-center gap-2 text-base font-bold z-10 relative">
            <div className="size-7 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="size-3.5 text-emerald-400 animate-pulse" />
            </div>
            <span className="tracking-wide text-sm">AgroChain</span>
          </div>

          {/* Slogan */}
          <h1 className="text-xl md:text-2xl font-medium leading-tight z-10 tracking-tight relative mt-auto md:mb-4">
            Join AgroChain's verified network for secure, decentralized agriculture trading.
          </h1>
        </div>

        {/* Left Login Section (Form) */}
        <div className="p-6 md:p-8 md:w-[58%] flex flex-col justify-center bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 z-10">
          <div className="flex flex-col items-start mb-4">
            <div className="text-emerald-600 mb-3 bg-emerald-500/10 p-2 rounded-xl">
              <UserPlus className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Create an Account
            </h2>
            <p className="text-left text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Register to join the verified agriculture supply chain
            </p>
          </div>

          {error && (
            <div className="p-2.5 mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30">
              {error}
            </div>
          )}

          {success && (
            <div className="p-2.5 mb-3 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
            
            {/* Full Name & Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    required
                    placeholder="John Doe"
                    className="text-xs w-full py-2 pl-9 pr-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    className="text-xs w-full py-2 pl-9 pr-9 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400"
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
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Email Address & Email OTP Verification Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative flex gap-2">
                  <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      placeholder="name@example.com"
                      disabled={emailOtpSent}
                      className="text-xs w-full py-2 pl-9 pr-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 disabled:opacity-70"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    disabled={sendingEmailOtp || emailCountdown > 0}
                    onClick={handleSendEmailOtp}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {sendingEmailOtp ? 'Sending...' : emailCountdown > 0 ? `Resend (${emailCountdown}s)` : emailOtpSent ? 'Resend Code' : 'Send Code'}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="emailOtp" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email OTP Code {emailOtpSent && <span className="text-emerald-600 dark:text-emerald-400 font-normal">(Sent)</span>}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyRound className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="emailOtp"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit Email OTP"
                    disabled={!emailOtpSent}
                    className="text-xs w-full py-2 pl-9 pr-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 disabled:opacity-50"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Phone Number & SMS OTP Verification Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative flex gap-2">
                  <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      id="phoneNumber"
                      required
                      placeholder="+919876543210"
                      disabled={smsOtpSent}
                      className="text-xs w-full py-2 pl-9 pr-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 disabled:opacity-70"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={sendingSmsOtp || smsCountdown > 0}
                    onClick={handleSendSmsOtp}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {sendingSmsOtp ? 'Sending...' : smsCountdown > 0 ? `Resend (${smsCountdown}s)` : smsOtpSent ? 'Resend Code' : 'Send Code'}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="smsOtp" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SMS OTP Code {smsOtpSent && <span className="text-emerald-600 dark:text-emerald-400 font-normal">(Sent)</span>}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyRound className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="smsOtp"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit SMS OTP"
                    disabled={!smsOtpSent}
                    className="text-xs w-full py-2 pl-9 pr-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 disabled:opacity-50"
                    value={smsOtp}
                    onChange={(e) => setSmsOtp(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* System Role Row */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label htmlFor="role" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  System Role
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="text-xs w-full py-2 pl-9 pr-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="CONSUMER">Consumer / Investor (Legacy)</option>
                    <option value="INVESTOR">Investor</option>
                    <option value="FARMER">Farmer</option>
                    <option value="INSPECTOR">Agricultural Inspector</option>
                    <option value="TESTER">Quality Lab</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Fields for Verifiers */}
            {['INSPECTOR', 'TESTER'].includes(role) && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3 dark:border-blue-950/20 dark:bg-blue-950/10 mb-1">
                <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 mb-2">Location Assignment Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">District</label>
                    <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} required={['INSPECTOR', 'TESTER'].includes(role)} placeholder="E.g. Pune" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Base PIN Code</label>
                    <input type="text" value={pinCode} onChange={(e) => setPinCode(e.target.value)} required={['INSPECTOR', 'TESTER'].includes(role)} placeholder="E.g. 411001" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Coverage PINs (Comma sep)</label>
                    <input type="text" value={coveragePins} onChange={(e) => setCoveragePins(e.target.value)} placeholder="411001, 411002" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                </div>
              </div>
            )}



            {devOtpMessage && (
              <div className="p-2.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30 flex items-center justify-between font-mono">
                <span>{devOtpMessage}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(devOtpMessage.split(': ')[1]);
                    setSuccess('OTP copied to clipboard!');
                    setTimeout(() => setSuccess(''), 2000);
                  }}
                  className="text-[10px] font-bold text-amber-800 dark:text-amber-300 underline uppercase"
                >
                  Copy
                </button>
              </div>
            )}

            {/* Compact Conditional Wallet Section */}
            {['INSPECTOR', 'TESTER', 'ADMIN'].includes(role) && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-3 dark:border-slate-800 dark:bg-slate-950/30">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Recommended: Link your MetaMask wallet now for Web3 features.</p>
                <button
                  type="button"
                  onClick={handleWalletLink}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm"
                >
                  <Wallet className="h-3.5 w-3.5" /> {isConnected ? 'Wallet Connected' : 'Connect MetaMask'}
                </button>
              </div>
            )}

            {['INSPECTOR', 'TESTER', 'ADMIN'].includes(role) && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <label htmlFor="wallet" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Wallet Address (Optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Wallet className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="wallet"
                    value={customWallet || (isConnected ? walletAddress : '')}
                    onChange={(e) => setCustomWallet(e.target.value)}
                    className="text-xs w-full py-2 pl-9 pr-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400"
                    placeholder="0x..."
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-600/10 mt-1"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="flex items-center gap-1.5 text-xs">
                  <UserPlus className="h-3.5 w-3.5" /> Create {role.charAt(0) + role.slice(1).toLowerCase()} Account
                </span>
              )}
            </button>

            <div className="text-center text-slate-500 dark:text-slate-400 text-xs mt-1.5">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
                Login here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
