'use client';

import React, { useState } from 'react';
import { Zap, AlertTriangle, Package, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function ProductVelocityMatrix({ merchandising }) {
  const [activeTab, setActiveTab] = useState('fast'); // 'fast' or 'slow'

  if (!merchandising) return null;

  const { fastMoving = [], slowMoving = [] } = merchandising;

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-neutral-100">Product Velocity Matrix</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Identify top revenue drivers and idle inventory tying up working capital
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('fast')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'fast'
                ? 'bg-neutral-800 text-emerald-400 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Fast-Moving ({fastMoving.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('slow')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'slow'
                ? 'bg-neutral-800 text-amber-400 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Slow-Moving ({slowMoving.length})
          </button>
        </div>
      </div>

      {/* Fast-Moving View */}
      {activeTab === 'fast' && (
        <div className="space-y-2">
          {fastMoving.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              No sales data available to calculate fast-moving products.
            </p>
          ) : (
            <div className="divide-y divide-neutral-800/60">
              {fastMoving.map((item, idx) => {
                const isOutOfStock = item.stockStatus === 'OUT_OF_STOCK';
                const isLowStock = item.stockStatus === 'LOW_STOCK';

                return (
                  <div
                    key={item._id || idx}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-neutral-800/20 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-200 truncate">{item.name}</p>
                        <p className="text-[11px] text-neutral-500 font-mono">
                          {item.packSize && <span>{item.packSize} &bull; </span>}
                          <span>SKU: {item.sku || '-'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right font-mono">
                      <div>
                        <span className="text-neutral-100 font-bold block">{item.totalUnitsSold} sold</span>
                        <span className="text-[11px] text-emerald-400 font-medium">
                          ₹{item.totalRevenue.toLocaleString()}
                        </span>
                      </div>

                      {/* Stock Level Warning */}
                      <div className="w-24 text-right">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            {item.currentStock} left
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-400">
                            {item.currentStock} in stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Slow-Moving / Dead Stock View */}
      {activeTab === 'slow' && (
        <div className="space-y-2">
          {slowMoving.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              No slow-moving products identified with dormant inventory.
            </p>
          ) : (
            <div className="divide-y divide-neutral-800/60">
              {slowMoving.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-neutral-800/20 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 shrink-0">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-200 truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {item.category} &bull; {item.packSize || item.sku || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right font-mono text-[11px]">
                    <div>
                      <span className="text-amber-400 font-bold block">{item.currentStock} in stock</span>
                      <span className="text-neutral-500">{item.unitsSold30d} sold in 30d</span>
                    </div>

                    <div className="w-24 text-right">
                      <span className="text-neutral-300 font-semibold block">
                        ₹{item.stockValuationDP.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-neutral-500">tied cost</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Based on verified retail counter transactions</span>
        <Link
          href="/tenant/products"
          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
        >
          Manage Catalog <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
