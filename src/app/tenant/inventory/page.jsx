'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Boxes,
  AlertTriangle,
  PackageX,
  TrendingUp,
  Search,
  ArrowUpDown,
  History,
  CheckCircle2,
} from 'lucide-react';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal.jsx';
import { DamageModal } from '@/components/inventory/DamageModal.jsx';
import { StockDetailDrawer } from '@/components/inventory/StockDetailDrawer.jsx';

export default function InventoryPage() {
  const [overview, setOverview] = useState(null);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('name_asc');
  const [page, setPage] = useState(1);

  // Modals & Drawers
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [damageProduct, setDamageProduct] = useState(null);
  const [detailProductId, setDetailProductId] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/tenant/inventory/overview');
      const json = await res.json();
      if (json.success) {
        setOverview(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch overview metrics:', err);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        status,
        sort,
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/tenant/inventory?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.items);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch inventory items:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, status, sort, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOverview();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOverview]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  function handleActionSuccess() {
    fetchOverview();
    fetchItems();
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Inventory Management</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time stock ledger, physical count adjustments, and multi-dimensional valuation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tenant/inventory/movements"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5 text-neutral-400" />
            Movements Ledger
          </Link>
          <Link
            href="/tenant/products/import"
            className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg transition-colors"
          >
            + Import Products
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Total Units</span>
            <Boxes className="w-4 h-4 text-neutral-500" />
          </div>
          <p className="text-lg font-bold text-neutral-100 mt-2 font-mono">
            {overview?.totalStockUnits?.toLocaleString() ?? 0}
          </p>
          <span className="text-[10px] text-neutral-500">Across {overview?.totalProducts ?? 0} products</span>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>In Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-emerald-400 mt-2 font-mono">
            {overview?.inStockCount ?? 0}
          </p>
          <span className="text-[10px] text-neutral-500">Above minimum level</span>
        </div>

        <Link
          href="/tenant/inventory/low-stock"
          className="bg-neutral-900/60 border border-neutral-800 hover:border-amber-500/40 rounded-xl p-3.5 transition-colors group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="group-hover:text-amber-300">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-amber-400 mt-2 font-mono">
            {overview?.lowStockCount ?? 0}
          </p>
          <span className="text-[10px] text-amber-500/80">Needs reorder →</span>
        </Link>

        <Link
          href="/tenant/inventory/out-of-stock"
          className="bg-neutral-900/60 border border-neutral-800 hover:border-rose-500/40 rounded-xl p-3.5 transition-colors group"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="group-hover:text-rose-300">Out of Stock</span>
            <PackageX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-lg font-bold text-rose-400 mt-2 font-mono">
            {overview?.outOfStockCount ?? 0}
          </p>
          <span className="text-[10px] text-rose-500/80">Depleted stock →</span>
        </Link>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Cost (DP)</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-base font-bold text-neutral-100 mt-2 font-mono truncate">
            ₹{overview?.valuationDP?.toLocaleString() ?? 0}
          </p>
          <span className="text-[10px] text-neutral-500">Holding asset cost</span>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Retail (MRP)</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-base font-bold text-purple-300 mt-2 font-mono truncate">
            ₹{overview?.valuationMRP?.toLocaleString() ?? 0}
          </p>
          <span className="text-[10px] text-neutral-500">Gross retail value</span>
        </div>
      </div>

      {/* Search, Filter Bar & Status Tabs */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex rounded-lg bg-neutral-950 p-1 border border-neutral-800">
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'IN_STOCK', label: 'In Stock' },
              { id: 'LOW_STOCK', label: 'Low Stock' },
              { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatus(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  status === tab.id
                    ? 'bg-neutral-800 text-neutral-100 shadow'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort:
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
            >
              <option value="name_asc">Product Name (A-Z)</option>
              <option value="name_desc">Product Name (Z-A)</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="valuation_desc">Valuation (Cost)</option>
              <option value="reorder_desc">Reorder Deficit</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search inventory by product name, SKU, or barcode..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Current Stock</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Min / Reorder</th>
                <th className="px-4 py-3 text-right">Cost (DP)</th>
                <th className="px-4 py-3 text-right">Valuation (Cost)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-neutral-500">
                    Loading inventory balances...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-neutral-500">
                    No inventory records match your criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetailProductId(item.productId)}
                        className="font-medium text-neutral-200 hover:text-emerald-400 text-left transition-colors font-sans"
                      >
                        {item.name}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500 font-mono">
                        {item.sku && <span>SKU: {item.sku}</span>}
                        {item.barcode && <span>BAR: {item.barcode}</span>}
                        {item.packSize && <span>Pack: {item.packSize}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-sm text-neutral-100">
                      {item.currentStock}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.stockStatus === 'IN_STOCK' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          In Stock
                        </span>
                      )}
                      {item.stockStatus === 'LOW_STOCK' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Low Stock
                        </span>
                      )}
                      {item.stockStatus === 'OUT_OF_STOCK' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-400 text-[11px]">
                      {item.minimumStock} / {item.reorderLevel}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-300">
                      ₹{item.dp || 0}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-200">
                      ₹{Math.round((item.stockValuationDP || 0) * 100) / 100}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAdjustProduct(item)}
                          className="px-2.5 py-1 text-[11px] font-medium text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => setDamageProduct(item)}
                          disabled={item.currentStock <= 0}
                          className="px-2.5 py-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                          Damage
                        </button>
                        <button
                          onClick={() => setDetailProductId(item.productId)}
                          className="px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-200"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} items
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 text-neutral-300">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Slide-out Drawers */}
      <StockAdjustmentModal
        isOpen={Boolean(adjustProduct)}
        product={adjustProduct}
        onClose={() => setAdjustProduct(null)}
        onSuccess={handleActionSuccess}
      />

      <DamageModal
        isOpen={Boolean(damageProduct)}
        product={damageProduct}
        onClose={() => setDamageProduct(null)}
        onSuccess={handleActionSuccess}
      />

      <StockDetailDrawer
        productId={detailProductId}
        isOpen={Boolean(detailProductId)}
        onClose={() => setDetailProductId(null)}
        onAdjust={(prod) => {
          setDetailProductId(null);
          setAdjustProduct(prod);
        }}
        onDamage={(prod) => {
          setDetailProductId(null);
          setDamageProduct(prod);
        }}
      />
    </div>
  );
}
