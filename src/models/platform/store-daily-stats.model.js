import { Schema } from 'mongoose';
import { getPlatformConnection } from '../../db/mongodb.js';

export const StoreDailyStatsSchema = new Schema(
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
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'date string (YYYY-MM-DD) is required'],
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
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'store_daily_stats',
  }
);

// Ensure unique entry per tenant per day
StoreDailyStatsSchema.index({ tenantId: 1, date: 1 }, { unique: true });
StoreDailyStatsSchema.index({ date: -1 });

/**
 * Returns StoreDailyStats model bound to platform connection.
 * @param {import('mongoose').Connection} connection
 */
export function getStoreDailyStatsModel(connection) {
  if (connection.models.StoreDailyStats) {
    return connection.models.StoreDailyStats;
  }
  return connection.model('StoreDailyStats', StoreDailyStatsSchema);
}

/**
 * Helper to obtain StoreDailyStats bound directly to the platform database.
 */
export async function getPlatformStoreDailyStatsModel() {
  const conn = await getPlatformConnection();
  return getStoreDailyStatsModel(conn);
}
