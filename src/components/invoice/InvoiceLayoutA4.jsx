'use client';

import React from 'react';

export function InvoiceLayoutA4({ sale, store = {} }) {
  if (!sale) return null;

  const dateStr = sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '';
  const timeStr = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const storeName = store.storeName || 'Retail Store';
  const currency = store.currencySymbol || '₹';
  const footerMessage = store.footerMessage || 'Thank you for shopping with us! Visit again.';

  return (
    <div className="bg-white text-neutral-900 p-8 sm:p-12 max-w-[210mm] mx-auto shadow-2xl rounded-2xl print:shadow-none print:p-0 print:m-0 print:max-w-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b border-neutral-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">{storeName}</h1>
          <div className="text-xs text-neutral-500 mt-1 space-y-0.5">
            {store.address && <p>{store.address}</p>}
            {store.phone && <p>Phone: {store.phone}</p>}
            {store.email && <p>Email: {store.email}</p>}
          </div>
        </div>

        <div className="text-left sm:text-right bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 min-w-[200px]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            TAX INVOICE
          </span>
          <div className="text-base font-black font-mono text-neutral-900 mt-1">
            {sale.invoiceNumber}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Date: <span className="font-mono text-neutral-800">{dateStr} {timeStr}</span>
          </div>
          <div className="text-xs text-neutral-500">
            Cashier: <span className="text-neutral-800">{sale.billedBy?.name || 'Cashier'}</span>
          </div>
        </div>
      </div>

      {/* Bill To Customer Section */}
      <div className="my-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200/60 flex flex-col sm:flex-row justify-between text-xs gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block mb-1">
            BILL TO / CUSTOMER
          </span>
          <p className="text-sm font-bold text-neutral-900">{sale.customer?.name || 'Walk-in Customer'}</p>
          {sale.customer?.phone && (
            <p className="text-neutral-600 font-mono mt-0.5">Phone: {sale.customer.phone}</p>
          )}
          {sale.customer?.address && (
            <p className="text-neutral-500 mt-0.5">Address: {sale.customer.address}</p>
          )}
        </div>

        <div className="text-left sm:text-right space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block mb-1">
            PAYMENT INFORMATION
          </span>
          <div className="flex sm:justify-end items-center gap-1.5">
            <span className="font-semibold text-neutral-700">Mode:</span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800 text-[11px]">
              {sale.paymentMethod}
            </span>
          </div>
          <p className="text-neutral-600">
            Status: <strong className="text-emerald-600">{sale.paymentStatus || 'PAID'}</strong>
          </p>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="overflow-x-auto my-6">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-neutral-900 text-neutral-900 font-mono uppercase text-[10px]">
              <th className="py-2 px-2 w-8">#</th>
              <th className="py-2 px-3">Item & Description</th>
              <th className="py-2 px-3">Pack</th>
              <th className="py-2 px-3 text-right">Rate</th>
              <th className="py-2 px-3 text-right">Qty</th>
              <th className="py-2 px-3 text-right">Disc</th>
              <th className="py-2 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {(sale.items || []).map((it, idx) => (
              <tr key={idx} className="hover:bg-neutral-50/60">
                <td className="py-2.5 px-2 font-mono text-neutral-400">{idx + 1}</td>
                <td className="py-2.5 px-3">
                  <p className="font-semibold text-neutral-900">{it.name}</p>
                  {(it.barcode || it.sku) && (
                    <span className="text-[10px] text-neutral-400 font-mono block">
                      {it.barcode ? `BAR: ${it.barcode}` : `SKU: ${it.sku}`}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 font-mono text-neutral-600">{it.packSize || '-'}</td>
                <td className="py-2.5 px-3 text-right font-mono text-neutral-800">{currency}{it.unitPrice}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">{it.quantity} {it.unit || ''}</td>
                <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                  {it.discount > 0 ? `-${currency}${it.discount}` : '-'}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                  {currency}{it.lineTotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Box */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-t border-neutral-200 pt-6 gap-6">
        <div className="max-w-xs text-xs text-neutral-500 space-y-1">
          {sale.paymentMethod === 'CASH' && (
            <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 font-mono text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Amount Tendered:</span>
                <span className="font-bold">{currency}{sale.amountPaid || sale.grandTotal}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Change Returned:</span>
                <span className="font-bold">{currency}{sale.changeDue || 0}</span>
              </div>
            </div>
          )}
          {sale.notes && <p className="italic">Note: {sale.notes}</p>}
        </div>

        <div className="w-full sm:w-64 bg-neutral-50 p-4 rounded-xl border border-neutral-200/80 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal:</span>
            <span className="font-mono text-neutral-900">{currency}{sale.subtotal}</span>
          </div>
          {sale.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Total Discount:</span>
              <span className="font-mono">-{currency}{sale.discountTotal}</span>
            </div>
          )}
          {sale.taxTotal > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>Tax / GST:</span>
              <span className="font-mono text-neutral-900">+{currency}{sale.taxTotal}</span>
            </div>
          )}
          <div className="pt-2 border-t border-neutral-300 flex justify-between items-baseline text-sm font-black text-neutral-900">
            <span>GRAND TOTAL:</span>
            <span className="text-xl text-emerald-600 font-mono">{currency}{sale.grandTotal}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-neutral-200 text-center text-xs text-neutral-500">
        <p className="font-medium text-neutral-700">{footerMessage}</p>
        <p className="text-[10px] text-neutral-400 mt-1 font-mono">This is a computer-generated tax invoice.</p>
      </div>
    </div>
  );
}
