'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Eye } from 'lucide-react';
import { InvoiceViewer } from '@/components/invoice/InvoiceViewer.jsx';

export default function BillDetailPage({ params }) {
  const unwrappedParams = use(params);
  const billId = unwrappedParams?.id;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'audit'

  const fetchBill = useCallback(async () => {
    if (!billId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenant/pos/bills/${billId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Invoice not found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBill();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchBill]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-neutral-500 text-xs">
        Loading invoice details...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 text-center py-20">
        <p className="text-sm font-semibold text-rose-400">{error || 'Invoice not found'}</p>
        <Link
          href="/tenant/pos/bills"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Bill History
        </Link>
      </div>
    );
  }

  const { sale, store, delivery } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/tenant/pos/bills"
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Invoice Details</h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {sale.invoiceNumber}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Completed on {new Date(sale.createdAt).toLocaleDateString()} at{' '}
              {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900/80 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'preview'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Receipt & Delivery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'audit'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Register Audit
          </button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        <InvoiceViewer
          sale={sale}
          store={store}
          delivery={delivery}
          pdfDownloadUrl={`/api/tenant/pos/bills/${sale._id}/pdf`}
        />
      ) : (
        <div className="space-y-6">
          {/* Itemized Invoice Table */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950/60">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-mono">
                Itemized Invoice Items ({sale.items?.length || 0})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/40 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="px-5 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU / Barcode</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Selling Rate</th>
                    <th className="px-4 py-3 text-right">MRP</th>
                    <th className="px-4 py-3 text-right">Discount</th>
                    <th className="px-5 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-sans">
                  {sale.items?.map((it, idx) => (
                    <tr key={idx} className="hover:bg-neutral-800/20">
                      <td className="px-5 py-3 font-medium text-neutral-100">
                        {it.name}
                        {it.packSize && (
                          <span className="text-[10px] text-neutral-500 block font-mono">
                            Pack: {it.packSize}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-400 font-mono text-[11px]">
                        {it.barcode || it.sku || '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-neutral-200">
                        {it.quantity} {it.unit || ''}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-neutral-300">
                        ₹{it.unitPrice}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-neutral-500">
                        ₹{it.mrp || it.unitPrice}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-neutral-400">
                        {it.discount > 0 ? `₹${it.discount}` : '-'}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-neutral-100">
                        ₹{it.lineTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="bg-neutral-950/80 p-5 border-t border-neutral-800 flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-neutral-200">₹{sale.subtotal}</span>
                </div>
                {sale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Total Discount:</span>
                    <span className="font-mono">-₹{sale.discountTotal}</span>
                  </div>
                )}
                {sale.taxTotal > 0 && (
                  <div className="flex justify-between text-neutral-400">
                    <span>Tax:</span>
                    <span className="font-mono text-neutral-200">+₹{sale.taxTotal}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline text-sm font-bold text-neutral-100">
                  <span>Grand Total:</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-mono">
                    ₹{sale.grandTotal}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
