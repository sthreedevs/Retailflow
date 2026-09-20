'use client';

import React from 'react';
import { DollarSign, Receipt, Package, Users, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function TodayPulseBar({ today }) {
  if (!today) return null;

  const {
    sales = 0,
    bills = 0,
    unitsSold = 0,
    customersServed = 0,
    averageBillValue = 0,
    comparison = {},
  } = today;

  const salesChangePct = comparison.salesChangePct ?? 0;
  const isSalesPositive = salesChangePct >= 0;

  const billsChangePct = comparison.billsChangePct ?? 0;
  const isBillsPositive = billsChangePct >= 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
            Today&apos;s Store Pulse &bull; Real-Time Sales Activity
          </h2>
        </div>
        <span className="text-[11px] text-neutral-500 font-medium">
          Compared to yesterday
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Hero Card: Sales Today */}
        <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg shadow-emerald-950/10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span className="font-semibold text-emerald-400">Sales Today</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-neutral-100 tracking-tight font-mono">
              ₹{sales.toLocaleString()}
            </p>
          </div>

          <div className="pt-2.5 mt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">vs Yesterday:</span>
            <span
              className={`inline-flex items-center gap-0.5 font-bold font-mono ${
                isSalesPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isSalesPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(salesChangePct)}%
            </span>
          </div>
        </div>

        {/* Bills Completed */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Bills Completed</span>
              <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-neutral-100 font-mono">
              {bills}
            </p>
          </div>
          <div className="pt-2.5 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">Yesterday: {comparison.yesterdayBills || 0}</span>
            <span
              className={`inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold ${
                isBillsPositive ? 'text-emerald-400' : 'text-neutral-400'
              }`}
            >
              {billsChangePct > 0 ? `+${billsChangePct}%` : `${billsChangePct}%`}
            </span>
          </div>
        </div>

        {/* Units Sold */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Units Sold</span>
              <div className="p-1.5 rounded-lg bg-neutral-800 text-blue-400">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-neutral-100 font-mono">
              {unitsSold}
            </p>
          </div>
          <div className="pt-2.5 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Items dispensed</span>
            <span className="font-mono text-neutral-400">{unitsSold} pcs</span>
          </div>
        </div>

        {/* Customers Served */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Customers Served</span>
              <div className="p-1.5 rounded-lg bg-neutral-800 text-purple-400">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-neutral-100 font-mono">
              {customersServed}
            </p>
          </div>
          <div className="pt-2.5 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Counter traffic</span>
            <span className="font-mono text-neutral-400">{customersServed} buyers</span>
          </div>
        </div>

        {/* Average Bill Value */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Avg Basket Size</span>
              <div className="p-1.5 rounded-lg bg-neutral-800 text-amber-400">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-neutral-100 font-mono">
              ₹{averageBillValue.toLocaleString()}
            </p>
          </div>
          <div className="pt-2.5 mt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Per invoice</span>
            <span className="font-mono text-neutral-400">
              {bills > 0 ? `₹${Math.round(sales / bills)}` : '₹0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
