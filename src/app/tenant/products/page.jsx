'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button.jsx';

export default function TenantProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      params.set('page', page.toString());
      params.set('limit', '25');

      const res = await fetch(`/api/tenant/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();

      setProducts(data.products || []);
      setCategories(data.categories || []);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">
            Store Product Catalog
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {totalProducts} products managed strictly inside your isolated store database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/tenant/products/import">
            <Button size="sm" variant="default" className="text-xs">
              + Import CSV / Excel
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by product name, SKU, or barcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-neutral-600 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Querying isolated store database...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-neutral-400">No products found in your store catalog.</p>
            <Link href="/tenant/products/import">
              <Button size="sm" variant="default" className="text-xs">
                Import CSV or Excel Catalog Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/90 border-b border-neutral-800 text-neutral-400">
                <tr>
                  <th className="py-3 px-4 font-medium">Product Name &amp; SKU</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Pack Size</th>
                  <th className="py-3 px-4 font-medium">MRP</th>
                  <th className="py-3 px-4 font-medium">DP</th>
                  <th className="py-3 px-4 font-medium">SP (Catalog)</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-neutral-200 text-sm">
                        {p.name}
                      </div>
                      <div className="font-mono text-[11px] text-neutral-500">
                        {p.sku ? `SKU: ${p.sku}` : p.barcode ? `Barcode: ${p.barcode}` : '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans text-neutral-300">
                      <span className="px-2 py-0.5 rounded bg-neutral-800/70 border border-neutral-700/50 text-[10px] text-neutral-300">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      {p.packSize || '—'}
                    </td>

                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      ₹{p.mrp?.toLocaleString('en-IN') || 0}
                    </td>

                    <td className="py-3 px-4 text-neutral-300">
                      ₹{p.dp?.toLocaleString('en-IN') || 0}
                    </td>

                    <td className="py-3 px-4 text-neutral-400">
                      {p.sp ?? 0}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between text-xs text-neutral-400">
            <span>
              Page {page} of {totalPages} &bull; {totalProducts} items
            </span>

            <div className="flex gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="text-xs h-7"
              >
                &larr; Previous
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="text-xs h-7"
              >
                Next &rarr;
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
