'use client';

import React from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

export function CartTable({ items, onUpdateQuantity, onUpdateRate, onUpdateDiscount, onRemoveItem, onClearCart }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30">
        <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 flex items-center justify-center text-neutral-500 mb-3">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-200">Current Cart is Empty</h3>
        <p className="text-xs text-neutral-500 max-w-xs mt-1">
          Scan a barcode or use the search bar above to add products to the bill.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      <div className="px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between text-xs">
        <span className="font-semibold text-neutral-200">
          Cart Items ({items.length} {items.length === 1 ? 'line' : 'lines'})
        </span>
        <button
          type="button"
          onClick={onClearCart}
          className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-950/40 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800/80 sticky top-0 backdrop-blur-sm z-10">
            <tr>
              <th className="px-3 py-2.5">Item</th>
              <th className="px-3 py-2.5 text-right">Rate (₹)</th>
              <th className="px-3 py-2.5 text-center">Qty</th>
              <th className="px-3 py-2.5 text-right">Disc (₹)</th>
              <th className="px-3 py-2.5 text-right">Total (₹)</th>
              <th className="px-2 py-2.5 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {items.map((item, idx) => {
              const qty = Number(item.quantity) || 0;
              const rate = Number(item.unitPrice) || 0;
              const disc = Number(item.discount) || 0;
              const total = Math.max(0, Math.round((qty * rate - disc) * 100) / 100);
              const maxStock = Number(item.availableStock);
              const isLowOnStock = !isNaN(maxStock) && qty > maxStock;

              return (
                <tr key={`${item.productId}-${idx}`} className="hover:bg-neutral-800/20 transition-colors">
                  {/* Item Description */}
                  <td className="px-3 py-2.5 max-w-[180px]">
                    <p className="font-medium text-neutral-100 truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono mt-0.5">
                      {item.packSize && <span>{item.packSize}</span>}
                      {item.barcode && <span>• {item.barcode}</span>}
                      {!isNaN(maxStock) && (
                        <span className={`px-1 py-0.2 rounded ${isLowOnStock ? 'text-rose-400 bg-rose-500/10' : 'text-neutral-400'}`}>
                          Stock: {maxStock}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Rate / Price */}
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) => onUpdateRate(idx, e.target.value)}
                      className="w-16 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-1 text-right font-mono text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                    />
                  </td>

                  {/* Quantity Controls */}
                  <td className="px-3 py-2.5 text-center">
                    <div className="inline-flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(idx, Math.max(1, qty - 1))}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(idx, e.target.value)}
                        className="w-10 bg-transparent text-center font-mono font-bold text-xs text-neutral-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(idx, qty + 1)}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Line Discount */}
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.discount || ''}
                      placeholder="0"
                      onChange={(e) => onUpdateDiscount(idx, e.target.value)}
                      className="w-14 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-1 text-right font-mono text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                    />
                  </td>

                  {/* Line Total */}
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-neutral-100">
                    ₹{total.toFixed(2)}
                  </td>

                  {/* Delete Item */}
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
