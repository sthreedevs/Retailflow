'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { History, CreditCard, Sparkles, Tag } from 'lucide-react';
import { ProductSearchBarcode } from '@/components/pos/ProductSearchBarcode.jsx';
import { CartTable } from '@/components/pos/CartTable.jsx';
import { CustomerSelector } from '@/components/pos/CustomerSelector.jsx';
import { PaymentModal } from '@/components/pos/PaymentModal.jsx';
import { CompletedBillModal } from '@/components/pos/CompletedBillModal.jsx';

export default function POSPage() {
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState({
    customerId: null,
    name: 'Walk-in Customer',
    phone: '',
    address: '',
  });

  const [billDiscount, setBillDiscount] = useState('');
  const [billTax, setBillTax] = useState('');
  const [popularProducts, setPopularProducts] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  // Load catalog items for quick pick
  const loadQuickCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const res = await fetch('/api/tenant/pos/search?query=');
      const json = await res.json();
      if (json.success) {
        setPopularProducts(json.products || []);
      }
    } catch (err) {
      console.error('Failed to load quick catalog:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuickCatalog();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadQuickCatalog]);

  // Global F8 shortcut to trigger checkout
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'F8' && cartItems.length > 0 && !isPaymentOpen && !completedSale) {
        e.preventDefault();
        setIsPaymentOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length, isPaymentOpen, completedSale]);

  // Cart Operations
  function handleAddProduct(product) {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => String(item.productId) === String(product._id || product.productId));

      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = (Number(existing.quantity) || 0) + 1;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          lineTotal: Math.round((newQty * existing.unitPrice - (existing.discount || 0)) * 100) / 100,
        };
        return updated;
      }

      const rate = Number(product.mrp || 0);
      return [
        ...prev,
        {
          productId: product._id || product.productId,
          name: product.name,
          sku: product.sku || '',
          barcode: product.barcode || '',
          packSize: product.packSize || '',
          unit: product.unit || 'PCS',
          quantity: 1,
          unitPrice: rate,
          mrp: rate,
          dp: Number(product.dp || 0),
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          lineTotal: rate,
          availableStock: product.currentStock ?? 0,
        },
      ];
    });
  }

  function handleUpdateQuantity(idx, val) {
    setCartItems((prev) => {
      const updated = [...prev];
      const target = updated[idx];
      if (!target) return prev;
      const newQty = Math.max(1, Number(val) || 1);
      updated[idx] = {
        ...target,
        quantity: newQty,
        lineTotal: Math.round((newQty * target.unitPrice - (target.discount || 0)) * 100) / 100,
      };
      return updated;
    });
  }

  function handleUpdateRate(idx, val) {
    setCartItems((prev) => {
      const updated = [...prev];
      const target = updated[idx];
      if (!target) return prev;
      const newRate = Math.max(0, Number(val) || 0);
      updated[idx] = {
        ...target,
        unitPrice: newRate,
        lineTotal: Math.round((target.quantity * newRate - (target.discount || 0)) * 100) / 100,
      };
      return updated;
    });
  }

  function handleUpdateDiscount(idx, val) {
    setCartItems((prev) => {
      const updated = [...prev];
      const target = updated[idx];
      if (!target) return prev;
      const newDisc = Math.max(0, Number(val) || 0);
      updated[idx] = {
        ...target,
        discount: newDisc,
        lineTotal: Math.max(0, Math.round((target.quantity * target.unitPrice - newDisc) * 100) / 100),
      };
      return updated;
    });
  }

  function handleRemoveItem(idx) {
    setCartItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleClearCart() {
    setCartItems([]);
    setBillDiscount('');
    setBillTax('');
  }

  function handleStartNewBill() {
    setCompletedSale(null);
    setIsPaymentOpen(false);
    handleClearCart();
    setCustomer({
      customerId: null,
      name: 'Walk-in Customer',
      phone: '',
      address: '',
    });
    loadQuickCatalog();
  }

  // Cart Calculations
  const rawSubtotal = cartItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  const lineDiscounts = cartItems.reduce((acc, it) => acc + Number(it.discount || 0), 0);
  const additionalDiscount = Number(billDiscount) || 0;
  const totalDiscount = lineDiscounts + additionalDiscount;
  const tax = Number(billTax) || 0;
  const subtotal = Math.round(rawSubtotal * 100) / 100;
  const grandTotal = Math.max(0, Math.round(subtotal - totalDiscount + tax));

  const cartPayload = {
    items: cartItems,
    subtotal,
    discountTotal: totalDiscount,
    taxTotal: tax,
    grandTotal,
  };

  return (
    <div className="space-y-4">
      {/* POS Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-neutral-100 tracking-tight">Retail POS Counter</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Counter Active
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Press <strong className="text-neutral-200">F2</strong> to focus scanner, <strong className="text-neutral-200">F8</strong> to complete sale.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tenant/pos/bills"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5 text-neutral-400" />
            Bill History
          </Link>
          <Link
            href="/tenant/inventory"
            className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-900 transition-colors"
          >
            Inventory Stock
          </Link>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Barcode Scanner & Quick Catalog Pick (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <ProductSearchBarcode onSelectProduct={handleAddProduct} />

          {/* Quick-Pick Catalog Section */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick-Pick Catalog
              </span>
              <span className="text-[11px] text-neutral-500">
                Click any product to add 1 unit to cart
              </span>
            </div>

            {isLoadingCatalog ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                Loading products...
              </div>
            ) : popularProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No active catalog products found. Import products to begin.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
                {popularProducts.map((p) => {
                  const inStock = (p.currentStock || 0) > 0;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => handleAddProduct(p)}
                      className="p-3 bg-neutral-950/80 hover:bg-neutral-800/60 border border-neutral-800 hover:border-neutral-700 rounded-xl text-left transition-all flex flex-col justify-between group h-24"
                    >
                      <div>
                        <p className="font-semibold text-neutral-200 group-hover:text-white text-xs truncate">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">
                          {p.packSize || p.category}
                        </p>
                      </div>

                      <div className="flex items-center justify-between w-full mt-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          ₹{p.mrp || 0}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            inStock ? 'text-neutral-400 bg-neutral-900' : 'text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          Stock: {p.currentStock ?? 0}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer + Cart + Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <CustomerSelector
            customer={customer}
            onSelectCustomer={(c) => setCustomer(c)}
          />

          <div className="h-[360px]">
            <CartTable
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateRate={handleUpdateRate}
              onUpdateDiscount={handleUpdateDiscount}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
            />
          </div>

          {/* Cart Summary & Checkout Action */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Subtotal ({cartItems.length} items)</span>
                <span className="font-mono text-neutral-200">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Bill-level Discount */}
              <div className="flex items-center justify-between text-neutral-400">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-400" /> Additional Discount (₹)
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={billDiscount}
                  onChange={(e) => setBillDiscount(e.target.value)}
                  className="w-20 bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-right font-mono text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-400 text-xs">
                  <span>Total Discount</span>
                  <span className="font-mono">-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Tax input */}
              <div className="flex items-center justify-between text-neutral-400">
                <span>Tax / GST (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={billTax}
                  onChange={(e) => setBillTax(e.target.value)}
                  className="w-20 bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-right font-mono text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div className="pt-2 border-t border-neutral-800 flex items-baseline justify-between">
                <span className="text-sm font-bold text-neutral-100">GRAND TOTAL</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() => setIsPaymentOpen(true)}
              className="w-full py-3 px-4 text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/20 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Complete Sale [F8]
            </button>
          </div>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        cart={cartPayload}
        customer={customer}
        onCompleteSale={(sale) => setCompletedSale(sale)}
      />

      {/* Post-Sale Completed Receipt Modal */}
      <CompletedBillModal
        isOpen={Boolean(completedSale)}
        sale={completedSale}
        onClose={() => setCompletedSale(null)}
        onNewBill={handleStartNewBill}
      />
    </div>
  );
}
