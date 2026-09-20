'use client';

import React from 'react';
import { Wrench, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function InventoryHealthCard({ inventory }) {
  if (!inventory) return null;

  const {
    totalProducts = 0,
    totalStockUnits = 0,
    valuationDP = 0,
    valuationMRP = 0,
    potentialProfit = 0,
    statusCounts = {},
    adjustments = {},
  } = inventory;

  const { inStock = 0, lowStock = 0, outOfStock = 0 } = statusCounts;
  const totalStocked = (inStock + lowStock + outOfStock) || 1;

  const inStockPct = Math.round((inStock / totalStocked) * 100);
  const lowStockPct = Math.round((lowStock / totalStocked) * 100);
  const outOfStockPct = Math.round((outOfStock / totalStocked) * 100);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-neutral-100">Inventory Health &amp; Asset Valuation</h3>
        </div>
        <Link
          href="/tenant/inventory"
          className="text-[11px] font-medium text-neutral-400 hover:text-emerald-400 transition-colors"
        >
          View Full Stock &rarr;
        </Link>
      </div>

      {/* Valuation Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-1">
          <span className="text-neutral-500 text-[11px] block">Stock Valuation (Cost / DP)</span>
          <p className="text-lg font-bold text-neutral-100 font-mono">
            ₹{valuationDP.toLocaleString()}
          </p>
          <span className="text-[10px] text-neutral-500 block">
            Capital invested in inventory
          </span>
        </div>

        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-1">
          <span className="text-neutral-500 text-[11px] block">Retail Valuation (MRP)</span>
          <p className="text-lg font-bold text-emerald-400 font-mono">
            ₹{valuationMRP.toLocaleString()}
          </p>
          <span className="text-[10px] text-neutral-500 block">
            Potential gross sales value
          </span>
        </div>

        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-1">
          <span className="text-neutral-500 text-[11px] block">Potential Gross Profit</span>
          <p className="text-lg font-bold text-blue-400 font-mono">
            ₹{potentialProfit.toLocaleString()}
          </p>
          <span className="text-[10px] text-neutral-500 block">
            Unrealized gross margin
          </span>
        </div>
      </div>

      {/* Stock Health Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-300">Catalog Availability Status</span>
          <span className="text-neutral-400 font-mono">
            {totalProducts} products ({totalStockUnits.toLocaleString()} units)
          </span>
        </div>

        <div className="h-3 w-full bg-neutral-950 rounded-full flex overflow-hidden p-0.5 border border-neutral-800">
          <div
            style={{ width: `${inStockPct}%` }}
            className="h-full bg-emerald-500 rounded-l-full transition-all"
            title={`In Stock: ${inStock} items (${inStockPct}%)`}
          />
          <div
            style={{ width: `${lowStockPct}%` }}
            className="h-full bg-amber-500 transition-all"
            title={`Low Stock: ${lowStock} items (${lowStockPct}%)`}
          />
          <div
            style={{ width: `${outOfStockPct}%` }}
            className="h-full bg-rose-500 rounded-r-full transition-all"
            title={`Out of Stock: ${outOfStock} items (${outOfStockPct}%)`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-neutral-300">In Stock:</span>
            <span className="font-bold text-neutral-100 font-mono">{inStock}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-neutral-300">Low Stock:</span>
            <span className="font-bold text-amber-400 font-mono">{lowStock}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-neutral-300">Out of Stock:</span>
            <span className="font-bold text-rose-400 font-mono">{outOfStock}</span>
          </div>
        </div>
      </div>

      {/* Adjustments & Loss Summary (30d) */}
      <div className="bg-neutral-950/40 border border-neutral-850 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-400">
          <Wrench className="w-3.5 h-3.5 text-neutral-400" />
          <span>Stock Reconciliation (Last 30 Days):</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <div>
            <span className="text-neutral-500 mr-1.5">Adjustments:</span>
            <span className="text-neutral-300 font-semibold">{adjustments.adjustmentsCount || 0}</span>
            <span className="text-neutral-500 ml-1">({adjustments.adjustmentsUnits || 0} units)</span>
          </div>
          <div>
            <span className="text-neutral-500 mr-1.5">Damages Logged:</span>
            <span className="text-rose-400 font-semibold">{adjustments.damagesCount || 0}</span>
            <span className="text-neutral-500 ml-1">({adjustments.damagesUnits || 0} units)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
