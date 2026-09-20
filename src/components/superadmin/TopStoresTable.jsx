'use client';

import React, { useState } from 'react';
import { Store, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function TopStoresTable({ topStores = [] }) {
  const [impersonatingId, setImpersonatingId] = useState(null);
  const [error, setError] = useState('');

  const handleOpenStoreContext = async (tenantId) => {
    setImpersonatingId(tenantId);
    setError('');

    try {
      const res = await fetch('/api/platform/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to open store context');
      }

      // Redirect to tenant store dashboard with impersonation banner active
      const target = json.redirectUrl || '/tenant/dashboard';
      window.location.assign(target);
    } catch (err) {
      setError(err.message || 'Failed to open tenant store.');
      setImpersonatingId(null);
    }
  };

  if (!topStores || topStores.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-neutral-100">Top Revenue Stores</h3>
          </div>
        </div>
        <p className="text-xs text-neutral-500 py-6 text-center">
          No store sales recorded in the summary records yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-neutral-100">Top Performing Stores</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Ranked by retail sales volume with one-click store context inspection
          </p>
        </div>

        <Link
          href="/superadmin/tenants"
          className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View All Stores &rarr;
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 border-b border-neutral-800 bg-neutral-950/40">
            <tr>
              <th className="px-3 py-2">Store</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Revenue</th>
              <th className="px-3 py-2 text-center">Bills</th>
              <th className="px-3 py-2 text-center">Last Active</th>
              <th className="px-3 py-2 text-right">Superadmin Drilldown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-sans">
            {topStores.map((store, idx) => {
              const isActive = store.status === 'ACTIVE';

              return (
                <tr key={store.tenantId || idx} className="hover:bg-neutral-800/20 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-neutral-100 block">{store.storeName}</span>
                        <span className="text-[10px] font-mono text-neutral-500">{store.tenantId}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {store.status}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-right font-mono font-bold text-neutral-100">
                    ₹{store.totalSales?.toLocaleString()}
                  </td>

                  <td className="px-3 py-2.5 text-center font-mono text-neutral-300">
                    {store.totalInvoices}
                  </td>

                  <td className="px-3 py-2.5 text-center font-mono text-[11px] text-neutral-400">
                    {store.lastActiveDate || '-'}
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      disabled={impersonatingId === store.tenantId}
                      onClick={() => handleOpenStoreContext(store.tenantId)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Inspect tenant store dashboard with real database context"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {impersonatingId === store.tenantId ? 'Opening...' : 'Open Store Context'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Reads from platform summary records &bull; Zero load on tenant databases</span>
        <span className="font-mono text-neutral-400">
          Superadmin impersonation banner is displayed upon drilldown
        </span>
      </div>
    </div>
  );
}
