import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, CheckCircle2, Coins, Search, ShieldAlert, ChevronRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl dark:bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-r from-farm-900/60 to-slate-950/80 mix-blend-multiply" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-farm-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-8 py-20 sm:px-12 lg:px-16 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-400">
              <Sprout className="h-4 w-4" /> Next-Gen AgTech supply chain
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Decentralized Trust for <span className="text-emerald-400">Modern Farming</span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 max-w-xl">
              AgroChain bridges the gap between farmers and consumers by combining immutable blockchain traceability with interest-free micro-finance. Direct connections, verified quality, and zero middlemen.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all duration-300"
                >
                  Go to Dashboard <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all duration-300"
                  >
                    Get Started Now <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/consumer/track"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-all duration-300"
                  >
                    Trace Product <Search className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex-1 w-full flex justify-center">
            {/* SVG Visual Demonstration */}
            <div className="relative w-full max-w-md aspect-square bg-slate-800/40 rounded-2xl border border-slate-700 p-8 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col gap-2">
                  <UserCheck className="h-8 w-8 text-emerald-400" />
                  <span className="text-sm font-semibold">Farmers</span>
                  <span className="text-xs text-slate-400">List crops, add cultivation schedules, secure initial funds.</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col gap-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <span className="text-sm font-semibold">Inspectors</span>
                  <span className="text-xs text-slate-400">Review quality, certify products, mint batches on-chain.</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col gap-2">
                  <Coins className="h-8 w-8 text-emerald-400" />
                  <span className="text-sm font-semibold">Investors</span>
                  <span className="text-xs text-slate-400">Back farmers directly, earn yields on final sales.</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col gap-2">
                  <Search className="h-8 w-8 text-emerald-400" />
                  <span className="text-sm font-semibold">Consumers</span>
                  <span className="text-xs text-slate-400">Track full timeline, view verifications, leave rating logs.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">100%</div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Immutable Records</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">0%</div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Middlemen Costs</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">1.5M+</div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Tons Traced</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">31K+</div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Active Wallets</div>
        </div>
      </section>

      {/* Core Workflow */}
      <section className="space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">How AgroChain Works</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Our platform merges blockchain trust layers with agricultural economics in four clear, verified phases.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="relative flex flex-col gap-3 p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-lg font-bold">1</div>
            <h3 className="font-semibold text-slate-950 dark:text-white text-lg">Crop Registration</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Farmers register cultivation details on-chain. Details include expected yield and location.</p>
          </div>
          <div className="relative flex flex-col gap-3 p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-lg font-bold">2</div>
            <h3 className="font-semibold text-slate-950 dark:text-white text-lg">Quality Assurance</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Authorized testers verify the farm. Approve crop quality and assign grades and expiration bounds.</p>
          </div>
          <div className="relative flex flex-col gap-3 p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-lg font-bold">3</div>
            <h3 className="font-semibold text-slate-950 dark:text-white text-lg">Micro-Investment</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Consumers fund crops via MetaMask. Capital reaches farmers directly without bank interest or broker fee.</p>
          </div>
          <div className="relative flex flex-col gap-3 p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-lg font-bold">4</div>
            <h3 className="font-semibold text-slate-950 dark:text-white text-lg">Traceability Tracking</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Consumers scan lot codes to display the complete blockchain timeline and credibility rating logs.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
