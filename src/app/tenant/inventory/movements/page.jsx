'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCw, Filter } from 'lucide-react';

const MOVEMENT_TYPES = [
  'ALL',
  'OPENING',
  'ADJUSTMENT',
  'DAMAGE',
  'PURCHASE',
  'SALE',
  'RETURN_IN',
  'RETURN_OUT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
];

export default function StockMovementsPage() {
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(1);

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (selectedType && selectedType !== 'ALL') {
        params.set('movementType', selectedType);
      }

      const res = await fetch(`/api/tenant/inventory/movements?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setMovements(json.movements);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch stock movements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovements();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMovements]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/tenant/inventory"
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Stock Movement Ledger</h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Immutable audit history of every stock-changing transaction across your store.
            </p>
          </div>
        </div>

        <button
          onClick={fetchMovements}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Movement Type Filter Tabs */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-neutral-500 flex items-center gap-1 pl-1 flex-shrink-0">
          <Filter className="w-3 h-3" /> Type:
        </span>
        <div className="flex items-center gap-1">
          {MOVEMENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                selectedType === type
                  ? 'bg-neutral-800 text-neutral-100 shadow border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Movement Type</th>
                <th className="px-4 py-3 text-right">Stock Delta</th>
                <th className="px-4 py-3 text-right">Balance Progression</th>
                <th className="px-4 py-3">Reason / Description</th>
                <th className="px-4 py-3">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-neutral-500">
                    Loading stock movement ledger...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-neutral-500">
                    No stock movements recorded for this filter.
                  </td>
                </tr>
              ) : (
                movements.map((mov) => {
                  const isIncrease = mov.direction === 'IN';
                  const prod = mov.productId || {};
                  return (
                    <tr key={mov._id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(mov.createdAt).toLocaleDateString()}{' '}
                        <span className="text-neutral-500">
                          {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-200">{prod.name || 'Unknown Product'}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500 font-mono">
                          {prod.sku && <span>SKU: {prod.sku}</span>}
                          {prod.category && <span>Cat: {prod.category}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            mov.movementType === 'OPENING'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : mov.movementType === 'ADJUSTMENT'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : mov.movementType === 'DAMAGE'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : mov.movementType === 'PURCHASE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : mov.movementType === 'SALE'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {mov.movementType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            isIncrease ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isIncrease ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                          {isIncrease ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-neutral-300 text-[11px]">
                        <span className="text-neutral-500">{mov.previousStock}</span>
                        <span className="text-neutral-600 mx-1.5">→</span>
                        <span className="text-neutral-100 font-bold">{mov.newStock}</span>
                      </td>
                      <td className="px-4 py-3 text-neutral-300 max-w-[240px] truncate">
                        {mov.reason || <span className="text-neutral-500 italic">None</span>}
                        {mov.referenceId && (
                          <span className="block text-[10px] text-neutral-500 font-mono">
                            Ref: {mov.referenceId}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-400 text-[11px]">
                        <span>{mov.createdBy?.name || 'System'}</span>
                        <span className="block text-[10px] text-neutral-500">
                          {mov.createdBy?.role || 'SYSTEM'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
