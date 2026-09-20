'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, RefreshCw, Eye, Download } from 'lucide-react';

const PAYMENT_METHODS = ['ALL', 'CASH', 'UPI', 'CARD', 'CREDIT', 'OTHER'];

export default function BillHistoryPage() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalSales: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [page, setPage] = useState(1);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (search.trim()) params.set('search', search.trim());
      if (paymentMethod && paymentMethod !== 'ALL') params.set('paymentMethod', paymentMethod);

      const res = await fetch(`/api/tenant/pos/bills?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSales(json.sales || []);
        setSummary(json.summary || { totalRevenue: 0, totalSales: 0 });
        setPagination(json.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load bill history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, paymentMethod]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBills();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchBills]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/tenant/pos"
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Sales & Bill History</h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Complete archive of store invoices and billing transactions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tenant/pos"
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow"
          >
            + Open POS Counter
          </Link>
          <button
            onClick={fetchBills}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <span className="text-[10px] uppercase font-mono text-neutral-500">Total Billed Revenue</span>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            ₹{summary.totalRevenue?.toLocaleString() ?? 0}
          </div>
          <span className="text-[10px] text-neutral-500">Filtered sales value</span>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <span className="text-[10px] uppercase font-mono text-neutral-500">Invoices Generated</span>
          <div className="text-xl font-bold text-neutral-100 font-mono mt-1">
            {summary.totalSales?.toLocaleString() ?? 0}
          </div>
          <span className="text-[10px] text-neutral-500">Total completed bills</span>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <span className="text-[10px] uppercase font-mono text-neutral-500">Average Bill Size</span>
          <div className="text-xl font-bold text-blue-400 font-mono mt-1">
            ₹
            {summary.totalSales > 0
              ? Math.round((summary.totalRevenue / summary.totalSales) * 100) / 100
              : 0}
          </div>
          <span className="text-[10px] text-neutral-500">Revenue per invoice</span>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <span className="text-[10px] uppercase font-mono text-neutral-500">Active Page</span>
          <div className="text-xl font-bold text-neutral-300 font-mono mt-1">
            {pagination.page} / {pagination.totalPages}
          </div>
          <span className="text-[10px] text-neutral-500">{pagination.total} records found</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Payment Method Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-neutral-500 flex items-center gap-1 pl-1 pr-1 flex-shrink-0">
              <Filter className="w-3 h-3" /> Method:
            </span>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setPaymentMethod(m);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                  paymentMethod === m
                    ? 'bg-neutral-800 text-neutral-100 shadow border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoice #, customer..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700"
            />
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-neutral-500">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-neutral-500">
                    No sales matching the selected filters.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tenant/pos/bills/${sale._id}`}
                        className="font-mono font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {sale.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(sale.createdAt).toLocaleDateString()}{' '}
                      <span className="text-neutral-500">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-200">{sale.customer?.name || 'Walk-in Customer'}</p>
                      {sale.customer?.phone && (
                        <span className="text-[10px] text-neutral-500 font-mono">{sale.customer.phone}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-neutral-300">
                      {sale.items?.length || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-950 border border-neutral-800 text-neutral-300">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-100">
                      ₹{sale.grandTotal?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-neutral-400 text-[11px]">
                      {sale.billedBy?.name || 'Cashier'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Link
                          href={`/tenant/pos/bills/${sale._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View
                        </Link>
                        <a
                          href={`/api/tenant/pos/bills/${sale._id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download PDF"
                          className="p-1 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
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
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} sales)
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
