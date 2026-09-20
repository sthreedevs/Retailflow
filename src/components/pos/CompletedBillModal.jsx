'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, Printer, Plus, X, Download } from 'lucide-react';

export function CompletedBillModal({ isOpen, onClose, sale, onNewBill }) {
  // Hotkey Enter to start new bill
  useEffect(() => {
    function handleKeyDown(e) {
      if (isOpen && e.key === 'Enter') {
        e.preventDefault();
        onNewBill();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNewBill]);

  if (!isOpen || !sale) return null;

  function handlePrint() {
    window.print();
  }

  function handleDownloadPdf() {
    const layout = sale.store?.receiptWidth || '80mm';
    window.open(`/api/tenant/pos/bills/${sale._id}/pdf?layout=${layout}`, '_blank');
  }

  function handleWhatsApp() {
    if (sale.delivery?.whatsappUrl) {
      window.open(sale.delivery.whatsappUrl, '_blank', 'noopener,noreferrer');
    } else {
      const text = `Invoice ${sale.invoiceNumber} for ₹${sale.grandTotal}. Thank you!`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    }
  }

  const store = sale.store || {};
  const storeName = store.storeName || 'RETAIL STORE';
  const storePhone = store.phone || '';
  const storeAddress = store.address || '';
  const footerMessage = store.footerMessage || '*** Thank you for shopping with us! ***';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Sale Completed!</h3>
              <p className="text-xs font-mono text-emerald-400 font-bold">{sale.invoiceNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Preview (80mm Style) */}
        <div className="flex-1 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-300 space-y-3 print:p-0 print:border-none">
          <div className="text-center space-y-1 border-b border-dashed border-neutral-800 pb-3">
            <h4 className="text-sm font-bold text-neutral-100 tracking-wide font-sans uppercase">
              {storeName}
            </h4>
            {storeAddress && <p className="text-[10px] text-neutral-400">{storeAddress}</p>}
            {storePhone && <p className="text-[10px] text-neutral-400">Tel: {storePhone}</p>}
            <p className="text-[10px] text-neutral-500 pt-0.5">TAX INVOICE / RETAIL RECEIPT</p>
            {sale.createdAt && (
              <p className="text-[10px] text-neutral-500">
                {new Date(sale.createdAt).toLocaleDateString()}{' '}
                {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          <div className="text-[11px] space-y-0.5 border-b border-dashed border-neutral-800 pb-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">Invoice:</span>
              <span className="font-bold text-neutral-200">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Customer:</span>
              <span className="text-neutral-300 truncate max-w-[180px]">
                {sale.customer?.name || 'Walk-in'}
              </span>
            </div>
            {sale.customer?.phone && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Phone:</span>
                <span className="text-neutral-400">{sale.customer.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-500">Cashier:</span>
              <span className="text-neutral-400">{sale.billedBy?.name || 'Cashier'}</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-1.5 border-b border-dashed border-neutral-800 pb-3">
            <div className="flex justify-between text-[10px] uppercase font-bold text-neutral-500">
              <span>Item</span>
              <span>Qty x Rate</span>
              <span>Total</span>
            </div>
            {sale.items?.map((item, i) => (
              <div key={i} className="text-[11px] flex justify-between items-start gap-1">
                <div className="truncate max-w-[140px]">
                  <span className="text-neutral-200 block truncate">{item.name}</span>
                  {item.packSize && <span className="text-[9px] text-neutral-500">{item.packSize}</span>}
                </div>
                <div className="text-neutral-400 whitespace-nowrap text-right">
                  {item.quantity} x ₹{item.unitPrice}
                </div>
                <div className="font-bold text-neutral-100 text-right whitespace-nowrap">
                  ₹{item.lineTotal}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs border-b border-dashed border-neutral-800 pb-3">
            <div className="flex justify-between">
              <span className="text-neutral-400">Subtotal:</span>
              <span>₹{sale.subtotal}</span>
            </div>
            {sale.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span>-₹{sale.discountTotal}</span>
              </div>
            )}
            {sale.taxTotal > 0 && (
              <div className="flex justify-between text-neutral-400">
                <span>Tax:</span>
                <span>+₹{sale.taxTotal}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-neutral-100 pt-1 border-t border-neutral-800">
              <span>GRAND TOTAL:</span>
              <span className="text-emerald-400 font-mono">₹{sale.grandTotal}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-neutral-500">Payment Method:</span>
              <span className="font-bold text-neutral-200">{sale.paymentMethod}</span>
            </div>
            {sale.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Amount Tendered:</span>
                  <span>₹{sale.amountPaid}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Change Due:</span>
                  <span>₹{sale.changeDue}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-2 text-[10px] text-neutral-500">
            {footerMessage}
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-2.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="py-2 px-2.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-neutral-700"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="py-2 px-2.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              title="Share on WhatsApp"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.599 2.679-.702c.971.558 1.99.853 3.011.853h.001c3.182 0 5.768-2.586 5.768-5.766 0-3.18-2.586-5.767-5.768-5.767zm7.989 5.766c0 4.406-3.585 7.99-7.99 7.99-.001 0-.001 0 0 0-1.396 0-2.735-.371-3.905-1.033l-4.325 1.134 1.157-4.223c-.742-1.229-1.162-2.653-1.162-4.135 0-4.405 3.585-7.99 7.99-7.99s7.99 3.585 7.99 7.99z" />
              </svg>
              WhatsApp
            </button>
          </div>

          <button
            type="button"
            onClick={onNewBill}
            className="w-full py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Start New Bill [Enter]
          </button>
        </div>
      </div>
    </div>
  );
}
