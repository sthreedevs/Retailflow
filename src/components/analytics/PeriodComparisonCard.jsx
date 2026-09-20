'use client';

import React from 'react';
import { Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

export function PeriodComparisonCard({ periodComparison }) {
  if (!periodComparison) return null;

  const {
    yesterday = {},
    thisMonth = {},
    previousMonth = {},
    monthOverMonthChangePct = 0,
  } = periodComparison;

  const isMonthPositive = monthOverMonthChangePct >= 0;

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-neutral-100">Period Performance Benchmarks</h3>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
          Historical Compare
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Yesterday Benchmark */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-500" /> Yesterday Total
            </span>
            <span className="font-mono text-[11px] text-neutral-500">24 hrs</span>
          </div>
          <p className="text-lg font-bold text-neutral-100 font-mono">
            ₹{(yesterday.sales || 0).toLocaleString()}
          </p>
          <div className="pt-1.5 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-400">
            <span>{yesterday.bills || 0} bills</span>
            <span>{yesterday.unitsSold || 0} units</span>
            <span className="font-mono text-neutral-500">₹{yesterday.averageBillValue || 0}/avg</span>
          </div>
        </div>

        {/* This Month (MTD) */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> This Month (MTD)
            </span>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-lg font-bold text-emerald-400 font-mono">
            ₹{(thisMonth.sales || 0).toLocaleString()}
          </p>
          <div className="pt-1.5 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-400">
            <span>{thisMonth.bills || 0} bills</span>
            <span>{thisMonth.unitsSold || 0} units</span>
            <span className="font-mono text-neutral-400">
              {thisMonth.bills > 0 ? `₹${Math.round(thisMonth.sales / thisMonth.bills)}/avg` : '₹0'}
            </span>
          </div>
        </div>

        {/* Previous Month */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="font-semibold text-neutral-300">Previous Full Month</span>
            <span
              className={`inline-flex items-center gap-0.5 font-bold font-mono text-[10px] ${
                isMonthPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isMonthPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(monthOverMonthChangePct)}% MoM
            </span>
          </div>
          <p className="text-lg font-bold text-neutral-200 font-mono">
            ₹{(previousMonth.sales || 0).toLocaleString()}
          </p>
          <div className="pt-1.5 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-400">
            <span>{previousMonth.bills || 0} bills</span>
            <span>{previousMonth.unitsSold || 0} units</span>
            <span className="font-mono text-neutral-500">
              {previousMonth.bills > 0 ? `₹${Math.round(previousMonth.sales / previousMonth.bills)}/avg` : '₹0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
