'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Banknote, QrCode, AlertCircle, ShoppingCart } from 'lucide-react';

const PAYMENT_OPTIONS = [
  { id: 'CASH', label: 'Cash', icon: Banknote },
  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
  { id: 'CARD', label: 'Debit / Card', icon: CreditCard },
  { id: 'CREDIT', label: 'Store Credit', icon: ShoppingCart },
  { id: 'OTHER', label: 'Other', icon: Check },
];

export function PaymentModal({ isOpen, onClose, cart, customer, onCompleteSale }) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [tendered, setTendered] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const grandTotal = Math.round(cart.grandTotal || 0);
  const tenderedAmount = Number(tendered) || grandTotal;
  const changeDue = Math.max(0, Math.round((tenderedAmount - grandTotal) * 100) / 100);

  const handleSubmit = React.useCallback(async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        items: cart.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          sku: it.sku || '',
          barcode: it.barcode || '',
          packSize: it.packSize || '',
          unit: it.unit || 'PCS',
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          mrp: Number(it.mrp || it.unitPrice),
          dp: Number(it.dp || 0),
          discount: Number(it.discount || 0),
          taxRate: Number(it.taxRate || 0),
          taxAmount: Number(it.taxAmount || 0),
          lineTotal: Number(it.lineTotal || (it.quantity * it.unitPrice)),
        })),
        customer: {
          customerId: customer?.customerId || null,
          name: customer?.name || 'Walk-in Customer',
          phone: customer?.phone || '',
          address: customer?.address || '',
        },
        discountTotal: Number(cart.discountTotal || 0),
        taxTotal: Number(cart.taxTotal || 0),
        paymentMethod,
        amountPaid: tenderedAmount,
        notes: notes.trim(),
      };

      const res = await fetch('/api/tenant/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to complete sale');
      }

      const completedSaleData = data.sale ? { ...data.sale, delivery: data.delivery, store: data.store } : data;
      onCompleteSale(completedSaleData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [cart.items, cart.discountTotal, cart.taxTotal, customer, paymentMethod, tenderedAmount, notes, isSubmitting, onCompleteSale, onClose]);

  // Set default tendered on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setTendered(String(grandTotal));
        setError('');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, grandTotal]);

  // F8 hotkey to submit
  useEffect(() => {
    function handleKeyDown(e) {
      if (isOpen && e.key === 'F8') {
        e.preventDefault();
        handleSubmit();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSubmit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-neutral-100">Checkout & Payment</h3>
            <p className="text-xs text-neutral-400">
              Billed for: <strong className="text-neutral-200">{customer?.name || 'Walk-in Customer'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Big Amount Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
          <span className="text-xs uppercase font-mono text-neutral-500">Total Payable Amount</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
            ₹{grandTotal.toLocaleString()}
          </div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">
            {cart.items.length} items • Subtotal: ₹{cart.subtotal}
            {cart.discountTotal > 0 && ` • Disc: -₹${cart.discountTotal}`}
          </span>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-2">
            Payment Method (Informational)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = paymentMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cash Tendered & Change Breakdown */}
        {paymentMethod === 'CASH' && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-300">
              <span>Cash Tendered</span>
              <div className="flex items-center gap-1">
                {[grandTotal, Math.ceil(grandTotal / 100) * 100, Math.ceil(grandTotal / 500) * 500].map(
                  (suggestion, i) =>
                    suggestion >= grandTotal && (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTendered(String(suggestion))}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                      >
                        ₹{suggestion}
                      </button>
                    )
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">
                  Amount Received
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 font-mono text-base font-bold text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-neutral-500 mb-1">
                  Change Due
                </label>
                <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 font-mono text-base font-bold text-emerald-400">
                  ₹{changeDue.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">
            Notes / Reference (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Counter #1, Customer requested home delivery"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 rounded-xl border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            Back to Cart
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Processing Bill...' : 'Complete Sale [F8]'}
          </button>
        </div>
      </div>
    </div>
  );
}
