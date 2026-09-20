'use client';

import React from 'react';
import { Store, DollarSign, TrendingUp, Sparkles, Activity } from 'lucide-react';

export function PlatformPulseBar({ stores = {}, sales = {}, invoices = {}, activity = {} }) {
  const {
    totalStores = 0,
    activeStores = 0,
    suspendedStores = 0,
    newStoresThisMonth = 0,
  } = stores;

  const {
    salesToday = 0,
    salesThisMonth = 0,
    momGrowthPct = 0,
    totalSalesAllTime = 0,
  } = sales;

  const {
    invoicesToday = 0,
    totalInvoicesAllTime = 0,
  } = invoices;

  const { activeStoresToday = 0 } = activity;

  const isGrowthPositive = momGrowthPct >= 0;

  return (
    <div className="space-y-4">
      {/* Platform Level KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stores & Status */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span className="font-semibold text-neutral-300">Total Stores</span>
              <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-200">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-neutral-100 font-mono tracking-tight">
              {totalStores}
            </p>
          </div>

          <div className="pt-2.5 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-semibold">{activeStores} active</span>
            <span className="text-neutral-500">&bull;</span>
            <span className="text-amber-400">{suspendedStores} suspended</span>
            <span className="text-neutral-500">&bull;</span>
            <span className="text-purple-400">+{newStoresThisMonth} new (30d)</span>
          </div>
        </div>

        {/* Sales Across Stores Today */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span className="font-semibold text-emerald-400">Sales Today (Platform)</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-neutral-100 font-mono tracking-tight">
              ₹{salesToday.toLocaleString()}
            </p>
          </div>

          <div className="pt-2.5 mt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Invoices Today:</span>
            <span className="font-bold text-neutral-100 font-mono">{invoicesToday} bills</span>
          </div>
        </div>

        {/* Active Stores Today */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span className="font-semibold text-neutral-300">Active Stores Today</span>
              <div className="p-1.5 rounded-lg bg-neutral-800 text-blue-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-neutral-100 font-mono tracking-tight">
                {activeStoresToday}
              </p>
              <span className="text-xs text-neutral-500 font-mono">
                / {activeStores} active
              </span>
            </div>
          </div>

          <div className="pt-2.5 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Store Participation:</span>
            <span className="font-mono font-bold text-blue-400">
              {activeStores > 0 ? Math.round((activeStoresToday / activeStores) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Platform Monthly Volume & Growth */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span className="font-semibold text-neutral-300">This Month Sales</span>
              <div className="p-1.5 rounded-lg bg-neutral-800 text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-purple-400 font-mono tracking-tight">
              ₹{salesThisMonth.toLocaleString()}
            </p>
          </div>

          <div className="pt-2.5 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">MoM Growth:</span>
            <span
              className={`font-mono font-bold ${
                isGrowthPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isGrowthPositive ? `+${momGrowthPct}%` : `${momGrowthPct}%`}
            </span>
          </div>
        </div>
      </div>

      {/* All-Time Platform Volume Banner */}
      <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-400">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Platform Lifetime Gross Volume:</span>
        </div>
        <div className="flex items-center gap-6 font-mono text-[11px]">
          <div>
            <span className="text-neutral-500 mr-1.5">Total Revenue:</span>
            <span className="font-bold text-neutral-100">₹{totalSalesAllTime.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-neutral-500 mr-1.5">Total Bills Processed:</span>
            <span className="font-bold text-emerald-400">{totalInvoicesAllTime.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
