'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RefreshCw, Plus, Store, RotateCw, AlertCircle, History } from 'lucide-react';
import { PlatformPulseBar } from '@/components/superadmin/PlatformPulseBar.jsx';
import { PlatformGrowthChart } from '@/components/superadmin/PlatformGrowthChart.jsx';
import { TopStoresTable } from '@/components/superadmin/TopStoresTable.jsx';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async (selectedRange = range, isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/platform/dashboard?range=${selectedRange}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to load platform dashboard');
      }
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboard(range);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboard, range]);

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    fetchDashboard(newRange);
  };

  const handleSyncStats = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await fetch('/api/platform/analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Synchronization failed');
      }
      setSyncMessage(json.message || 'Platform stats rolled up successfully.');
      fetchDashboard(range, true);
    } catch (err) {
      setError(err.message || 'Failed to trigger synchronization.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-400">Loading platform analytics &amp; summary records...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3 max-w-lg mx-auto my-12">
        <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
        <h3 className="text-sm font-bold text-rose-300">Unable to Load Platform Analytics</h3>
        <p className="text-xs text-rose-400/90">{error}</p>
        <button
          type="button"
          onClick={() => fetchDashboard(range)}
          className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const analytics = data?.data || {};
  const recentLogs = data?.recentActivity || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Platform Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-neutral-100 tracking-tight">
              Platform Analytics
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Superadmin Portal
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Cross-store turnover, multi-tenant growth trends, and real-time tenant drilldown
          </p>
        </div>

        {/* Superadmin Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncStats}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-50"
            title="Roll up latest tenant stats into platform summary records"
          >
            <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Summaries'}
          </button>

          <Link
            href="/superadmin/tenants/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm shadow-emerald-950/40"
          >
            <Plus className="w-3.5 h-3.5" /> Provision Store
          </Link>

          <Link
            href="/superadmin/tenants"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:text-white rounded-xl transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-neutral-400" /> Manage Tenants
          </Link>

          <button
            type="button"
            onClick={() => fetchDashboard(range, true)}
            disabled={refreshing}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <span>{syncMessage}</span>
          <button
            type="button"
            onClick={() => setSyncMessage('')}
            className="text-neutral-400 hover:text-neutral-200 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* 1. Platform Pulse Bar (Stores & Cross-Store Sales) */}
      <PlatformPulseBar
        stores={analytics.stores}
        sales={analytics.sales}
        invoices={analytics.invoices}
        activity={analytics.activity}
      />

      {/* 2. Platform Growth Timeline */}
      <PlatformGrowthChart
        timeline={analytics.timeline}
        range={range}
        onRangeChange={handleRangeChange}
      />

      {/* 3. Top Performing Stores & Drilldown Table */}
      <TopStoresTable topStores={analytics.topStores} />

      {/* 4. Platform Audit Trail Feed */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-neutral-100">Superadmin Audit Activity Trail</h3>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Platform Security Log</span>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-neutral-500 py-6 text-center">
            No recent platform audit log entries recorded.
          </p>
        ) : (
          <div className="divide-y divide-neutral-800/60 text-xs font-mono">
            {recentLogs.map((log) => (
              <div
                key={log._id}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-neutral-800/20 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-purple-300">
                      {log.action}
                    </span>
                    {log.targetTenantId && (
                      <span className="text-emerald-400 font-semibold text-[11px]">
                        @{log.targetTenantId}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 truncate font-sans">
                    By: {log.performedBy?.email || 'Admin'}
                  </p>
                </div>

                <div className="text-right shrink-0 text-[10px] text-neutral-500">
                  {new Date(log.createdAt).toLocaleDateString()}{' '}
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
