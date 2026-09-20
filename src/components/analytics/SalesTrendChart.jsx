'use client';

import React, { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';

export function SalesTrendChart({ salesAnalytics, onRangeChange, currentRange = '7d' }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!salesAnalytics) return null;

  const {
    trend = [],
    revenue = 0,
    estimatedCost = 0,
    grossMargin = 0,
    grossMarginPct = 0,
    hasReliableCostData = false,
  } = salesAnalytics;

  // Chart dimensions & scaling
  const maxSales = Math.max(...trend.map((d) => d.sales), 100);
  const totalBills = trend.reduce((acc, d) => acc + d.bills, 0);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-5 shadow-sm">
      {/* Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-neutral-100">Sales Trend &amp; Revenue Velocity</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Daily turnover and invoice transaction frequency
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 p-1 text-xs">
            <button
              type="button"
              onClick={() => onRangeChange('7d')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                currentRange === '7d'
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
                currentRange === '30d'
                  ? 'bg-neutral-800 text-emerald-400 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Ribbon for the selected period */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 text-xs">
        <div>
          <span className="text-neutral-500 block text-[11px]">Period Revenue</span>
          <span className="text-base font-bold text-emerald-400 font-mono">
            ₹{revenue.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-neutral-500 block text-[11px]">Period Invoices</span>
          <span className="text-base font-bold text-neutral-200 font-mono">
            {totalBills} bills
          </span>
        </div>
        <div>
          <span className="text-neutral-500 block text-[11px]">Est. Cost (COGS)</span>
          <span className="text-base font-bold text-neutral-300 font-mono">
            ₹{estimatedCost.toLocaleString()}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-neutral-500 block text-[11px]">Gross Margin</span>
            <span
              title={
                hasReliableCostData
                  ? 'Calculated from catalog DP cost metrics'
                  : 'Estimated: some products lack catalog DP cost'
              }
              className="text-neutral-500 hover:text-neutral-300 cursor-help"
            >
              <Info className="w-3 h-3" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-neutral-100 font-mono">
              ₹{grossMargin.toLocaleString()}
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              ({grossMarginPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Responsive SVG Bar & Line Chart */}
      <div className="space-y-2">
        <div className="h-44 sm:h-52 w-full flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-1 relative">
          {trend.map((point, idx) => {
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
                        ? 'bg-emerald-400 shadow-lg shadow-emerald-500/20'
                        : 'bg-emerald-500/80 hover:bg-emerald-400'
                      : 'bg-neutral-800/40'
                  }`}
                />

                {/* Date Label on X-Axis */}
                <span className="text-[10px] text-neutral-500 font-mono mt-1.5 truncate max-w-full text-center">
                  {currentRange === '30d' ? (idx % 5 === 0 ? point.label : '') : point.dayOfWeek}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hover / Active Tooltip Info Card */}
        {hoveredPoint ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-bold text-neutral-200">
                {hoveredPoint.label} ({hoveredPoint.dayOfWeek})
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <div>
                <span className="text-neutral-500 mr-1.5">Sales:</span>
                <span className="font-bold text-emerald-400">₹{hoveredPoint.sales.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-neutral-500 mr-1.5">Bills:</span>
                <span className="text-neutral-300">{hoveredPoint.bills}</span>
              </div>
              <div>
                <span className="text-neutral-500 mr-1.5">Units:</span>
                <span className="text-neutral-300">{hoveredPoint.units} pcs</span>
              </div>
              {hoveredPoint.sales > 0 && (
                <div>
                  <span className="text-neutral-500 mr-1.5">Est Margin:</span>
                  <span className="text-neutral-200">₹{hoveredPoint.grossMargin} ({hoveredPoint.grossMarginPct}%)</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-neutral-500 text-center py-1">
            Hover over any daily bar to inspect detailed sales, bills, and margin breakdown.
          </div>
        )}
      </div>

      {!hasReliableCostData && (
        <p className="text-[10px] text-neutral-500 flex items-center gap-1.5">
          <Info className="w-3 h-3 text-amber-500/70 shrink-0" />
          <span>
            Note: Cost of Goods Sold and Gross Margin are estimates based on catalog DP (Dealer Price). Products with missing or zero DP are treated with zero cost basis.
          </span>
        </p>
      )}
    </div>
  );
}
