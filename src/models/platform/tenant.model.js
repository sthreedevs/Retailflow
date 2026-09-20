import { Schema } from 'mongoose';
import { TENANT_STATUSES, TENANT_STATUS } from '../../lib/constants.js';
import { getPlatformConnection } from '../../db/mongodb.js';

export const TenantSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: [true, 'tenantId is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    storeName: {
      type: String,
      required: [true, 'storeName is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'ownerName is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'phone is required'],
      trim: true,
    },
    databaseName: {
      type: String,
      required: [true, 'databaseName is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: TENANT_STATUSES,
      default: TENANT_STATUS.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'tenants',
  }
);

// Indexes for query performance
TenantSchema.index({ status: 1, createdAt: -1 });

/**
 * Returns the Tenant model bound to the specified connection.
 * Avoids OverwriteModelError and ensures models are bound to the correct connection.
 * @param {import('mongoose').Connection} connection
 */
export function getTenantModel(connection) {
  if (connection.models.Tenant) {
    return connection.models.Tenant;
  }
  return connection.model('Tenant', TenantSchema);
}

/**
 * Helper to obtain the Tenant model bound directly to the platform database.
 * @returns {Promise<import('mongoose').Model<any>>}
 */
export async function getPlatformTenantModel() {
  const conn = await getPlatformConnection();
  return getTenantModel(conn);
}
