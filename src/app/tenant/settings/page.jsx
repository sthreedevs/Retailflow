'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Store, Receipt, CheckCircle, AlertCircle, Save } from 'lucide-react';

export default function TenantSettingsPage() {
  const [formData, setFormData] = useState({
    storeName: '',
    phone: '',
    email: '',
    address: '',
    invoicePrefix: 'INV-',
    receiptWidth: '80mm',
    taxEnabled: false,
    taxRate: 0,
    footerMessage: 'Thank you for shopping with us! Visit again.',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tenant/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setFormData({
          storeName: data.settings.storeName || '',
          phone: data.settings.phone || '',
          email: data.settings.email || '',
          address: data.settings.address || '',
          invoicePrefix: data.settings.invoicePrefix || 'INV-',
          receiptWidth: data.settings.receiptWidth || '80mm',
          taxEnabled: Boolean(data.settings.taxEnabled),
          taxRate: data.settings.taxRate ?? 0,
          footerMessage: data.settings.footerMessage || 'Thank you for shopping with us! Visit again.',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load store settings.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSettings();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/tenant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Store settings and invoice defaults saved successfully!' });
      } else {
        throw new Error(data.message || 'Failed to update settings');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error updating settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-neutral-500 text-xs">
        Loading store configuration...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200">
            <Settings className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Store & Invoice Settings</h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Configure store contact details, default invoice layouts, receipt dimensions, and branding.
            </p>
          </div>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Profile Section */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Store className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-neutral-200">Store Profile & Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="storeName" className="font-medium text-neutral-300">
                Store Name *
              </label>
              <input
                id="storeName"
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                placeholder="e.g. Apex Supermarket"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="font-medium text-neutral-300">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="font-medium text-neutral-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                placeholder="store@example.com"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="address" className="font-medium text-neutral-300">
                Store Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                placeholder="Street address, City, State, PIN"
              />
            </div>
          </div>
        </div>

        {/* Invoice & Receipt Formatting Section */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-neutral-200">Invoice Delivery & Format Defaults</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Default Receipt Format */}
            <div className="space-y-2">
              <span className="block font-medium text-neutral-300">
                Default Invoice Layout / Width *
              </span>
              <p className="text-[11px] text-neutral-400">
                Select the default format used for printing, PDF downloads, and customer digital receipts.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {[
                  { id: '80mm', name: '80mm Thermal Receipt', desc: 'Standard POS receipt printer (ESC/POS 3-inch)' },
                  { id: '58mm', name: '58mm Thermal Receipt', desc: 'Compact portable/mobile thermal printer (2-inch)' },
                  { id: 'A4', name: 'A4 Standard Invoice', desc: 'Full-size office/laser printer document' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.receiptWidth === item.id
                        ? 'bg-neutral-800/80 border-emerald-500/50 shadow-sm'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-neutral-100">{item.name}</span>
                      <input
                        type="radio"
                        name="receiptWidth"
                        value={item.id}
                        checked={formData.receiptWidth === item.id}
                        onChange={handleChange}
                        className="text-emerald-500 focus:ring-0"
                      />
                    </div>
                    <span className="text-[11px] text-neutral-400">{item.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="invoicePrefix" className="font-medium text-neutral-300">
                  Invoice Number Prefix
                </label>
                <input
                  id="invoicePrefix"
                  type="text"
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleChange}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 font-mono"
                  placeholder="INV-"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="taxRate" className="font-medium text-neutral-300">
                  Default Tax Rate (%)
                </label>
                <input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 font-mono"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label htmlFor="footerMessage" className="font-medium text-neutral-300">
                Receipt Footer / Custom Message
              </label>
              <textarea
                id="footerMessage"
                name="footerMessage"
                rows={2}
                value={formData.footerMessage}
                onChange={handleChange}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                placeholder="Thank you for shopping with us! Visit again."
              />
              <p className="text-[10px] text-neutral-500">
                Appears at the bottom of printed receipts, downloaded PDFs, and WhatsApp sharing messages.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
