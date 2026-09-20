'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, SlidersHorizontal, ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';

export function StockDetailDrawer({ productId, isOpen, onClose, onAdjust, onDamage }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [minStock, setMinStock] = useState('5');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [isSavingThresholds, setIsSavingThresholds] = useState(false);
  const [thresholdSuccess, setThresholdSuccess] = useState('');

  const fetchDetail = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenant/inventory/${productId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setMinStock(String(json.data.inventory?.minimumStock ?? 5));
        setReorderLevel(String(json.data.inventory?.reorderLevel ?? 10));
      }
    } catch (err) {
      console.error('Failed to load product stock details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen && productId) {
      const timer = setTimeout(() => {
        fetchDetail();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, productId, fetchDetail]);

  if (!isOpen) return null;

  async function handleSaveThresholds(e) {
    e.preventDefault();
    setIsSavingThresholds(true);
    setThresholdSuccess('');
    try {
      const res = await fetch(`/api/tenant/inventory/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minimumStock: Number(minStock),
          reorderLevel: Number(reorderLevel),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setThresholdSuccess('Thresholds updated successfully');
        setTimeout(() => setThresholdSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update thresholds:', err);
    } finally {
      setIsSavingThresholds(false);
    }
  }

  const product = data?.product;
  const inv = data?.inventory;
  const currentStock = Number(inv?.currentStock ?? 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-neutral-100">Product Stock & Movement</h2>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading && !data ? (
              <div className="py-20 text-center text-neutral-500 text-xs">
                Loading stock specifications...
              </div>
            ) : data ? (
              <>
                {/* Product Summary Header */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-neutral-100">{product.name}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Category: <span className="text-neutral-200">{product.category}</span>
                        {product.packSize ? ` • Pack: ${product.packSize}` : ''}
                      </p>
                    </div>
                    <div>
                      {data.stockStatus === 'IN_STOCK' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          In Stock
                        </span>
                      )}
                      {data.stockStatus === 'LOW_STOCK' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Low Stock
                        </span>
                      )}
                      {data.stockStatus === 'OUT_OF_STOCK' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg text-center">
                      <span className="text-[10px] uppercase font-mono text-neutral-500">Current Stock</span>
                      <p className="text-lg font-bold text-neutral-100">{currentStock}</p>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg text-center">
                      <span className="text-[10px] uppercase font-mono text-neutral-500">Cost (DP)</span>
                      <p className="text-sm font-bold text-neutral-300">₹{product.dp || 0}</p>
                      <span className="text-[9px] text-neutral-500">Val: ₹{data.valuationDP}</span>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg text-center">
                      <span className="text-[10px] uppercase font-mono text-neutral-500">Retail (MRP)</span>
                      <p className="text-sm font-bold text-neutral-300">₹{product.mrp || 0}</p>
                      <span className="text-[9px] text-neutral-500">Val: ₹{data.valuationMRP}</span>
                    </div>
                  </div>
                </div>

                {/* Fast Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onAdjust({ ...product, currentStock, productId })}
                    className="flex-1 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow"
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => onDamage({ ...product, currentStock, productId })}
                    disabled={currentStock <= 0}
                    className="flex-1 py-2 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow disabled:opacity-50"
                  >
                    Record Damage
                  </button>
                </div>

                {/* Threshold Configuration */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-neutral-200 mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
                    Alert Thresholds
                  </h4>

                  {thresholdSuccess && (
                    <div className="p-2 mb-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                      {thresholdSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSaveThresholds} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                          Minimum Stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={minStock}
                          onChange={(e) => setMinStock(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                          Reorder Level
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={reorderLevel}
                          onChange={(e) => setReorderLevel(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-600"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingThresholds}
                      className="w-full py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors border border-neutral-700 disabled:opacity-50"
                    >
                      {isSavingThresholds ? 'Saving...' : 'Update Thresholds'}
                    </button>
                  </form>
                </div>

                {/* Recent Movement History for this product */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-200 mb-3">
                    Recent Stock Movements
                  </h4>

                  {data.recentMovements?.length === 0 ? (
                    <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-center text-xs text-neutral-500">
                      No stock movements recorded yet for this product.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.recentMovements.map((mov) => {
                        const isIncrease = mov.direction === 'IN';
                        return (
                          <div
                            key={mov._id}
                            className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs flex items-center justify-between"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
                                    mov.movementType === 'OPENING'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                      : mov.movementType === 'ADJUSTMENT'
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                      : mov.movementType === 'DAMAGE'
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      : 'bg-neutral-800 text-neutral-300'
                                  }`}
                                >
                                  {mov.movementType}
                                </span>
                                <span className="text-[10px] text-neutral-500">
                                  {new Date(mov.createdAt).toLocaleDateString()} {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 truncate max-w-[220px]">
                                {mov.reason || 'No description provided'}
                              </p>
                              <span className="text-[10px] text-neutral-500">
                                User: {mov.createdBy?.name || 'System'}
                              </span>
                            </div>

                            <div className="text-right">
                              <div
                                className={`flex items-center justify-end font-bold font-mono text-xs ${
                                  isIncrease ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isIncrease ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" />}
                                {isIncrease ? `+${mov.quantity}` : `-${mov.quantity}`}
                              </div>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                {mov.previousStock} → {mov.newStock}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-rose-400 text-xs">
                Product details could not be found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
