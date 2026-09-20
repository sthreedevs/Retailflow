import { getSaleModel } from '../models/tenant/sale.model.js';
import { getProductModel } from '../models/tenant/product.model.js';
import { getInventoryModel } from '../models/tenant/inventory.model.js';
import { getStockMovementModel } from '../models/tenant/stock-movement.model.js';

/**
 * Calculates start and end Date objects for key business time intervals.
 * @param {Date} [referenceDate=new Date()]
 */
export function getPeriodBounds(referenceDate = new Date()) {
  const now = new Date(referenceDate);

  // Today bounds (00:00:00.000 to 23:59:59.999)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Yesterday bounds
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
  const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

  // This Month bounds (1st of current month to now)
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  // Previous Month bounds (1st of previous month to last day of previous month)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // 7 Days and 30 Days ago
  const daysAgo7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  daysAgo7.setHours(0, 0, 0, 0);

  const daysAgo30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  daysAgo30.setHours(0, 0, 0, 0);

  return {
    now,
    startOfToday,
    endOfToday,
    startOfYesterday,
    endOfYesterday,
    startOfThisMonth,
    startOfPrevMonth,
    endOfPrevMonth,
    daysAgo7,
    daysAgo30,
  };
}

/**
 * Helper to compute percentage delta between two numbers.
 * @param {number} current
 * @param {number} previous
 * @returns {number}
 */
function computePercentageChange(current, previous) {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Comprehensive Store Admin Analytics Aggregator
 * Gathers today's pulse, period comparisons, sales trends, category shares,
 * product velocity, inventory health, valuation, and live activity streams.
 *
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} [options={}]
 * @param {'7d' | '30d'} [options.range='7d']
 */
