'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal.jsx';

export default function LowStockPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [adjustProduct, setAdjustProduct] = useState(null);

  const fetchLowStock = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenant/inventory?status=LOW_STOCK&sort=reorder_desc&page=${page}&limit=25`);
      const json = await res.json();
      if (json.success) {
        setItems(json.items);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch low stock items:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLowStock();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLowStock]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/tenant/inventory"
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Low Stock Alerts</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {pagination.total} Items
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Products with current stock at or below configured minimum stock levels.
            </p>
          </div>
        </div>

        <button
          onClick={fetchLowStock}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Current Stock</th>
                <th className="px-4 py-3 text-right">Min Stock</th>
                <th className="px-4 py-3 text-right">Reorder Level</th>
                <th className="px-4 py-3 text-right">Deficit to Reorder</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-neutral-500">
                    Scanning low stock items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-medium text-neutral-300">All stock levels healthy</p>
                      <p className="text-xs text-neutral-500">No products are currently at or below minimum thresholds.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-200">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500 font-mono">
                        {item.sku && <span>SKU: {item.sku}</span>}
                        {item.packSize && <span>Pack: {item.packSize}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                      {item.currentStock}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-400">
                      {item.minimumStock}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-400">
                      {item.reorderLevel}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-400">
                      +{item.reorderDeficit || 0} units
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setAdjustProduct(item)}
                        className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow"
                      >
                        Restock / Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>
              Page {pagination.page} of {pagination.totalPages}
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

      <StockAdjustmentModal
        isOpen={Boolean(adjustProduct)}
        product={adjustProduct}
        onClose={() => setAdjustProduct(null)}
        onSuccess={fetchLowStock}
      />
    </div>
  );
}
