import { getPlatformAuditLogModel } from '../models/platform/audit-log.model.js';

export class AuditService {
  /**
   * Records an audit event in the platform database.
   *
   * @param {string} action - e.g. 'TENANT_CREATED', 'TENANT_STATUS_UPDATED', 'SUPERADMIN_IMPERSONATION'
   * @param {{ userId: string, email: string, role: string }} performedBy
   * @param {string|null} [targetTenantId=null]
   * @param {object} [details={}]
   */
  static async logAction(action, performedBy, targetTenantId = null, details = {}) {
    try {
      const AuditLogModel = await getPlatformAuditLogModel();
      const log = await AuditLogModel.create({
        action,
        performedBy: {
          userId: performedBy?.userId || 'system',
          email: performedBy?.email || 'system',
          role: performedBy?.role || 'SYSTEM',
        },
        targetTenantId: targetTenantId ? targetTenantId.trim().toLowerCase() : undefined,
        details,
      });
      return log.toObject();
    } catch (error) {
      // Non-blocking error logging
      console.error('[AuditService Error] Failed to write audit log:', error?.message);
      return null;
    }
  }

  /**
   * Retrieves recent platform audit logs.
   * @param {number} [limit=25]
   */
  static async getRecentLogs(limit = 25) {
    const AuditLogModel = await getPlatformAuditLogModel();
    return AuditLogModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}
