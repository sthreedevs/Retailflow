import { Schema } from 'mongoose';
import { getPlatformConnection } from '../../db/mongodb.js';

export const AuditLogSchema = new Schema(
  {
    action: {
      type: String,
      required: [true, 'action is required'],
      index: true,
    },
    performedBy: {
      userId: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
    },
    targetTenantId: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ targetTenantId: 1, createdAt: -1 });

/**
 * Returns the AuditLog model bound to the platform connection.
 * @param {import('mongoose').Connection} connection
 */
export function getAuditLogModel(connection) {
  if (connection.models.AuditLog) {
    return connection.models.AuditLog;
  }
  return connection.model('AuditLog', AuditLogSchema);
}

/**
 * Helper to obtain the AuditLog model bound directly to the platform database.
 */
export async function getPlatformAuditLogModel() {
  const conn = await getPlatformConnection();
  return getAuditLogModel(conn);
}
