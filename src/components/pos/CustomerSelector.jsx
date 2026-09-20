'use client';

import React, { useState, useEffect } from 'react';
import { User, Plus, Search, X } from 'lucide-react';

export function CustomerSelector({ customer, onSelectCustomer }) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      const timer = setTimeout(() => {
        setResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tenant/pos/customers?search=${encodeURIComponent(searchQuery.trim())}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.customers || []);
        }
      } catch (err) {
        console.error('Customer search error:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleCreateCustomer(e) {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tenant/pos/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          address: newAddress.trim(),
        }),
      });
      const json = await res.json();
      if (json.success && json.customer) {
        onSelectCustomer({
          customerId: json.customer._id,
          name: json.customer.name,
          phone: json.customer.phone,
          address: json.customer.address,
        });
        setIsCreating(false);
        setIsSearching(false);
        setNewName('');
        setNewPhone('');
        setNewAddress('');
      }
    } catch (err) {
      console.error('Failed to create customer:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectWalkIn() {
    onSelectCustomer({
      customerId: null,
      name: 'Walk-in Customer',
      phone: '',
      address: '',
    });
    setIsSearching(false);
  }

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-500 block">Customer</span>
            <span className="text-xs font-semibold text-neutral-100">
              {customer?.name || 'Walk-in Customer'}
            </span>
            {customer?.phone && (
              <span className="text-[10px] text-neutral-400 font-mono ml-2">
                ({customer.phone})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {customer?.name !== 'Walk-in Customer' && (
            <button
              type="button"
              onClick={handleSelectWalkIn}
              className="text-[11px] text-neutral-400 hover:text-neutral-200 px-2 py-1 rounded bg-neutral-800/60 hover:bg-neutral-800 transition-colors"
            >
              Set Walk-in
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearching(!isSearching)}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors flex items-center gap-1"
          >
            <Search className="w-3 h-3" /> Select / Add
          </button>
        </div>
      </div>

      {/* Search & Select Overlay */}
      {isSearching && (
        <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer phone or name..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
            <button
              type="button"
              onClick={() => setIsSearching(false)}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {results.length > 0 && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg max-h-48 overflow-y-auto divide-y divide-neutral-800/60">
              {results.map((cust) => (
                <div
                  key={cust._id}
                  onClick={() => {
                    onSelectCustomer({
                      customerId: cust._id,
                      name: cust.name,
                      phone: cust.phone,
                      address: cust.address,
                    });
                    setIsSearching(false);
                  }}
                  className="p-2 cursor-pointer hover:bg-neutral-850 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-medium text-neutral-200">{cust.name}</span>
                    <span className="text-neutral-400 font-mono text-[11px] ml-2">{cust.phone}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {cust.totalPurchases || 0} visits
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Customer Dialog */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-100">Add New Customer</h4>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Customer Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Shop 4, Market Road"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
