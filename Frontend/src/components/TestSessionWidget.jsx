import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Trash2, PlusCircle, ChevronUp, 
  ChevronDown, X, Info, Sparkles, DatabaseZap, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  isTestAccount, 
  getTestSessionEntries, 
  recordTestSessionEntry, 
  deleteTestSessionEntry, 
  clearTestSession,
  MAX_TEST_ENTRIES,
  WARNING_THRESHOLD 
} from '../utils/testSessionManager';

export default function TestSessionWidget() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [lastAlert, setLastAlert] = useState(null);

  const isTest = isTestAccount(user);

  const refreshEntries = () => {
    setEntries(getTestSessionEntries());
  };

  useEffect(() => {
    if (!isTest) return;
    refreshEntries();

    const handleTestAlert = (e) => {
      refreshEntries();
      const { message, type } = e.detail || {};
      if (message) {
        setLastAlert({ message, type, time: new Date().toLocaleTimeString() });
        showToast(message, type === 'warning' ? 'warning' : 'info', 6000);
      }
    };

    window.addEventListener('agrochain-test-alert', handleTestAlert);
    return () => {
      window.removeEventListener('agrochain-test-alert', handleTestAlert);
    };
  }, [isTest, showToast]);

  if (!isTest) return null;

  const count = entries.length;
  const isNearLimit = count >= WARNING_THRESHOLD;
  const isAtLimit = count >= MAX_TEST_ENTRIES;

  const handleCreateTestEntry = (e) => {
    e.stopPropagation();
    const modules = [
      { module: 'Crop Registration', title: `Test Crop Listing #${Math.floor(Math.random() * 900 + 100)}` },
      { module: 'Quality Lab Test', title: `Quality Certificate Grade-${['A', 'B', 'A+'][Math.floor(Math.random() * 3)]}` },
      { module: 'Investment Proposal', title: `LOI Proposal - $${Math.floor(Math.random() * 20 + 5)},000` },
      { module: 'Inspection Verification', title: `Land Survey Audit #${Math.floor(Math.random() * 500 + 100)}` },
      { module: 'Consumer Rating', title: `Verified Product Rating (5★)` }
    ];
    const picked = modules[Math.floor(Math.random() * modules.length)];

    const res = recordTestSessionEntry({
      module: picked.module,
      action: 'SIMULATED_TEST_ENTRY',
      title: picked.title,
      data: { createdBy: user.email, role: user.role }
    });

    refreshEntries();
  };

  const handleDelete = (id) => {
    deleteTestSessionEntry(id);
    refreshEntries();
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans">
      {/* Floating Pill / Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer flex items-center gap-2.5 px-3.5 py-2 rounded-2xl shadow-xl backdrop-blur-md border transition-all duration-300 hover:scale-[1.02] ${
          isAtLimit
            ? 'bg-rose-50/90 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            : isNearLimit
            ? 'bg-amber-50/90 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            : 'bg-white/90 dark:bg-slate-900/90 border-emerald-500/30 text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          {isNearLimit && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
        </div>

        <div className="text-xs font-semibold flex items-center gap-1.5">
          <span>Test Session:</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            isAtLimit 
              ? 'bg-rose-500 text-white' 
              : isNearLimit 
              ? 'bg-amber-500 text-white' 
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {count} / {MAX_TEST_ENTRIES} Entries
          </span>
        </div>

        {isOpen ? <ChevronDown className="h-3.5 w-3.5 opacity-60" /> : <ChevronUp className="h-3.5 w-3.5 opacity-60" />}
      </div>

      {/* Expanded Drawer / Modal */}
      {isOpen && (
        <div className="mt-2 w-80 sm:w-96 rounded-2xl p-4 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-md text-slate-800 dark:text-slate-200 space-y-3 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Session Entry Tracker
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Database Protection Badge */}
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-start gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
            <DatabaseZap className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong>Database Protection Active:</strong> Test accounts operate in an isolated session buffer. No dummy data is written to the production database.
            </p>
          </div>

          {/* Alerts / Notice Banner */}
          {count >= WARNING_THRESHOLD && (
            <div className={`p-2 rounded-xl text-[11px] flex items-start gap-2 ${
              count >= MAX_TEST_ENTRIES
                ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-300'
            }`}>
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>{count >= MAX_TEST_ENTRIES ? 'Limit Reached (5/5):' : 'Warning (4/5):'}</strong>
                <p className="mt-0.5 leading-snug">
                  {count >= MAX_TEST_ENTRIES
                    ? 'Attempting a 6th entry will automatically remove the oldest entry.'
                    : 'You have reached 4 entries. Only 1 remaining before automatic FIFO entry rotation.'}
                </p>
              </div>
            </div>
          )}

          {/* List of current session entries */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {entries.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                No entries created in this session yet.
              </div>
            ) : (
              entries.map((entry, idx) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate block">
                        {entry.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>{entry.module}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-slate-400 hover:text-rose-500 transition p-1"
                    title="Delete entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleCreateTestEntry}
              className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Simulate New Entry</span>
            </button>

            {entries.length > 0 && (
              <button
                onClick={() => { clearTestSession(); refreshEntries(); }}
                className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 text-xs font-medium transition"
                title="Clear all session entries"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
