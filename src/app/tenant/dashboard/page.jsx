'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RefreshCw, ShoppingCart, PackagePlus, Upload, ShieldCheck, AlertCircle } from 'lucide-react';
import { TodayPulseBar } from '@/components/analytics/TodayPulseBar.jsx';
import { PeriodComparisonCard } from '@/components/analytics/PeriodComparisonCard.jsx';
import { SalesTrendChart } from '@/components/analytics/SalesTrendChart.jsx';
import { CategoryBreakdownChart } from '@/components/analytics/CategoryBreakdownChart.jsx';
import { ProductVelocityMatrix } from '@/components/analytics/ProductVelocityMatrix.jsx';
import { InventoryHealthCard } from '@/components/analytics/InventoryHealthCard.jsx';
import { StockAttentionTable } from '@/components/analytics/StockAttentionTable.jsx';
import { RecentActivityFeed } from '@/components/analytics/RecentActivityFeed.jsx';

export default function TenantDashboardPage() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async (selectedRange = range, isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/tenant/analytics/dashboard?range=${selectedRange}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Failed to aggregate store analytics.');
      }
    } catch (err) {
      setError(err.message || 'Error loading dashboard data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnalytics(range);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAnalytics, range]);

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    fetchAnalytics(newRange);
  };

  const handleManualRefresh = () => {
    fetchAnalytics(range, true);
  };

  if (isLoading && !data) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-400">Aggregating store performance metrics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3 max-w-lg mx-auto my-12">
        <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
        <h3 className="text-sm font-bold text-rose-300">Unable to Load Dashboard</h3>
        <p className="text-xs text-rose-400/90">{error}</p>
        <button
          type="button"
          onClick={() => fetchAnalytics(range)}
          className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-neutral-100 tracking-tight">
              Store Admin Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> Live Store Data
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time sales velocity, inventory health, and replenishment decision support
          </p>
        </div>

        {/* Quick Action Links & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/tenant/pos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> POS Counter
          </Link>
          <Link
            href="/tenant/products"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <PackagePlus className="w-3.5 h-3.5" /> Catalog
          </Link>
          <Link
            href="/tenant/products/import"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </Link>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Today's Store Pulse Banner */}
      <TodayPulseBar today={data?.today} />

      {/* 2. Historical Period Performance Comparison */}
      <PeriodComparisonCard periodComparison={data?.periodComparison} />

      {/* 3. Sales Trend & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <SalesTrendChart
            salesAnalytics={data?.salesAnalytics}
            onRangeChange={handleRangeChange}
            currentRange={range}
          />
        </div>
        <div className="lg:col-span-4">
          <CategoryBreakdownChart categories={data?.salesAnalytics?.categories} />
        </div>
      </div>

      {/* 4. Merchandising Matrix & Inventory Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-6">
          <ProductVelocityMatrix merchandising={data?.merchandising} />
        </div>
        <div className="lg:col-span-6">
          <InventoryHealthCard inventory={data?.inventory} />
        </div>
      </div>

      {/* 5. Critical Stock Attention & Replenishment Table */}
      <StockAttentionTable stockAttention={data?.inventory?.stockAttention} />

      {/* 6. Live Store Activity Stream */}
      <RecentActivityFeed recentActivity={data?.recentActivity} />
    </div>
  );
}