export async function getStoreDashboardMetrics(tenantConn, options = {}) {
  const { range = '7d' } = options;
  const bounds = getPeriodBounds();

  const Sale = getSaleModel(tenantConn);
  const Product = getProductModel(tenantConn);
  const Inventory = getInventoryModel(tenantConn);
  const StockMovement = getStockMovementModel(tenantConn);

  const trendStartDate = range === '30d' ? bounds.daysAgo30 : bounds.daysAgo7;

  // Execute analytical aggregations in parallel for peak performance
  const [
    todayMetrics,
    yesterdayMetrics,
    thisMonthMetrics,
    prevMonthMetrics,
    salesTrendData,
    categorySalesData,
    fastMovingData,
    slowMovingData,
    inventoryHealthData,
    stockAttentionData,
    adjustmentsSummary,
    recentBills,
    recentMovements,
  ] = await Promise.all([
    // 1. Today's metrics (Completed sales today)
    Sale.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: bounds.startOfToday, $lte: bounds.endOfToday },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalSales: { $sum: '$grandTotal' },
                totalBills: { $sum: 1 },
                uniqueCustomers: {
                  $addToSet: {
                    $cond: [
                      { $and: ['$customer.phone', { $ne: ['$customer.phone', ''] }] },
                      '$customer.phone',
                      '$_id', // fallback to unique bill if walk-in without phone
                    ],
                  },
                },
              },
            },
          ],
          units: [
            { $unwind: '$items' },
            {
              $group: {
                _id: null,
                totalUnits: { $sum: '$items.quantity' },
                totalEstimatedCost: {
                  $sum: { $multiply: ['$items.quantity', { $ifNull: ['$items.dp', 0] }] },
                },
              },
            },
          ],
        },
      },
    ]),

    // 2. Yesterday's metrics
    Sale.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: bounds.startOfYesterday, $lte: bounds.endOfYesterday },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalSales: { $sum: '$grandTotal' },
                totalBills: { $sum: 1 },
              },
            },
          ],
          units: [
            { $unwind: '$items' },
            {
              $group: {
                _id: null,
                totalUnits: { $sum: '$items.quantity' },
              },
            },
          ],
        },
      },
    ]),

    // 3. This Month MTD metrics
    Sale.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: bounds.startOfThisMonth, $lte: bounds.endOfToday },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalSales: { $sum: '$grandTotal' },
                totalBills: { $sum: 1 },
              },
            },
          ],
          units: [
            { $unwind: '$items' },
            {
              $group: {
                _id: null,
                totalUnits: { $sum: '$items.quantity' },
                totalEstimatedCost: {
                  $sum: { $multiply: ['$items.quantity', { $ifNull: ['$items.dp', 0] }] },
                },
              },
            },
          ],
        },
      },
    ]),

    // 4. Previous Month metrics
    Sale.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: bounds.startOfPrevMonth, $lte: bounds.endOfPrevMonth },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalSales: { $sum: '$grandTotal' },
                totalBills: { $sum: 1 },
              },
            },
          ],
          units: [
            { $unwind: '$items' },
            {
              $group: {
                _id: null,
                totalUnits: { $sum: '$items.quantity' },
              },
            },
          ],
        },
      },
    ]),

    // 5. Daily Sales Trend (7d or 30d)
    Sale.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: trendStartDate, $lte: bounds.endOfToday },
        },
      },
      {
        $project: {
          grandTotal: 1,
          items: 1,
          dateStr: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
        },
      },
      {
        $group: {
          _id: '$dateStr',
          sales: { $sum: '$grandTotal' },
          bills: { $sum: 1 },
          itemsList: { $push: '$items' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 6. Sales by Category (last 30 days)
    Sale.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: bounds.daysAgo30, $lte: bounds.endOfToday },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$product.category', 'General'] },
          revenue: { $sum: '$items.lineTotal' },
          units: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]),

    // 7. Fast-Moving Products (Top 5 sellers in last 30 days)
    Sale.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: bounds.daysAgo30, $lte: bounds.endOfToday },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          barcode: { $first: '$items.barcode' },
          packSize: { $first: '$items.packSize' },
          unit: { $first: '$items.unit' },
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: 'inventory',
          localField: '_id',
          foreignField: 'productId',
          as: 'inv',
        },
      },
      {
        $unwind: {
          path: '$inv',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          sku: 1,
          barcode: 1,
          packSize: 1,
          unit: 1,
          totalUnitsSold: 1,
          totalRevenue: 1,
          currentStock: { $ifNull: ['$inv.currentStock', 0] },
          minimumStock: { $ifNull: ['$inv.minimumStock', 5] },
        },
      },
    ]),

    // 8. Slow-Moving Products (In-stock products with lowest sales in 30 days)
    Product.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $lookup: {
          from: 'inventory',
          localField: '_id',
          foreignField: 'productId',
          as: 'inv',
        },
      },
      { $unwind: { path: '$inv', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'inv.currentStock': { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: 'sales',
          let: { prodId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$status', 'COMPLETED'] },
                    { $gte: ['$createdAt', bounds.daysAgo30] },
                  ],
                },
              },
            },
            { $unwind: '$items' },
            { $match: { $expr: { $eq: ['$items.productId', '$$prodId'] } } },
            { $group: { _id: null, sold: { $sum: '$items.quantity' } } },
          ],
          as: 'recentSales',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          category: 1,
          sku: 1,
          packSize: 1,
          dp: { $ifNull: ['$dp', 0] },
          mrp: { $ifNull: ['$mrp', 0] },
          currentStock: { $ifNull: ['$inv.currentStock', 0] },
          unitsSold30d: { $ifNull: [{ $arrayElemAt: ['$recentSales.sold', 0] }, 0] },
        },
      },
      { $sort: { unitsSold30d: 1, currentStock: -1 } },
      { $limit: 6 },
    ]),

    // 9. Overall Inventory Health & Valuation
    Product.aggregate([
      { $match: { status: { $ne: 'ARCHIVED' } } },
      {
        $lookup: {
          from: 'inventory',
          localField: '_id',
          foreignField: 'productId',
          as: 'inv',
        },
      },
      { $unwind: { path: '$inv', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          currentStock: { $ifNull: ['$inv.currentStock', 0] },
          minimumStock: { $ifNull: ['$inv.minimumStock', 5] },
          reorderLevel: { $ifNull: ['$inv.reorderLevel', 10] },
          dp: { $ifNull: ['$dp', 0] },
          mrp: { $ifNull: ['$mrp', 0] },
        },
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStockUnits: { $sum: '$currentStock' },
          totalValuationDP: { $sum: { $multiply: ['$currentStock', '$dp'] } },
          totalValuationMRP: { $sum: { $multiply: ['$currentStock', '$mrp'] } },
          outOfStockCount: {
            $sum: { $cond: [{ $lte: ['$currentStock', 0] }, 1, 0] },
          },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$currentStock', 0] },
                    { $lte: ['$currentStock', '$minimumStock'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          inStockCount: {
            $sum: { $cond: [{ $gt: ['$currentStock', '$minimumStock'] }, 1, 0] },
          },
        },
      },
    ]),

    // 10. Urgent Stock Attention Items (Out of stock or Low stock items)
    Inventory.aggregate([
      {
        $match: {
          $or: [
            { currentStock: { $lte: 0 } },
            { $expr: { $lte: ['$currentStock', '$minimumStock'] } },
          ],
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { 'product.status': 'ACTIVE' } },
      {
        $project: {
          _id: '$product._id',
          name: '$product.name',
          category: '$product.category',
          sku: '$product.sku',
          barcode: '$product.barcode',
          packSize: '$product.packSize',
          unit: '$product.unit',
          dp: '$product.dp',
          mrp: '$product.mrp',
          currentStock: '$currentStock',
          minimumStock: '$minimumStock',
          reorderLevel: '$reorderLevel',
          deficit: { $max: [0, { $subtract: ['$reorderLevel', '$currentStock'] }] },
          status: {
            $cond: [{ $lte: ['$currentStock', 0] }, 'OUT_OF_STOCK', 'LOW_STOCK'],
          },
        },
      },
      { $sort: { currentStock: 1, deficit: -1 } },
      { $limit: 8 },
    ]),

    // 11. Stock Adjustments & Damage Summary in last 30 days
    StockMovement.aggregate([
      {
        $match: {
          createdAt: { $gte: bounds.daysAgo30 },
          movementType: { $in: ['ADJUSTMENT', 'DAMAGE'] },
        },
      },
      {
        $group: {
          _id: '$movementType',
          totalCount: { $sum: 1 },
          totalUnits: { $sum: '$quantity' },
        },
      },
    ]),

    // 12. Recent Bills (Latest 5 completed sales)
    Sale.find({ status: 'COMPLETED' })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('invoiceNumber customer grandTotal items paymentMethod paymentStatus createdAt')
      .lean(),

    // 13. Recent Stock Movements (Latest 6 movements)
    StockMovement.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate({ path: 'productId', select: 'name sku packSize unit' })
      .lean(),
  ]);

  // Parse Today's Aggregations
  const todayTotals = todayMetrics[0]?.totals[0] || { totalSales: 0, totalBills: 0, uniqueCustomers: [] };
  const todayUnits = todayMetrics[0]?.units[0] || { totalUnits: 0, totalEstimatedCost: 0 };
  const salesToday = Math.round((todayTotals.totalSales || 0) * 100) / 100;
  const billsToday = todayTotals.totalBills || 0;
  const unitsSoldToday = Math.round((todayUnits.totalUnits || 0) * 100) / 100;
  const customersServedToday = Array.isArray(todayTotals.uniqueCustomers) ? todayTotals.uniqueCustomers.length : 0;
  const avgBillValueToday = billsToday > 0 ? Math.round((salesToday / billsToday) * 100) / 100 : 0;

  // Parse Yesterday's Aggregations
  const yestTotals = yesterdayMetrics[0]?.totals[0] || { totalSales: 0, totalBills: 0 };
  const yestUnits = yesterdayMetrics[0]?.units[0] || { totalUnits: 0 };
  const salesYesterday = Math.round((yestTotals.totalSales || 0) * 100) / 100;
  const billsYesterday = yestTotals.totalBills || 0;
  const unitsYesterday = Math.round((yestUnits.totalUnits || 0) * 100) / 100;
  const avgBillValueYesterday = billsYesterday > 0 ? Math.round((salesYesterday / billsYesterday) * 100) / 100 : 0;

  // Day-over-Day changes
  const salesChangeYesterdayPct = computePercentageChange(salesToday, salesYesterday);
  const billsChangeYesterdayPct = computePercentageChange(billsToday, billsYesterday);

  // Parse Month Metrics
  const thisMonthTotals = thisMonthMetrics[0]?.totals[0] || { totalSales: 0, totalBills: 0 };
  const thisMonthUnits = thisMonthMetrics[0]?.units[0] || { totalUnits: 0, totalEstimatedCost: 0 };
  const salesThisMonth = Math.round((thisMonthTotals.totalSales || 0) * 100) / 100;
  const billsThisMonth = thisMonthTotals.totalBills || 0;
  const unitsThisMonth = Math.round((thisMonthUnits.totalUnits || 0) * 100) / 100;

  const prevMonthTotals = prevMonthMetrics[0]?.totals[0] || { totalSales: 0, totalBills: 0 };
  const prevMonthUnits = prevMonthMetrics[0]?.units[0] || { totalUnits: 0 };
  const salesPrevMonth = Math.round((prevMonthTotals.totalSales || 0) * 100) / 100;
  const billsPrevMonth = prevMonthTotals.totalBills || 0;
  const unitsPrevMonth = Math.round((prevMonthUnits.totalUnits || 0) * 100) / 100;

  const salesMonthChangePct = computePercentageChange(salesThisMonth, salesPrevMonth);

  // Parse Sales Trend into day-by-day continuous timeline
  const daysCount = range === '30d' ? 30 : 7;
  const trendMap = new Map(salesTrendData.map((d) => [d._id, d]));
  const fullTrend = [];

  let totalPeriodRevenue = 0;
  let totalPeriodCost = 0;
  let itemsWithCostCount = 0;
  let totalItemsEvaluated = 0;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(bounds.now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().slice(0, 10);
    const matched = trendMap.get(dateKey);

    const daySales = matched ? Math.round(matched.sales * 100) / 100 : 0;
    const dayBills = matched ? matched.bills : 0;

    let dayCost = 0;
    let dayUnits = 0;

    if (matched && Array.isArray(matched.itemsList)) {
      for (const billItems of matched.itemsList) {
        if (Array.isArray(billItems)) {
          for (const it of billItems) {
            totalItemsEvaluated++;
            const qty = Number(it.quantity) || 0;
            const itemDp = Number(it.dp) || 0;
            dayUnits += qty;
            if (itemDp > 0) {
              itemsWithCostCount++;
              dayCost += qty * itemDp;
            }
          }
        }
      }
    }

    totalPeriodRevenue += daySales;
    totalPeriodCost += dayCost;

    const dayMargin = Math.max(0, Math.round((daySales - dayCost) * 100) / 100);
    const dayMarginPct = daySales > 0 ? Math.round((dayMargin / daySales) * 1000) / 10 : 0;

    fullTrend.push({
      date: dateKey,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
      sales: daySales,
      bills: dayBills,
      units: Math.round(dayUnits * 100) / 100,
      estimatedCost: Math.round(dayCost * 100) / 100,
      grossMargin: dayMargin,
      grossMarginPct: dayMarginPct,
    });
  }

  // Margin reliability calculation
  const hasReliableCostData = totalItemsEvaluated > 0 && (itemsWithCostCount / totalItemsEvaluated) >= 0.5;
  const totalPeriodGrossMargin = Math.max(0, Math.round((totalPeriodRevenue - totalPeriodCost) * 100) / 100);
  const totalPeriodMarginPct = totalPeriodRevenue > 0
    ? Math.round((totalPeriodGrossMargin / totalPeriodRevenue) * 1000) / 10
    : 0;

  // Category shares calculation
  const totalCategoryRevenue = categorySalesData.reduce((acc, cat) => acc + cat.revenue, 0);
  const categoryBreakdown = categorySalesData.map((cat) => ({
    category: cat._id,
    revenue: Math.round(cat.revenue * 100) / 100,
    units: Math.round(cat.units * 100) / 100,
    percentage: totalCategoryRevenue > 0 ? Math.round((cat.revenue / totalCategoryRevenue) * 1000) / 10 : 0,
  }));

  // Inventory Health Summary
  const invSummary = inventoryHealthData[0] || {
    totalProducts: 0,
    totalStockUnits: 0,
    totalValuationDP: 0,
    totalValuationMRP: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    inStockCount: 0,
  };

  // Adjustments breakdown
  const adjSummary = {
    damagesCount: 0,
    damagesUnits: 0,
    adjustmentsCount: 0,
    adjustmentsUnits: 0,
  };
  for (const a of adjustmentsSummary) {
    if (a._id === 'DAMAGE') {
      adjSummary.damagesCount = a.totalCount;
      adjSummary.damagesUnits = Math.round(a.totalUnits * 100) / 100;
    } else if (a._id === 'ADJUSTMENT') {
      adjSummary.adjustmentsCount = a.totalCount;
      adjSummary.adjustmentsUnits = Math.round(a.totalUnits * 100) / 100;
    }
  }

  return {
    range,
    today: {
      sales: salesToday,
      bills: billsToday,
      unitsSold: unitsSoldToday,
      customersServed: customersServedToday,
      averageBillValue: avgBillValueToday,
      comparison: {
        yesterdaySales: salesYesterday,
        yesterdayBills: billsYesterday,
        yesterdayUnits: unitsYesterday,
        yesterdayAvgBillValue: avgBillValueYesterday,
        salesChangePct: salesChangeYesterdayPct,
        billsChangePct: billsChangeYesterdayPct,
      },
    },
    periodComparison: {
      yesterday: {
        sales: salesYesterday,
        bills: billsYesterday,
        unitsSold: unitsYesterday,
        averageBillValue: avgBillValueYesterday,
      },
      thisMonth: {
        sales: salesThisMonth,
        bills: billsThisMonth,
        unitsSold: unitsThisMonth,
      },
      previousMonth: {
        sales: salesPrevMonth,
        bills: billsPrevMonth,
        unitsSold: unitsPrevMonth,
      },
      monthOverMonthChangePct: salesMonthChangePct,
    },
    salesAnalytics: {
      range,
      trend: fullTrend,
      revenue: Math.round(totalPeriodRevenue * 100) / 100,
      estimatedCost: Math.round(totalPeriodCost * 100) / 100,
      grossMargin: totalPeriodGrossMargin,
      grossMarginPct: totalPeriodMarginPct,
      hasReliableCostData,
      categories: categoryBreakdown,
    },
    merchandising: {
      fastMoving: fastMovingData.map((p) => ({
        ...p,
        totalRevenue: Math.round(p.totalRevenue * 100) / 100,
        stockStatus: p.currentStock <= 0 ? 'OUT_OF_STOCK' : p.currentStock <= p.minimumStock ? 'LOW_STOCK' : 'IN_STOCK',
      })),
      slowMoving: slowMovingData.map((p) => ({
        ...p,
        stockValuationDP: Math.round(p.currentStock * p.dp * 100) / 100,
        stockValuationMRP: Math.round(p.currentStock * p.mrp * 100) / 100,
      })),
    },
    inventory: {
      totalProducts: invSummary.totalProducts,
      totalStockUnits: Math.round(invSummary.totalStockUnits * 100) / 100,
      valuationDP: Math.round(invSummary.totalValuationDP * 100) / 100,
      valuationMRP: Math.round(invSummary.totalValuationMRP * 100) / 100,
      potentialProfit: Math.max(0, Math.round((invSummary.totalValuationMRP - invSummary.totalValuationDP) * 100) / 100),
      statusCounts: {
        inStock: invSummary.inStockCount,
        lowStock: invSummary.lowStockCount,
        outOfStock: invSummary.outOfStockCount,
      },
      stockAttention: stockAttentionData,
      adjustments: adjSummary,
    },
    recentActivity: {
      bills: recentBills.map((b) => ({
        _id: b._id,
        invoiceNumber: b.invoiceNumber,
        customerName: b.customer?.name || 'Walk-in Customer',
        customerPhone: b.customer?.phone || '',
        grandTotal: b.grandTotal,
        itemsCount: b.items?.length || 0,
        paymentMethod: b.paymentMethod,
        createdAt: b.createdAt,
      })),
      movements: recentMovements.map((m) => ({
        _id: m._id,
        productName: m.productId?.name || 'Unknown Item',
        productSku: m.productId?.sku || '',
        movementType: m.movementType,
        direction: m.direction,
        quantity: m.quantity,
        previousStock: m.previousStock,
        newStock: m.newStock,
        createdAt: m.createdAt,
      })),
    },
  };
}
