'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';

export function DamageModal({ isOpen, onClose, product, onSuccess }) {
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !product) return null;

  const currentStock = Number(product.currentStock) || 0;
  const damagedQty = Number(quantity) || 0;
  const remainingStock = Math.max(0, currentStock - damagedQty);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (isNaN(damagedQty) || damagedQty <= 0) {
      setError('Damaged quantity must be greater than zero.');
      return;
    }

    if (damagedQty > currentStock) {
      setError(`Cannot write off ${damagedQty} units. Only ${currentStock} units available.`);
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please provide a reason for damage write-off (min 3 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tenant/inventory/damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.productId || product._id,
          quantity: damagedQty,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to record damage');
      }

      onSuccess(data.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-100">Record Damaged Goods</h3>
              <p className="text-xs text-neutral-400 truncate max-w-[260px]">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-500">Available</span>
              <p className="text-sm font-bold text-neutral-200">{currentStock}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-500">Damage</span>
              <p className="text-sm font-bold text-rose-400">-{damagedQty}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-500">Remaining</span>
              <p className="text-sm font-bold text-neutral-300">{remainingStock}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Damaged Quantity <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={currentStock}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600"
              placeholder="e.g. 2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Damage Reason <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600"
              placeholder="e.g. Expired shelf date / Broken seal"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || currentStock <= 0}
              className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Writing off...' : 'Record Damage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
