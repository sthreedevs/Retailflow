import { getPlatformTenantModel } from '../models/platform/tenant.model.js';
import { getPlatformStoreDailyStatsModel } from '../models/platform/store-daily-stats.model.js';
import { getPlatformStoreMonthlyStatsModel } from '../models/platform/store-monthly-stats.model.js';
import { TenantConnectionManager } from '../db/tenant-manager.js';
import { getSaleModel } from '../models/tenant/sale.model.js';
import { TENANT_STATUS } from '../lib/constants.js';

/**
 * Atomically increments platform summary records (StoreDailyStats & StoreMonthlyStats)
 * whenever a sale event occurs in any tenant.
 *
 * @param {object} params
 * @param {string} params.tenantId
 * @param {string} [params.storeName]
 * @param {Date|string} [params.saleDate=new Date()]
 * @param {number} params.grandTotal
 * @param {number} [params.unitsCount=1]
 */
export async function recordPlatformSaleEvent({
  tenantId,
  storeName,
  saleDate = new Date(),
  grandTotal = 0,
  unitsCount = 1,
}) {
  if (!tenantId) return;

  try {
    const d = new Date(saleDate);
    const dateStr = d.toISOString().slice(0, 10);
    const monthStr = dateStr.slice(0, 7);

    const safeTenantId = String(tenantId).trim().toLowerCase();
    const safeStoreName = String(storeName || tenantId).trim();
    const amount = Number(grandTotal) || 0;
    const units = Number(unitsCount) || 1;

    const [DailyStats, MonthlyStats] = await Promise.all([
      getPlatformStoreDailyStatsModel(),
      getPlatformStoreMonthlyStatsModel(),
    ]);

    await Promise.all([
      DailyStats.findOneAndUpdate(
        { tenantId: safeTenantId, date: dateStr },
        {
          $set: { storeName: safeStoreName, lastUpdated: new Date() },
          $inc: { sales: amount, invoices: 1, units },
        },
        { upsert: true }
      ),
      MonthlyStats.findOneAndUpdate(
        { tenantId: safeTenantId, month: monthStr },
        {
          $set: { storeName: safeStoreName, lastUpdated: new Date() },
          $inc: { sales: amount, invoices: 1, units },
        },
        { upsert: true }
      ),
    ]);
  } catch (err) {
    // Non-blocking log to ensure tenant sale checkout is never failed by platform telemetry
    console.error(`[PlatformStats] Failed to record sale event for tenant ${tenantId}:`, err?.message);
  }
}

/**
 * Scans a specific tenant's sales collection, computes daily and monthly rollups,
 * and bulk upserts into StoreDailyStats and StoreMonthlyStats in the platform DB.
 *
 * @param {string} tenantId
 */
