'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button.jsx';

export default function NewTenantPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
    initialPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provisionedData, setProvisionedData] = useState(null);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        initialPassword: formData.initialPassword.trim() || undefined,
      };

      const res = await fetch('/api/platform/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Tenant provisioning failed');
      }

      setProvisionedData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenStore(tenantId) {
    try {
      const res = await fetch('/api/platform/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        router.push(data.redirectUrl);
      }
    } catch (err) {
      alert(`Error opening store: ${err.message}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">
            Provision New Retail Store
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Initializes an isolated MongoDB database, default store settings, and owner account.
          </p>
        </div>

        <Link href="/superadmin/tenants">
          <Button size="xs" variant="outline" className="text-xs">
            &larr; Back to Stores
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {provisionedData ? (
        <div className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-6">
          <div className="space-y-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Provisioning Complete
            </span>
            <h2 className="text-lg font-bold text-neutral-100">
              Store &ldquo;{provisionedData.tenant.storeName}&rdquo; Ready
            </h2>
            <p className="text-xs text-neutral-400">
              The isolated database has been created and the store owner account is active.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 font-mono text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-400">Tenant ID:</span>
              <span className="text-neutral-100 font-semibold">{provisionedData.tenant.tenantId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Isolated Database:</span>
              <span className="text-emerald-400 font-semibold">{provisionedData.tenant.databaseName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Owner Login Email:</span>
              <span className="text-neutral-100">{provisionedData.ownerUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Initial Password:</span>
              <span className="text-amber-300 font-semibold">{provisionedData.initialPassword}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleOpenStore(provisionedData.tenant.tenantId)}
              variant="default"
              className="w-full text-xs"
            >
              Open Store Dashboard as Superadmin &rarr;
            </Button>
            <Link href="/superadmin/tenants" className="w-full">
              <Button variant="outline" className="w-full text-xs">
                Return to Tenant List
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-neutral-300">
                Store / Business Name *
              </label>
              <input
                type="text"
                name="storeName"
                required
                value={formData.storeName}
                onChange={handleChange}
                placeholder="e.g. Apex Pharmacy & General Stores"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Store Owner Full Name *
              </label>
              <input
                type="text"
                name="ownerName"
                required
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="e.g. Ramesh Kumar"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Owner Email (Username) *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="owner@apexstores.com"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Contact Phone *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-neutral-300">
                Initial Owner Password (optional)
              </label>
              <input
                type="password"
                name="initialPassword"
                value={formData.initialPassword}
                onChange={handleChange}
                placeholder="Leave blank to use default (StoreOwner123!)"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
              />
              <span className="text-[11px] text-neutral-500 block">
                Minimum 6 characters. The owner will use this to sign in.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex justify-end gap-3">
            <Link href="/superadmin/tenants">
              <Button type="button" variant="outline" size="sm" className="text-xs">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              variant="default"
              className="text-xs"
            >
              {loading ? 'Provisioning Database...' : 'Create & Initialize Store'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
