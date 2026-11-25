import React, { useState } from 'react';
import { 
  Sprout, Coins, FileCheck, ShieldCheck, Cpu, Eye, Settings, 
  Key, Check, Copy, Info, ShieldAlert, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { TEST_ROLES, MAX_TEST_ENTRIES, WARNING_THRESHOLD } from '../utils/testSessionManager';

export default function TestCredentialsNotice({ onSelectCredentials, activeRole, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedRole, setSelectedRole] = useState(activeRole || 'farmer');
  const [copiedKey, setCopiedKey] = useState(null);

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'farmer': return <Sprout className="h-4 w-4 text-emerald-600" />;
      case 'investor': return <Coins className="h-4 w-4 text-amber-600" />;
      case 'inspector': return <FileCheck className="h-4 w-4 text-sky-600" />;
      case 'cop': return <ShieldCheck className="h-4 w-4 text-indigo-600" />;
      case 'tester': return <Cpu className="h-4 w-4 text-purple-600" />;
      case 'consumer': return <Eye className="h-4 w-4 text-teal-600" />;
      case 'admin': return <Settings className="h-4 w-4 text-rose-600" />;
      default: return <Key className="h-4 w-4 text-emerald-600" />;
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleSelect = (role) => {
    setSelectedRole(role.id);
    if (onSelectCredentials) {
      onSelectCredentials({
        identifier: role.username,
        email: role.email,
        password: role.passwords[0],
        role: role.role
      });
    }
  };

  const currentRoleObj = TEST_ROLES.find(r => r.id === selectedRole) || TEST_ROLES[0];

  return (
    <div className="w-full rounded-2xl bg-white border-2 border-emerald-500/40 p-4 shadow-2xl text-left transition-all text-slate-900">
      {/* Top Banner Notice */}
      <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 shadow-sm">
            <Key className="size-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Demo & Reviewer Access
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                <ShieldAlert className="size-3 text-amber-600" /> Max {MAX_TEST_ENTRIES} Entries / Session
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">
              Test Credentials Required
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-700 hover:text-emerald-700 flex items-center gap-1 font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition shrink-0 shadow-sm"
          aria-label="Toggle test credentials details"
        >
          {isExpanded ? (
            <>Hide <ChevronUp className="size-3.5" /></>
          ) : (
            <>View Roles <ChevronDown className="size-3.5" /></>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
        Visiting from a portfolio, resume, or recruiter link? Select any role below to review module-specific credentials or click <span className="font-bold text-emerald-600">"Auto-Fill Credentials"</span>.
      </p>

      {isExpanded && (
        <div className="mt-3.5 space-y-3 animate-in fade-in duration-200">
          {/* Role Selection Tabs / Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-300">
            {TEST_ROLES.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelect(role)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {getRoleIcon(role.id)}
                  <span>{role.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Role Credentials Card */}
          <div className="rounded-xl p-3 bg-slate-50 border border-slate-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  {getRoleIcon(currentRoleObj.id)}
                  {currentRoleObj.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 font-semibold shadow-sm">
                  {currentRoleObj.badge}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleSelect(currentRoleObj)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition flex items-center gap-1"
              >
                <Sparkles className="size-3" /> Auto-Fill Credentials
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">Module:</span> {currentRoleObj.module}
            </p>

            {/* Credential Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              {/* Username */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Username</span>
                  <span className="font-bold text-emerald-700">{currentRoleObj.username}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(currentRoleObj.username, 'user')}
                  className="text-slate-400 hover:text-slate-700 transition p-1"
                  title="Copy username"
                >
                  {copiedKey === 'user' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              {/* Email */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="truncate pr-1">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Email</span>
                  <span className="font-bold text-slate-800 truncate block">{currentRoleObj.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(currentRoleObj.email, 'email')}
                  className="text-slate-400 hover:text-slate-700 transition p-1 shrink-0"
                  title="Copy email"
                >
                  {copiedKey === 'email' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              {/* Password */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans font-bold">Password</span>
                  <span className="font-bold text-emerald-700">{currentRoleObj.passwords[0]}</span>
                  <span className="text-[9px] text-slate-500 block font-sans">({currentRoleObj.passwords[1]}, {currentRoleObj.passwords[2]})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(currentRoleObj.passwords[0], 'pwd')}
                  className="text-slate-400 hover:text-slate-700 transition p-1"
                  title="Copy password"
                >
                  {copiedKey === 'pwd' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Session Limits & Protection Notice */}
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-start gap-2 text-[11px] text-slate-600 leading-tight">
              <Info className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-800">Session Entry Policy:</strong> Capped at <strong>{MAX_TEST_ENTRIES} entries</strong> per session. You will receive an alert upon reaching {WARNING_THRESHOLD} entries. If a 6th entry is attempted, the earliest entry is automatically deleted. Production database writes are safely bypassed.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
