'use client';

import React from 'react';
import { PieChart, Layers } from 'lucide-react';

const CATEGORY_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
];

export function CategoryBreakdownChart({ categories = [] }) {
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
          <PieChart className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-neutral-100">Sales by Category (30 Days)</h3>
        </div>
        <p className="text-xs text-neutral-500 py-6 text-center">
          No category sales recorded in this period yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-neutral-100">Category Sales Breakdown</h3>
        </div>
        <span className="text-[10px] text-neutral-500 font-mono">Last 30 Days</span>
      </div>

      <div className="space-y-3.5">
        {categories.map((cat, idx) => {
          const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

          return (
            <div key={cat.category || idx} className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                  <span className="font-semibold text-neutral-200">{cat.category}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-neutral-400">{cat.units} units</span>
                  <span className="font-bold text-neutral-100">₹{cat.revenue.toLocaleString()}</span>
                  <span className="text-emerald-400 font-bold w-12 text-right">
                    {cat.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.max(2, cat.percentage)}%` }}
                  className={`h-full rounded-full ${colorClass}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
