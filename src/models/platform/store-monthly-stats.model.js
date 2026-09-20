import { Schema } from 'mongoose';
import { getPlatformConnection } from '../../db/mongodb.js';

export const StoreMonthlyStatsSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: [true, 'tenantId is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    storeName: {
      type: String,
      required: [true, 'storeName is required'],
      trim: true,
    },
    month: {
      type: String, // Format: YYYY-MM
      required: [true, 'month string (YYYY-MM) is required'],
      trim: true,
      index: true,
    },
    sales: {
      type: Number,
      default: 0,
      min: 0,
    },
    invoices: {
      type: Number,
      default: 0,
      min: 0,
    },
    units: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'store_monthly_stats',
  }
);

// Ensure unique entry per tenant per month
StoreMonthlyStatsSchema.index({ tenantId: 1, month: 1 }, { unique: true });
StoreMonthlyStatsSchema.index({ month: -1 });

/**
 * Returns StoreMonthlyStats model bound to platform connection.
 * @param {import('mongoose').Connection} connection
 */
export function getStoreMonthlyStatsModel(connection) {
  if (connection.models.StoreMonthlyStats) {
    return connection.models.StoreMonthlyStats;
  }
  return connection.model('StoreMonthlyStats', StoreMonthlyStatsSchema);
}

/**
 * Helper to obtain StoreMonthlyStats bound directly to the platform database.
 */
export async function getPlatformStoreMonthlyStatsModel() {
  const conn = await getPlatformConnection();
  return getStoreMonthlyStatsModel(conn);
}
