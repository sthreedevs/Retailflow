'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { InvoiceViewer } from '@/components/invoice/InvoiceViewer.jsx';
import { ShieldCheck, AlertCircle, ShoppingBag } from 'lucide-react';

export default function PublicInvoicePage({ params }) {
  const unwrappedParams = use(params);
  const token = unwrappedParams?.token;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInvoice = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/public/invoices/${token}`);
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Invoice link is invalid or has expired.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load invoice receipt.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoice();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchInvoice]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 text-neutral-400 text-sm animate-pulse">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
          <span>Retrieving digital tax receipt...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-100">Unable to View Invoice</h2>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              {error || 'This digital invoice link is invalid, altered, or may have expired.'}
            </p>
          </div>
          <p className="text-[11px] text-neutral-500 border-t border-neutral-800 pt-3">
            Please contact the store directly if you need a copy of this bill.
          </p>
        </div>
      </div>
    );
  }

  const { sale, store } = data;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-6 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Customer Header Banner */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-neutral-100">
                  {store?.storeName || 'Retail Store'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Verified Bill
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Digital invoice receipt for #{sale.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="text-xs text-neutral-400 sm:text-right">
            <p className="font-mono text-neutral-300">
              Total: <span className="font-bold text-emerald-400 text-sm">₹{sale.grandTotal}</span>
            </p>
            <p className="text-[11px] text-neutral-500">
              {new Date(sale.createdAt).toLocaleDateString()}
            </p>
          </div>
        </header>

        {/* Core Invoice Viewer with format switcher & PDF download */}
        <main>
          <InvoiceViewer
            sale={sale}
            store={store}
            pdfDownloadUrl={`/api/public/invoices/${token}/pdf`}
            isPublic={true}
          />
        </main>

        <footer className="text-center text-xs text-neutral-500 py-4 print:hidden">
          Powered by Retail POS SaaS &bull; Secure Tamper-Proof Digital Invoice
        </footer>
      </div>
    </div>
  );
}
