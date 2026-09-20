'use client';

import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';

export function PlatformGrowthChart({ timeline = [], range = '30d', onRangeChange }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const maxSales = Math.max(...timeline.map((d) => d.sales), 100);
  const totalPeriodSales = timeline.reduce((acc, d) => acc + d.sales, 0);
  const totalPeriodInvoices = timeline.reduce((acc, d) => acc + d.invoices, 0);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-5 shadow-sm">
      {/* Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-neutral-100">Platform Cross-Store Growth</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Aggregated retail turnover across all active tenant stores
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 p-1 text-xs">
            <button
              type="button"
              onClick={() => onRangeChange('7d')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                range === '7d'
                  ? 'bg-neutral-800 text-emerald-400 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => onRangeChange('30d')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                range === '30d'
                  ? 'bg-neutral-800 text-emerald-400 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 text-xs font-mono">
        <div>
          <span className="text-neutral-500 block text-[11px] font-sans">Period Turnover</span>
          <span className="text-base font-bold text-emerald-400">
            ₹{totalPeriodSales.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-neutral-500 block text-[11px] font-sans">Total Transactions</span>
          <span className="text-base font-bold text-neutral-200">
            {totalPeriodInvoices.toLocaleString()} bills
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-neutral-500 block text-[11px] font-sans">Avg Transaction Value</span>
          <span className="text-base font-bold text-purple-400">
            {totalPeriodInvoices > 0 ? `₹${Math.round(totalPeriodSales / totalPeriodInvoices)}` : '₹0'}
          </span>
        </div>
      </div>

      {/* Interactive Responsive SVG Bar Chart */}
      <div className="space-y-2">
        <div className="h-44 sm:h-52 w-full flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-1 relative">
          {timeline.map((point, idx) => {
            const heightPct = Math.max(4, Math.round((point.sales / maxSales) * 100));
            const isHovered = hoveredPoint?.date === point.date;

            return (
              <div
                key={point.date || idx}
                className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Visual Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[28px] rounded-t-md transition-all duration-200 ${
                    point.sales > 0
                      ? isHovered
                        ? 'bg-purple-400 shadow-lg shadow-purple-500/20'
                        : 'bg-purple-600/80 hover:bg-purple-500'
                      : 'bg-neutral-800/40'
                  }`}
                />

                {/* Date Label on X-Axis */}
                <span className="text-[10px] text-neutral-500 font-mono mt-1.5 truncate max-w-full text-center">
                  {range === '30d' ? (idx % 5 === 0 ? point.label : '') : point.dayOfWeek}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hover Tooltip Info Card */}
        {hoveredPoint ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="font-bold text-neutral-200 font-sans">
                {hoveredPoint.label} ({hoveredPoint.dayOfWeek})
              </span>
            </div>
            <div className="flex items-center gap-5 font-mono text-[11px]">
              <div>
                <span className="text-neutral-500 mr-1.5 font-sans">Sales Across Stores:</span>
                <span className="font-bold text-emerald-400">₹{hoveredPoint.sales.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-neutral-500 mr-1.5 font-sans">Invoices:</span>
                <span className="text-neutral-300">{hoveredPoint.invoices}</span>
              </div>
              <div>
                <span className="text-neutral-500 mr-1.5 font-sans">Active Stores:</span>
                <span className="text-blue-400 font-bold">{hoveredPoint.activeStoresCount}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-neutral-500 text-center py-1">
            Hover over any day to inspect platform sales volume, bill counts, and active store participation.
          </div>
        )}
      </div>
    </div>
  );
}
