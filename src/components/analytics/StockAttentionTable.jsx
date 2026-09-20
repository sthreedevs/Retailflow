'use client';

import React from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export function StockAttentionTable({ stockAttention = [] }) {
  if (!stockAttention || stockAttention.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-neutral-100">Stock Attention &amp; Replenishment</h3>
        </div>
        <div className="text-center py-8 text-xs text-neutral-500 space-y-1">
          <p className="text-neutral-300 font-medium">All active products meet safe inventory thresholds!</p>
          <p className="text-[11px]">No items are currently out of stock or under minimum safety levels.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold text-neutral-100">Critical Stock Attention &amp; Reorders</h3>
        </div>
        <Link
          href="/tenant/inventory/low-stock"
          className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View All Alerts &rarr;
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 border-b border-neutral-800 bg-neutral-950/40">
            <tr>
              <th className="px-3 py-2">Product Name</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2 text-center">Current</th>
              <th className="px-3 py-2 text-center">Min Level</th>
              <th className="px-3 py-2 text-center">Deficit</th>
              <th className="px-3 py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-sans">
            {stockAttention.map((item, idx) => {
              const isOut = item.status === 'OUT_OF_STOCK';

              return (
                <tr key={item._id || idx} className="hover:bg-neutral-800/20 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-neutral-200">
                    <span>{item.name}</span>
                    {item.packSize && (
                      <span className="text-[10px] text-neutral-500 block font-mono">
                        {item.packSize} &bull; SKU: {item.sku || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-neutral-400 text-[11px]">
                    {item.category || 'General'}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono font-bold">
                    <span className={isOut ? 'text-rose-400' : 'text-amber-400'}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-neutral-400 text-[11px]">
                    {item.minimumStock}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-neutral-300 font-semibold text-[11px]">
                    +{item.deficit} units
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isOut
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isOut ? 'OUT OF STOCK' : 'LOW STOCK'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Urgent replenishment required to prevent stockout losses</span>
        <Link
          href="/tenant/inventory"
          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
        >
          Perform Stock Adjustment <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
