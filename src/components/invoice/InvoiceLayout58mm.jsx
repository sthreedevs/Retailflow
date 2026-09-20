'use client';

import React from 'react';

export function InvoiceLayout58mm({ sale, store = {} }) {
  if (!sale) return null;

  const dateStr = sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '';
  const storeName = store.storeName || 'Retail Store';
  const currency = store.currencySymbol || '₹';
  const footerMessage = store.footerMessage || 'Thank you! Visit again.';

  return (
    <div className="bg-white text-neutral-900 p-3 w-[58mm] max-w-[58mm] mx-auto shadow-2xl rounded-lg print:shadow-none print:p-0 print:m-0 print:w-[58mm] print:max-w-none font-mono text-[10px]">
      {/* Store Header */}
      <div className="text-center space-y-0.5 border-b border-dashed border-neutral-400 pb-2">
        <h2 className="text-xs font-black tracking-wide font-sans">{storeName.toUpperCase()}</h2>
        {store.address && <p className="text-[8px] text-neutral-500 leading-tight">{store.address}</p>}
        {store.phone && <p className="text-[8px] text-neutral-500">Ph: {store.phone}</p>}
      </div>

      {/* Invoice Meta */}
      <div className="my-2 space-y-0.5 text-[9px] border-b border-dashed border-neutral-400 pb-2">
        <div className="flex justify-between">
          <span className="text-neutral-500">Inv:</span>
          <span className="font-bold">{sale.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Dt:</span>
          <span>{dateStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Cust:</span>
          <span className="truncate max-w-[100px]">{sale.customer?.name || 'Walk-in'}</span>
        </div>
      </div>

      {/* Item List Header */}
      <div className="border-b border-neutral-900 pb-0.5 text-[8px] uppercase font-bold flex justify-between">
        <span>Item</span>
        <span>Qty/Rate</span>
        <span>Tot</span>
      </div>

      {/* Items */}
      <div className="divide-y divide-neutral-100 border-b border-dashed border-neutral-400 py-1 space-y-1">
        {(sale.items || []).map((it, idx) => (
          <div key={idx} className="pt-0.5 text-[9px]">
            <span className="font-semibold block truncate text-neutral-900">{it.name}</span>
            <div className="flex justify-between text-neutral-600 text-[8px]">
              <span>{it.quantity} x {currency}{it.unitPrice}</span>
              <span className="font-bold text-neutral-900">{currency}{it.lineTotal}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="my-1.5 space-y-0.5 text-[9px] border-b border-dashed border-neutral-400 pb-1.5">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal:</span>
          <span>{currency}{sale.subtotal}</span>
        </div>
        {sale.discountTotal > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Disc:</span>
            <span>-{currency}{sale.discountTotal}</span>
          </div>
        )}
        {sale.taxTotal > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>Tax:</span>
            <span>+{currency}{sale.taxTotal}</span>
          </div>
        )}
        <div className="pt-1 border-t border-neutral-900 flex justify-between text-xs font-black text-neutral-900">
          <span>TOTAL:</span>
          <span>{currency}{sale.grandTotal}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="text-[8px] space-y-0.5 border-b border-dashed border-neutral-400 pb-1.5">
        <div className="flex justify-between">
          <span>Mode:</span>
          <span className="font-bold">{sale.paymentMethod}</span>
        </div>
        {sale.paymentMethod === 'CASH' && (
          <div className="flex justify-between text-emerald-700">
            <span>Change:</span>
            <span>{currency}{sale.changeDue || 0}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-2 text-[8px] text-neutral-500">
        <p>{footerMessage}</p>
      </div>
    </div>
  );
}
