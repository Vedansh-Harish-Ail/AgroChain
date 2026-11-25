import React, { useState } from 'react';
import { 
  Sprout, Coins, FileCheck, ShieldCheck, Cpu, Eye, Settings, 
  Key, Check, Copy, Info, AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { TEST_ROLES, MAX_TEST_ENTRIES, WARNING_THRESHOLD } from '../utils/testSessionManager';

export default function TestCredentialsNotice({ onSelectCredentials, activeRole }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedRole, setSelectedRole] = useState(activeRole || 'farmer');
  const [copiedKey, setCopiedKey] = useState(null);

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'farmer': return <Sprout className="h-4 w-4 text-emerald-500" />;
      case 'investor': return <Coins className="h-4 w-4 text-amber-500" />;
      case 'inspector': return <FileCheck className="h-4 w-4 text-sky-500" />;
      case 'cop': return <ShieldCheck className="h-4 w-4 text-indigo-500" />;
      case 'tester': return <Cpu className="h-4 w-4 text-purple-500" />;
      case 'consumer': return <Eye className="h-4 w-4 text-teal-500" />;
      case 'admin': return <Settings className="h-4 w-4 text-rose-500" />;
      default: return <Key className="h-4 w-4 text-emerald-500" />;
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
    <div className="w-full mb-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 dark:from-emerald-950/20 dark:via-slate-900/90 dark:to-slate-950 p-4 shadow-lg backdrop-blur-sm text-left transition-all">
      {/* Top Banner Notice */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Key className="size-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-400/10">
                Demo & Reviewer Access
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <ShieldAlert className="size-3" /> Max {MAX_TEST_ENTRIES} Entries / Session
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
              Test Credentials Required
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-medium transition"
          aria-label="Toggle test credentials details"
        >
          {isExpanded ? (
            <>Hide <ChevronUp className="size-4" /></>
          ) : (
            <>View Roles <ChevronDown className="size-4" /></>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
        Visiting from a portfolio, resume, or recruiter link? Select any role below to review module-specific credentials or click <span className="font-semibold text-emerald-600 dark:text-emerald-400">"Auto-Fill & Sign In"</span>.
      </p>

      {isExpanded && (
        <div className="mt-3.5 space-y-3">
          {/* Role Selection Tabs / Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {TEST_ROLES.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelect(role)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  {getRoleIcon(role.id)}
                  <span>{role.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Role Credentials Card */}
          <div className="rounded-xl p-3 bg-white/95 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  {getRoleIcon(currentRoleObj.id)}
                  {currentRoleObj.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
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

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Module:</span> {currentRoleObj.module}
            </p>

            {/* Credential Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              {/* Username */}
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">Username</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currentRoleObj.username}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(currentRoleObj.username, 'user')}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1"
                  title="Copy username"
                >
                  {copiedKey === 'user' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              {/* Email */}
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="truncate pr-1">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{currentRoleObj.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(currentRoleObj.email, 'email')}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1 shrink-0"
                  title="Copy email"
                >
                  {copiedKey === 'email' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              {/* Password */}
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">Password</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currentRoleObj.passwords[0]}</span>
                  <span className="text-[9px] text-slate-400 block font-sans">({currentRoleObj.passwords[1]}, {currentRoleObj.passwords[2]})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(currentRoleObj.passwords[0], 'pwd')}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1"
                  title="Copy password"
                >
                  {copiedKey === 'pwd' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* Session Limits & Protection Notice */}
            <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              <Info className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-700 dark:text-slate-300">Session Entry Policy:</strong> Capped at <strong>{MAX_TEST_ENTRIES} entries</strong> per session. You will receive an alert upon reaching {WARNING_THRESHOLD} entries. If a 6th entry is attempted, the earliest entry is automatically deleted. Production database writes are safely bypassed.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
