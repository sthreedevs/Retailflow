'use client';

import React from 'react';
import { History, Receipt } from 'lucide-react';
import Link from 'next/link';

export function RecentActivityFeed({ recentActivity }) {
  if (!recentActivity) return null;

  const { bills = [], movements = [] } = recentActivity;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Recent Bills Stream */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-neutral-100">Recent Completed Bills</h3>
            </div>
            <Link
              href="/tenant/pos/bills"
              className="text-[11px] font-medium text-neutral-400 hover:text-emerald-400 transition-colors"
            >
              All Bills &rarr;
            </Link>
          </div>

          <div className="divide-y divide-neutral-800/60 text-xs">
            {bills.length === 0 ? (
              <p className="text-xs text-neutral-500 py-8 text-center">
                No billing transactions completed yet.
              </p>
            ) : (
              bills.map((bill) => (
                <div
                  key={bill._id}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-neutral-800/20 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/tenant/pos/bills/${bill._id}`}
                      className="font-mono font-bold text-emerald-400 hover:text-emerald-300 block truncate"
                    >
                      {bill.invoiceNumber}
                    </Link>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {bill.customerName} &bull; {bill.itemsCount} items
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-neutral-100 block">
                      ₹{bill.grandTotal?.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {bill.paymentMethod} &bull;{' '}
                      {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-800/80">
          <Link
            href="/tenant/pos"
            className="w-full py-2 px-3 text-xs font-bold text-neutral-200 bg-neutral-850 hover:bg-neutral-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-neutral-700/60"
          >
            Open POS Counter &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Stock Movements Stream */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-neutral-100">Live Inventory Movements</h3>
            </div>
            <Link
              href="/tenant/inventory/movements"
              className="text-[11px] font-medium text-neutral-400 hover:text-emerald-400 transition-colors"
            >
              Movements Audit &rarr;
            </Link>
          </div>

          <div className="divide-y divide-neutral-800/60 text-xs">
            {movements.length === 0 ? (
              <p className="text-xs text-neutral-500 py-8 text-center">
                No stock movement events recorded yet.
              </p>
            ) : (
              movements.map((mov) => {
                const isOut = mov.direction === 'OUT';

                return (
                  <div
                    key={mov._id}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-neutral-800/20 px-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-200 truncate">{mov.productName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-semibold">
                          {mov.movementType}
                        </span>
                        <span>
                          {mov.previousStock} &rarr; {mov.newStock}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span
                        className={`font-bold block ${
                          isOut ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isOut ? `-${mov.quantity}` : `+${mov.quantity}`}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-800/80">
          <Link
            href="/tenant/inventory"
            className="w-full py-2 px-3 text-xs font-bold text-neutral-200 bg-neutral-850 hover:bg-neutral-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-neutral-700/60"
          >
            Adjust Stock Inventory &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