export async function syncTenantSalesToPlatform(tenantId) {
  const TenantModel = await getPlatformTenantModel();
  const tenant = await TenantModel.findOne({ tenantId: tenantId.trim().toLowerCase() }).lean();
  if (!tenant) {
    throw new Error(`Tenant "${tenantId}" not found in platform registry.`);
  }

  const tenantConn = await TenantConnectionManager.getTenantConnection(tenant.databaseName);
  const Sale = getSaleModel(tenantConn);

  // Aggregate daily sales in tenant database
  const dailyRollup = await Sale.aggregate([
    { $match: { status: 'COMPLETED' } },
    {
      $project: {
        grandTotal: 1,
        items: 1,
        dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      },
    },
    { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          dateStr: '$dateStr',
          invoiceId: '$_id',
          grandTotal: '$grandTotal',
        },
        unitsInBill: { $sum: { $ifNull: ['$items.quantity', 1] } },
      },
    },
    {
      $group: {
        _id: '$_id.dateStr',
        totalSales: { $sum: '$_id.grandTotal' },
        totalInvoices: { $sum: 1 },
        totalUnits: { $sum: '$unitsInBill' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const [DailyStats, MonthlyStats] = await Promise.all([
    getPlatformStoreDailyStatsModel(),
    getPlatformStoreMonthlyStatsModel(),
  ]);

  const monthMap = new Map();

  for (const day of dailyRollup) {
    const dateStr = day._id;
    const monthStr = dateStr.slice(0, 7);

    // Upsert daily record
    await DailyStats.findOneAndUpdate(
      { tenantId: tenant.tenantId, date: dateStr },
      {
        $set: {
          storeName: tenant.storeName,
          sales: Math.round(day.totalSales * 100) / 100,
          invoices: day.totalInvoices,
          units: Math.round(day.totalUnits * 100) / 100,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );

    // Accumulate for monthly rollup
    const existingMonth = monthMap.get(monthStr) || { sales: 0, invoices: 0, units: 0, activeDays: 0 };
    existingMonth.sales += day.totalSales;
    existingMonth.invoices += day.totalInvoices;
    existingMonth.units += day.totalUnits;
    existingMonth.activeDays += 1;
    monthMap.set(monthStr, existingMonth);
  }

  // Upsert monthly records
  for (const [monthStr, data] of monthMap.entries()) {
    await MonthlyStats.findOneAndUpdate(
      { tenantId: tenant.tenantId, month: monthStr },
      {
        $set: {
          storeName: tenant.storeName,
          sales: Math.round(data.sales * 100) / 100,
          invoices: data.invoices,
          units: Math.round(data.units * 100) / 100,
          activeDays: data.activeDays,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );
  }

  return {
    tenantId: tenant.tenantId,
    storeName: tenant.storeName,
    daysSynced: dailyRollup.length,
    monthsSynced: monthMap.size,
  };
}

/**
 * Synchronizes all registered active tenants into the platform summary tables.
 */
export async function syncAllTenantsSalesToPlatform() {
  const TenantModel = await getPlatformTenantModel();
  const tenants = await TenantModel.find({ status: { $ne: 'ARCHIVED' } }).lean();

  const results = [];
  for (const t of tenants) {
    try {
      const res = await syncTenantSalesToPlatform(t.tenantId);
      results.push({ success: true, ...res });
    } catch (err) {
      results.push({ success: false, tenantId: t.tenantId, error: err.message });
    }
  }

  return {
    totalTenants: tenants.length,
    syncedCount: results.filter((r) => r.success).length,
    details: results,
  };
}

/**
 * Superadmin Platform Aggregated Analytics.
 * Reads EXCLUSIVELY from the platform database (tenants, store_daily_stats, store_monthly_stats)
 * with ZERO queries dispatched to individual tenant databases.
 *
 * @param {object} [options={}]
 * @param {'7d'|'30d'} [options.range='30d']
 */
export async function getPlatformAggregatedAnalytics(options = {}) {
  const { range = '30d' } = options;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const thisMonthStr = todayStr.slice(0, 7);

  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

  const daysCount = range === '7d' ? 7 : 30;
  const rangeStartDate = new Date(now.getTime() - daysCount * 24 * 60 * 60 * 1000);
  const rangeStartStr = rangeStartDate.toISOString().slice(0, 10);

  const [TenantModel, DailyStats, MonthlyStats] = await Promise.all([
    getPlatformTenantModel(),
    getPlatformStoreDailyStatsModel(),
    getPlatformStoreMonthlyStatsModel(),
  ]);

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Execute summary queries in platform DB in parallel
  const [
    totalStores,
    activeStores,
    suspendedStores,
    newStoresThisMonth,
    newStoresThisWeek,
    todayStatsAggregation,
    yesterdayStatsAggregation,
    monthStatsAggregation,
    prevMonthStatsAggregation,
    allTimeStatsAggregation,
    dailyTrendAggregation,
    topStoresAggregation,
  ] = await Promise.all([
    TenantModel.countDocuments(),
    TenantModel.countDocuments({ status: TENANT_STATUS.ACTIVE }),
    TenantModel.countDocuments({ status: TENANT_STATUS.SUSPENDED }),
    TenantModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    TenantModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

    // Today across stores
    DailyStats.aggregate([
      { $match: { date: todayStr } },
      {
        $group: {
          _id: null,
          salesToday: { $sum: '$sales' },
          invoicesToday: { $sum: '$invoices' },
          unitsToday: { $sum: '$units' },
          activeStoresToday: { $sum: { $cond: [{ $gt: ['$invoices', 0] }, 1, 0] } },
        },
      },
    ]),

    // Yesterday across stores
    DailyStats.aggregate([
      { $match: { date: yesterdayStr } },
      {
        $group: {
          _id: null,
          salesYesterday: { $sum: '$sales' },
          invoicesYesterday: { $sum: '$invoices' },
        },
      },
    ]),

    // This Month across stores
    MonthlyStats.aggregate([
      { $match: { month: thisMonthStr } },
      {
        $group: {
          _id: null,
          salesThisMonth: { $sum: '$sales' },
          invoicesThisMonth: { $sum: '$invoices' },
          unitsThisMonth: { $sum: '$units' },
        },
      },
    ]),

    // Previous Month across stores
    MonthlyStats.aggregate([
      { $match: { month: prevMonthStr } },
      {
        $group: {
          _id: null,
          salesPrevMonth: { $sum: '$sales' },
          invoicesPrevMonth: { $sum: '$invoices' },
        },
      },
    ]),

    // All-time summary
    MonthlyStats.aggregate([
      {
        $group: {
          _id: null,
          totalSalesAllTime: { $sum: '$sales' },
          totalInvoicesAllTime: { $sum: '$invoices' },
        },
      },
    ]),

    // Daily Cross-Store Timeline
    DailyStats.aggregate([
      { $match: { date: { $gte: rangeStartStr, $lte: todayStr } } },
      {
        $group: {
          _id: '$date',
          sales: { $sum: '$sales' },
          invoices: { $sum: '$invoices' },
          activeStoresCount: { $sum: { $cond: [{ $gt: ['$invoices', 0] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Top Stores by Revenue in last 30 days / month
    DailyStats.aggregate([
      { $match: { date: { $gte: rangeStartStr, $lte: todayStr } } },
      {
        $group: {
          _id: '$tenantId',
          storeName: { $first: '$storeName' },
          totalSales: { $sum: '$sales' },
          totalInvoices: { $sum: '$invoices' },
          lastActiveDate: { $max: '$date' },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 8 },
    ]),
  ]);

  // Parse Today's Cross-Store
  const todaySummary = todayStatsAggregation[0] || {
    salesToday: 0,
    invoicesToday: 0,
    unitsToday: 0,
    activeStoresToday: 0,
  };

  const yesterdaySummary = yesterdayStatsAggregation[0] || {
    salesYesterday: 0,
    invoicesYesterday: 0,
  };

  const monthSummary = monthStatsAggregation[0] || {
    salesThisMonth: 0,
    invoicesThisMonth: 0,
    unitsThisMonth: 0,
  };

  const prevMonthSummary = prevMonthStatsAggregation[0] || {
    salesPrevMonth: 0,
    invoicesPrevMonth: 0,
  };

  const allTimeSummary = allTimeStatsAggregation[0] || {
    totalSalesAllTime: 0,
    totalInvoicesAllTime: 0,
  };

  // Compute month-over-month growth %
  const momGrowthPct = prevMonthSummary.salesPrevMonth > 0
    ? Math.round(((monthSummary.salesThisMonth - prevMonthSummary.salesPrevMonth) / prevMonthSummary.salesPrevMonth) * 1000) / 10
    : monthSummary.salesThisMonth > 0 ? 100 : 0;

  // Build continuous daily trend timeline
  const trendMap = new Map(dailyTrendAggregation.map((d) => [d._id, d]));
  const timeline = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().slice(0, 10);
    const matched = trendMap.get(dateKey);

    timeline.push({
      date: dateKey,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
      sales: matched ? Math.round(matched.sales * 100) / 100 : 0,
      invoices: matched ? matched.invoices : 0,
      activeStoresCount: matched ? matched.activeStoresCount : 0,
    });
  }

  // Look up store status for top stores
  const topTenantIds = topStoresAggregation.map((s) => s._id);
  const tenantDocs = await TenantModel.find({ tenantId: { $in: topTenantIds } })
    .select('tenantId storeName status databaseName email')
    .lean();

  const statusMap = new Map(tenantDocs.map((t) => [t.tenantId, t]));

  const enrichedTopStores = topStoresAggregation.map((store) => {
    const t = statusMap.get(store._id);
    return {
      tenantId: store._id,
      storeName: t?.storeName || store.storeName || store._id,
      email: t?.email || '',
      status: t?.status || 'ACTIVE',
      totalSales: Math.round(store.totalSales * 100) / 100,
      totalInvoices: store.totalInvoices,
      lastActiveDate: store.lastActiveDate,
    };
  });

  return {
    range,
    stores: {
      totalStores,
      activeStores,
      suspendedStores,
      newStoresThisMonth,
      newStoresThisWeek,
    },
    sales: {
      totalSalesAllTime: Math.round(allTimeSummary.totalSalesAllTime * 100) / 100,
      salesToday: Math.round(todaySummary.salesToday * 100) / 100,
      salesYesterday: Math.round(yesterdaySummary.salesYesterday * 100) / 100,
      salesThisMonth: Math.round(monthSummary.salesThisMonth * 100) / 100,
      salesPrevMonth: Math.round(prevMonthSummary.salesPrevMonth * 100) / 100,
      momGrowthPct,
    },
    invoices: {
      totalInvoicesAllTime: allTimeSummary.totalInvoicesAllTime,
      invoicesToday: todaySummary.invoicesToday,
      invoicesThisMonth: monthSummary.invoicesThisMonth,
    },
    activity: {
      activeStoresToday: todaySummary.activeStoresToday,
      activeStoresYesterday: yesterdaySummary.invoicesYesterday > 0 ? 1 : 0,
    },
    timeline,
    topStores: enrichedTopStores,
  };
}
