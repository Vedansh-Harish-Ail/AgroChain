import React from 'react';

// ─── 1. Generic Metric Cards Skeleton ────────────────────────────────────────
export function StatCardsSkeleton({ count = 3 }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${count} gap-6`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-3 w-32 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}

// ─── 2. Table Loader Skeleton ────────────────────────────────────────────────
export function TableSkeleton({ rows = 4, cols = 4 }) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c} className="py-3 px-4">
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-slate-100 dark:border-slate-850">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="py-3.5 px-4">
                    <div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded-lg ${
                      c === 0 ? 'w-24' : c === 1 ? 'w-16' : c === 2 ? 'w-20' : 'w-12'
                    }`}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 3. Detail Audit Inspector Card Skeleton ─────────────────────────────────
export function DetailsCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-6">
      <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-32 bg-slate-105 dark:bg-slate-800 rounded-lg"></div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="flex gap-2">
          <div className="h-16 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-16 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-16 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
      </div>

      <div className="h-10 w-full bg-slate-250 dark:bg-slate-800 rounded-xl"></div>
    </div>
  );
}

// ─── 4. Timeline Traceability Skeleton ───────────────────────────────────────
export function TimelineSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-6">
      <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-6 space-y-8">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-slate-250 dark:bg-slate-800"></div>
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-3 w-48 bg-slate-105 dark:bg-slate-850 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. Main Dashboard View Skeleton ─────────────────────────────────────────
export function DashboardSkeleton({ role }) {
  const isFarmer = role === 'FARMER';

  return (
    <div className="space-y-8 py-4 animate-pulse">
      {/* Welcome banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-4 w-80 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
        </div>

        {isFarmer && (
          <div className="flex items-center justify-around bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 px-6 py-3.5 rounded-2xl flex-1 max-w-xl mx-4">
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-6 w-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-6 w-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-6 w-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          </div>
        )}

        <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
      </div>

      {/* Metrics / Weather Row */}
      {isFarmer ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weather card placeholder */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-[195px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              </div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-850 rounded"></div>
          </div>

          {/* Advisory card placeholder */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-[195px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              </div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              <div className="h-3.5 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-3.5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-4 w-40 bg-slate-100 dark:bg-slate-850 rounded"></div>
          </div>
        </div>
      ) : (
        /* Stat Cards grid (4 columns for admin/tester/inspector/investor) */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-[108px]">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                </div>
                <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Operations Console Menu */}
      <div className="space-y-4">
        <div className="h-6 w-44 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: role === 'ADMIN' ? 6 : 3 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex gap-4 h-[126px]">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
              <div className="space-y-2.5 flex-1">
                <div className="h-4.5 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-850 rounded"></div>
                  <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-850 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 6. Crop History List Skeleton ───────────────────────────────────────────
export function CropHistorySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between gap-5 h-[278px]">
          <div className="flex gap-4">
            <div className="p-3 w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-805/40 shrink-0"></div>
            <div className="space-y-3 flex-1">
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="space-y-1.5">
                <div className="h-3 w-3/4 bg-slate-105 dark:bg-slate-850 rounded"></div>
                <div className="h-3 w-1/2 bg-slate-105 dark:bg-slate-850 rounded"></div>
                <div className="h-3 w-2/3 bg-slate-105 dark:bg-slate-850 rounded"></div>
                <div className="h-3 w-3/5 bg-slate-105 dark:bg-slate-850 rounded"></div>
              </div>
            </div>
          </div>
          <div className="h-9 w-full bg-slate-105 dark:bg-slate-850 rounded-xl"></div>
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      ))}
    </div>
  );
}

// ─── 7. Funding Marketplace Skeleton ─────────────────────────────────────────
export function FundingMarketplaceSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-pulse">
      {/* Left side: Grid of active crop listings */}
      <div className="lg:col-span-2 space-y-6">
        <div className="h-6 w-44 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-[230px]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-4.5 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-5.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                  </div>
                  <div className="h-4 w-12 bg-slate-100 dark:bg-slate-850 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-850 rounded"></div>
                    <div className="h-3 w-20 bg-slate-100 dark:bg-slate-850 rounded"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-24 bg-slate-100 dark:bg-slate-850 rounded"></div>
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-850 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Right side: Sidebar sticky panel */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-[320px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-850 rounded"></div>
            <div className="flex gap-2">
              <div className="h-2 w-full bg-slate-250 dark:bg-slate-800 rounded"></div>
              <div className="h-2 w-full bg-slate-250 dark:bg-slate-800 rounded"></div>
              <div className="h-2 w-full bg-slate-250 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="space-y-3 pt-4">
              <div className="h-10 w-full bg-slate-100 dark:bg-slate-850 rounded-xl"></div>
              <div className="h-12 w-full bg-slate-100 dark:bg-slate-850 rounded-xl"></div>
            </div>
          </div>
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
