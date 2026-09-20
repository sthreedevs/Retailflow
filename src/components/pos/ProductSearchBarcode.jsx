'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Barcode } from 'lucide-react';

export function ProductSearchBarcode({ onSelectProduct }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Global hotkey F2 or '/' to focus scanner input
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'F2' || (e.key === '/' && document.activeElement.tagName !== 'INPUT')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchProducts = useCallback(async (text) => {
    if (!text.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    try {
      const res = await fetch(`/api/tenant/pos/search?query=${encodeURIComponent(text.trim())}`);
      const json = await res.json();
      if (json.success) {
        setResults(json.products || []);
        setIsOpen(true);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error('POS search failed:', err);
    }
  }, []);

  // Debounced search for manual typing
  useEffect(() => {
    if (!query.trim()) {
      const timer = setTimeout(() => {
        setResults([]);
        setIsOpen(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      searchProducts(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, searchProducts]);

  // Handle Enter keypress: scanner support & keyboard navigation
  async function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (!query.trim()) return;

      setIsScanning(true);
      try {
        // First check exact barcode match
        const res = await fetch(`/api/tenant/pos/search?barcode=${encodeURIComponent(query.trim())}`);
        const json = await res.json();

        if (json.success && json.products?.length === 1) {
          // Exact single barcode match -> instant add
          onSelectProduct(json.products[0]);
          setQuery('');
          setIsOpen(false);
          setIsScanning(false);
          return;
        }

        // Otherwise, if dropdown is open and user selected an item
        if (results.length > 0 && results[selectedIndex]) {
          onSelectProduct(results[selectedIndex]);
          setQuery('');
          setIsOpen(false);
          setIsScanning(false);
          return;
        }
      } catch (err) {
        console.error('Barcode lookup error:', err);
      } finally {
        setIsScanning(false);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % (results.length || 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function handleSelectItem(product) {
    onSelectProduct(product);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center gap-1.5 text-neutral-500 pointer-events-none">
          <Barcode className="w-4 h-4 text-emerald-400" />
          <Search className="w-3.5 h-3.5" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Scan Barcode or Search Product (Name, SKU) [Press F2 or / to focus]..."
          className="w-full bg-neutral-950 border-2 border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-12 pr-28 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 transition-all font-sans shadow-inner"
        />
        <div className="absolute right-3 flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
          {isScanning ? (
            <span className="text-emerald-400 font-bold animate-pulse">Scanning...</span>
          ) : (
            <>
              <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 border border-neutral-700">
                F2
              </span>
              <span className="hidden sm:inline text-neutral-600">• Scan / Enter</span>
            </>
          )}
        </div>
      </div>

      {/* Search Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-40 max-h-80 overflow-y-auto divide-y divide-neutral-800/60">
          {results.map((product, idx) => {
            const isSelected = idx === selectedIndex;
            const inStock = (product.currentStock || 0) > 0;
            return (
              <div
                key={product._id}
                onClick={() => handleSelectItem(product)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-3 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  isSelected ? 'bg-neutral-800/80 text-white' : 'hover:bg-neutral-800/40 text-neutral-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-100">{product.name}</span>
                    {product.packSize && (
                      <span className="text-[10px] text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                        {product.packSize}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono">
                    {product.barcode && <span>BAR: {product.barcode}</span>}
                    {product.sku && <span>SKU: {product.sku}</span>}
                    <span>Cat: {product.category}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    ₹{product.mrp || 0}
                  </div>
                  <div>
                    {inStock ? (
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                        Stock: {product.currentStock}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
