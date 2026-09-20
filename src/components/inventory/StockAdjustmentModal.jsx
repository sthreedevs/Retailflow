'use client';

import React, { useState } from 'react';
import { X, ArrowRight, AlertCircle } from 'lucide-react';

export function StockAdjustmentModal({ isOpen, onClose, product, onSuccess }) {
  const [newStock, setNewStock] = useState(product ? String(product.currentStock ?? 0) : '0');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState('ADJUSTMENT'); // 'ADJUSTMENT' | 'OPENING'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !product) return null;

  const currentStock = Number(product.currentStock) || 0;
  const targetStock = Number(newStock) || 0;
  const delta = targetStock - currentStock;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (isNaN(targetStock) || targetStock < 0) {
      setError('Target stock count must be a non-negative number.');
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please provide a reason with at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload =
        mode === 'OPENING'
          ? {
              mode: 'OPENING',
              productId: product.productId || product._id,
              openingStock: targetStock,
              reason: reason.trim(),
            }
          : {
              mode: 'ADJUSTMENT',
              productId: product.productId || product._id,
              newStock: targetStock,
              reason: reason.trim(),
            };

      const res = await fetch('/api/tenant/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to adjust stock');
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
          <div>
            <h3 className="text-base font-semibold text-neutral-100">Stock Adjustment</h3>
            <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[280px]">
              {product.name} ({product.sku || 'No SKU'})
            </p>
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
          {/* Mode Selector */}
          <div className="flex rounded-lg bg-neutral-950 p-1 border border-neutral-800">
            <button
              type="button"
              onClick={() => setMode('ADJUSTMENT')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === 'ADJUSTMENT'
                  ? 'bg-neutral-800 text-neutral-100 shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Physical Count Audit
            </button>
            <button
              type="button"
              onClick={() => setMode('OPENING')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === 'OPENING'
                  ? 'bg-neutral-800 text-neutral-100 shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Set Opening Stock
            </button>
          </div>

          {/* Current vs Target Live Preview */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex items-center justify-between">
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-neutral-500">Current</span>
              <p className="text-sm font-bold text-neutral-300">{currentStock}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-600" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-neutral-500">Target</span>
              <p className="text-sm font-bold text-neutral-100">{targetStock}</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-neutral-500">Delta</span>
              <p
                className={`text-sm font-bold ${
                  delta > 0
                    ? 'text-emerald-400'
                    : delta < 0
                    ? 'text-rose-400'
                    : 'text-neutral-400'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Verified Physical Count
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600"
              placeholder="e.g. 25"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Adjustment Reason <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600"
              placeholder="e.g. Physical stock count reconciliation"
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
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
