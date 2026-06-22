import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import {
  UserPlus, User, Mail, Lock, Briefcase, Wallet,
  ShieldCheck, ChevronRight, Sparkles, Eye, EyeOff,
  Phone, KeyRound, Upload, X, FileText, HelpCircle
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
  const [labName, setLabName] = useState('');
  const [authorizedPerson, setAuthorizedPerson] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [labLicenseNumber, setLabLicenseNumber] = useState('');
  const [accreditationNumber, setAccreditationNumber] = useState('');
  const [govRegNumber, setGovRegNumber] = useState('');
  const [labCertificates, setLabCertificates] = useState([]);
  const [supportingDocuments, setSupportingDocuments] = useState([]);
  const [uploadingCerts, setUploadingCerts] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const getOriginalFilename = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) {
      return url.startsWith('data:image/') ? 'Uploaded Image' : 'Uploaded PDF';
    }
    try {
      const filenameWithUuid = url.substring(url.lastIndexOf('/') + 1);
      const separatorIndex = filenameWithUuid.indexOf('_');
      if (separatorIndex !== -1) {
        return filenameWithUuid.substring(separatorIndex + 1);
      }
      return filenameWithUuid;
    } catch (e) {
      return url;
    }
  };

  const handleCertUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingCerts(true);
    setError('');

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/auth/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setLabCertificates(prev => [...prev, data.url]);
      } else {
        setError('Failed to upload certificate.');
      }
    } catch (err) {
      console.error(err);
      setError('Error uploading certificate: ' + err.message);
    } finally {
      setUploadingCerts(false);
    }
  };

  const removeCert = (idx) => {
    setLabCertificates(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDocUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingDocs(true);
    setError('');

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/auth/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setSupportingDocuments(prev => [...prev, data.url]);
      } else {
        setError('Failed to upload document.');
      }
    } catch (err) {
      console.error(err);
      setError('Error uploading document: ' + err.message);
    } finally {
      setUploadingDocs(false);
    }
  };

  const removeDoc = (idx) => {
    setSupportingDocuments(prev => prev.filter((_, i) => i !== idx));
  };

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
  const [showWalletHelp, setShowWalletHelp] = useState(false);
  const [showTesterModal, setShowTesterModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
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

  const handleRoleChange = (e) => {
    const val = e.target.value;
    setRole(val);
    if (val === 'TESTER') {
      setShowTesterModal(true);
    }
  };

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

    if (role === 'TESTER' && !agreeTerms) {
      setError('You must agree to the terms and conditions to apply as a Quality Lab.');
      return;
    }

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

    let locationData = {};
    if (role === 'INSPECTOR') {
      locationData = { district, pin_code: pinCode, coverage_pins: coveragePins };
    } else if (role === 'TESTER') {
      locationData = {
        district,
        pin_code: pinCode,
        coverage_pins: coveragePins,
        sub_district: subDistrict,
        lab_name: labName,
        authorized_person: authorizedPerson,
        lab_license_number: labLicenseNumber,
        accreditation_number: accreditationNumber,
        gov_reg_number: govRegNumber,
        lab_certificates: labCertificates,
        supporting_documents: supportingDocuments
      };
    }

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
                    onChange={handleRoleChange}
                    className="text-xs w-full py-2 pl-9 pr-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="CONSUMER">Consumer</option>
                    <option value="INVESTOR">Investor</option>
                    <option value="FARMER">Farmer</option>
                    <option value="TESTER">Quality Lab</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Fields for Verifiers */}
            {['INSPECTOR', 'TESTER'].includes(role) && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3 dark:border-blue-950/20 dark:bg-blue-950/10 mb-1 space-y-3">
                <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">Location Assignment Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">District</label>
                    <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} required={['INSPECTOR', 'TESTER'].includes(role)} placeholder="E.g. Ernakulam" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                  {role === 'TESTER' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Sub-District (Taluk)</label>
                      <input type="text" value={subDistrict} onChange={(e) => setSubDistrict(e.target.value)} required={role === 'TESTER'} placeholder="E.g. Aluva" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-emerald-500" />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Base PIN Code</label>
                    <input type="text" value={pinCode} onChange={(e) => setPinCode(e.target.value)} required={['INSPECTOR', 'TESTER'].includes(role)} placeholder="E.g. 682022" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                  <div className={role === 'TESTER' ? "sm:col-span-3" : ""}>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Coverage PINs (Comma sep)</label>
                    <input type="text" value={coveragePins} onChange={(e) => setCoveragePins(e.target.value)} placeholder="682022, 682024" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Private Quality Lab Registration Fields */}
            {role === 'TESTER' && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 dark:border-emerald-950/20 dark:bg-emerald-950/5 mb-1 space-y-3">
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 border-b border-slate-100 dark:border-slate-800 pb-1">Quality Lab Specifications</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Lab Name</label>
                    <input type="text" value={labName} onChange={(e) => setLabName(e.target.value)} required={role === 'TESTER'} placeholder="E.g. Kerala Food Quality Lab" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Authorized Person Name</label>
                    <input type="text" value={authorizedPerson} onChange={(e) => setAuthorizedPerson(e.target.value)} required={role === 'TESTER'} placeholder="E.g. Dr. Jane Smith" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Lab License Number</label>
                    <input type="text" value={labLicenseNumber} onChange={(e) => setLabLicenseNumber(e.target.value)} required={role === 'TESTER'} placeholder="LIC-9876543" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Accreditation Number</label>
                    <input type="text" value={accreditationNumber} onChange={(e) => setAccreditationNumber(e.target.value)} required={role === 'TESTER'} placeholder="ACR-12345" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">Government Registration Number</label>
                    <input type="text" value={govRegNumber} onChange={(e) => setGovRegNumber(e.target.value)} required={role === 'TESTER'} placeholder="REG-112233" className="text-xs w-full py-1.5 px-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-emerald-500" />
                  </div>
                </div>

                {/* Lab Certificates Upload Zone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Lab Certificates</label>
                  <div className="space-y-1.5 mb-2">
                    {labCertificates.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-[10px]">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[180px] font-medium">{getOriginalFilename(url)}</span>
                        </div>
                        <button type="button" onClick={() => removeCert(idx)} className="p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                    {uploadingCerts && (
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-[10px] text-slate-400">
                        <div className="h-3 w-3 animate-spin rounded-full border border-emerald-600 border-t-transparent"></div>
                        <span>Uploading certificate...</span>
                      </div>
                    )}
                  </div>
                  <div className="relative border border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500 rounded-xl p-3 transition text-center bg-white dark:bg-slate-955">
                    <input type="file" multiple accept=".pdf,.doc,.docx" onChange={handleCertUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingCerts} />
                    <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Drag & Drop files or click to upload certificates</p>
                  </div>
                </div>

                {/* Supporting Documents Upload Zone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Supporting Documents</label>
                  <div className="space-y-1.5 mb-2">
                    {supportingDocuments.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-[10px]">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[180px] font-medium">{getOriginalFilename(url)}</span>
                        </div>
                        <button type="button" onClick={() => removeDoc(idx)} className="p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                    {uploadingDocs && (
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-[10px] text-slate-400">
                        <div className="h-3 w-3 animate-spin rounded-full border border-emerald-600 border-t-transparent"></div>
                        <span>Uploading document...</span>
                      </div>
                    )}
                  </div>
                  <div className="relative border border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500 rounded-xl p-3 transition text-center bg-white dark:bg-slate-955">
                    <input type="file" multiple accept=".pdf,.doc,.docx" onChange={handleDocUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingDocs} />
                    <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Drag & Drop files or click to upload supporting docs</p>
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
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Recommended: Link your MetaMask wallet now for Web3 features.</p>
                  <button
                    type="button"
                    onClick={() => setShowWalletHelp(!showWalletHelp)}
                    className="text-[10px] text-emerald-600 hover:text-emerald-500 hover:underline font-semibold flex items-center gap-0.5 focus:outline-none"
                  >
                    <HelpCircle className="h-3 w-3" /> Need Help?
                  </button>
                </div>
                {showWalletHelp && (
                  <div className="mb-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                    <div>
                      <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs mb-1">What is MetaMask?</h4>
                      <p className="leading-relaxed">MetaMask is a free, secure digital wallet that acts as your <strong>digital signature card</strong> on the blockchain. On AgroBlock (agroblock.in), Agricultural Inspectors and Quality Labs use it to officially sign, verify, and lock crop logs, ensuring records can never be forged or tampered with.</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs mb-1">How do I setup and use it?</h4>
                      <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                        <li><strong>Install MetaMask</strong>: Download and install the MetaMask extension for your web browser (Chrome, Firefox, Edge) or mobile app from the official site: <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">metamask.io</a>.</li>
                        <li><strong>Create Your Wallet Account</strong>: Open the MetaMask extension, click "Create a New Wallet", and follow the setup prompts. 
                          <span className="block mt-0.5 text-amber-600 dark:text-amber-400 font-semibold">⚠️ Important: Write down your Secret Recovery Phrase on paper and keep it in a safe place. Never share it with anyone!</span>
                        </li>
                        <li><strong>Connect to AgroBlock</strong>: Click the <strong>"Connect MetaMask"</strong> button below. A MetaMask popup will appear asking you to authorize connection to <span className="font-semibold text-slate-850 dark:text-slate-250">agroblock.in</span>. Simply click "Next" and "Connect".</li>
                        <li><strong>Sign Blockchain Actions</strong>: When performing verification or certification duties, AgroBlock will trigger a MetaMask signature or confirmation request. Review the details in the popup and click "Sign" or "Confirm" to write the record permanently to the blockchain.</li>
                      </ol>
                    </div>

                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-500">
                      <strong>Note:</strong> Signing transactions requires a tiny amount of network gas (Ethereum). For testing, you can obtain free test tokens (Sepolia ETH) from a faucet.
                    </div>
                  </div>
                )}
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

            {role === 'TESTER' && (
               <div className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs animate-in fade-in duration-200">
                 <input
                   type="checkbox"
                   id="agreeTerms"
                   checked={agreeTerms}
                   onChange={(e) => setAgreeTerms(e.target.checked)}
                   className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                 />
                 <label htmlFor="agreeTerms" className="text-slate-600 dark:text-slate-400 select-none leading-relaxed cursor-pointer">
                   Ticking the box means accepting all the{' '}
                   <Link to="/terms" target="_blank" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                     terms and conditions
                   </Link>{' '}
                   for applying as a Quality Lab.
                 </label>
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
                  <UserPlus className="h-3.5 w-3.5" /> {role === 'TESTER' ? 'Apply for Quality Lab Account' : `Create ${role.charAt(0) + role.slice(1).toLowerCase()} Account`}
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

      {/* Quality Lab Notice Modal */}
      {showTesterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 bg-emerald-500/10 p-3 rounded-2xl w-fit text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-8 w-8 animate-bounce" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Quality Lab Application Notice
            </h3>
            
            <div className="text-slate-600 dark:text-slate-400 text-xs text-left space-y-2 mb-6">
              <p>
                Private Quality Labs cannot register instantly. Selecting this role initiates an official **verification application**.
              </p>
              <p>
                You will be required to provide your official lab license, accreditation, and registration details, as well as upload supporting certificates.
              </p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                After submission, the System Administrator will review your credentials. You will only be authorized to log in once your application is approved and your status becomes ACTIVE.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setShowTesterModal(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition shadow-md shadow-emerald-600/10"
            >
              I Understand & Proceed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
