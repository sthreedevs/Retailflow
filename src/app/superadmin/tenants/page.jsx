'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button.jsx';

export default function TenantManagementPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/platform/tenants?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load tenants');
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTenants();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTenants]);

  async function handleStatusToggle(tenantId, currentStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setActionLoading(tenantId);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Status update failed');
      }
      await fetchTenants();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleImpersonate(tenantId) {
    setActionLoading(`impersonate-${tenantId}`);
    try {
      const res = await fetch('/api/platform/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to open store context');
      }
      router.push(data.redirectUrl || '/tenant/dashboard');
    } catch (err) {
      alert(`Impersonation error: ${err.message}`);
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">
            Tenant Stores &amp; Databases
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Isolated tenant databases, store owner accounts, and status management.
          </p>
        </div>

        <Link href="/superadmin/tenants/new">
          <Button size="sm" variant="default" className="text-xs">
            + Provision New Store
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search stores, emails, IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Tenants Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Fetching tenant registries...
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            No stores match your search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/90 border-b border-neutral-800 text-neutral-400">
                <tr>
                  <th className="py-3 px-4 font-medium">Store &amp; ID</th>
                  <th className="py-3 px-4 font-medium">Owner &amp; Contact</th>
                  <th className="py-3 px-4 font-medium">Database</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {tenants.map((t) => (
                  <tr key={t.tenantId} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-200 text-sm">
                        {t.storeName}
                      </div>
                      <div className="font-mono text-[11px] text-neutral-500">
                        {t.tenantId}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-neutral-300 font-medium">{t.ownerName}</div>
                      <div className="text-neutral-500 text-[11px]">{t.email} &bull; {t.phone}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                      {t.databaseName}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => handleImpersonate(t.tenantId)}
                          disabled={actionLoading === `impersonate-${t.tenantId}`}
                          className="h-7 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                        >
                          {actionLoading === `impersonate-${t.tenantId}` ? 'Opening...' : 'Open Store'}
                        </Button>

                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleStatusToggle(t.tenantId, t.status)}
                          disabled={actionLoading === t.tenantId}
                          className={`h-7 text-xs ${
                            t.status === 'ACTIVE'
                              ? 'border-neutral-800 text-amber-400 hover:bg-amber-500/10'
                              : 'border-neutral-800 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
