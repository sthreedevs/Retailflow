'use client';

import React from 'react';

export function InvoiceLayout80mm({ sale, store = {} }) {
  if (!sale) return null;

  const dateStr = sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '';
  const timeStr = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const storeName = store.storeName || 'Retail Store';
  const currency = store.currencySymbol || '₹';
  const footerMessage = store.footerMessage || 'Thank you for shopping with us! Visit again.';

  return (
    <div className="bg-white text-neutral-900 p-5 w-[80mm] max-w-[80mm] mx-auto shadow-2xl rounded-xl print:shadow-none print:p-0 print:m-0 print:w-[80mm] print:max-w-none font-mono text-xs">
      {/* Store Header */}
      <div className="text-center space-y-0.5 border-b border-dashed border-neutral-400 pb-3">
        <h2 className="text-sm font-black tracking-wide font-sans">{storeName.toUpperCase()}</h2>
        {store.address && <p className="text-[10px] text-neutral-600">{store.address}</p>}
        {store.phone && <p className="text-[10px] text-neutral-600">Tel: {store.phone}</p>}
        <p className="text-[10px] font-bold text-neutral-700 mt-1">*** RETAIL RECEIPT ***</p>
      </div>

      {/* Invoice Meta */}
      <div className="my-2.5 space-y-0.5 text-[11px] border-b border-dashed border-neutral-400 pb-2.5">
        <div className="flex justify-between">
          <span className="text-neutral-500">Invoice:</span>
          <span className="font-bold text-neutral-900">{sale.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Date:</span>
          <span>{dateStr} {timeStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Customer:</span>
          <span className="truncate max-w-[140px] text-right font-medium">{sale.customer?.name || 'Walk-in'}</span>
        </div>
        {sale.customer?.phone && (
          <div className="flex justify-between">
            <span className="text-neutral-500">Phone:</span>
            <span>{sale.customer.phone}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-500">Cashier:</span>
          <span>{sale.billedBy?.name || 'Cashier'}</span>
        </div>
      </div>

      {/* Item List Header */}
      <div className="border-b border-neutral-900 pb-1 text-[10px] uppercase font-bold flex justify-between">
        <span className="w-28 truncate">Item</span>
        <span className="w-16 text-right">Qty x Rate</span>
        <span className="w-14 text-right">Total</span>
      </div>

      {/* Items */}
      <div className="divide-y divide-neutral-200 border-b border-dashed border-neutral-400 py-1.5 space-y-1">
        {(sale.items || []).map((it, idx) => (
          <div key={idx} className="pt-1 text-[11px] flex justify-between items-start gap-1">
            <div className="w-28 truncate">
              <span className="font-semibold block truncate text-neutral-900">{it.name}</span>
              {it.packSize && <span className="text-[9px] text-neutral-500">{it.packSize}</span>}
            </div>
            <div className="w-16 text-right text-neutral-600 text-[10px] whitespace-nowrap">
              {it.quantity} x {currency}{it.unitPrice}
            </div>
            <div className="w-14 text-right font-bold text-neutral-900 whitespace-nowrap">
              {currency}{it.lineTotal}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="my-2.5 space-y-1 text-xs border-b border-dashed border-neutral-400 pb-2.5">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal:</span>
          <span>{currency}{sale.subtotal}</span>
        </div>
        {sale.discountTotal > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Discount:</span>
            <span>-{currency}{sale.discountTotal}</span>
          </div>
        )}
        {sale.taxTotal > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>Tax / GST:</span>
            <span>+{currency}{sale.taxTotal}</span>
          </div>
        )}
        <div className="pt-1.5 border-t border-neutral-900 flex justify-between text-sm font-black text-neutral-900">
          <span>TOTAL:</span>
          <span>{currency}{sale.grandTotal}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="text-[11px] space-y-0.5 border-b border-dashed border-neutral-400 pb-2">
        <div className="flex justify-between">
          <span className="text-neutral-500">Payment Mode:</span>
          <span className="font-bold">{sale.paymentMethod}</span>
        </div>
        {sale.paymentMethod === 'CASH' && (
          <>
            <div className="flex justify-between">
              <span className="text-neutral-500">Tendered:</span>
              <span>{currency}{sale.amountPaid || sale.grandTotal}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Change Due:</span>
              <span>{currency}{sale.changeDue || 0}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-3 text-[10px] text-neutral-600 space-y-1">
        <p className="font-medium">{footerMessage}</p>
        <p className="text-[9px] text-neutral-400">Powered by RetailFlow SaaS</p>
      </div>
    </div>
  );
}
