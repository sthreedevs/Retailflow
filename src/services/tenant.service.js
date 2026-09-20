import { getPlatformTenantModel } from '../models/platform/tenant.model.js';
import { TenantConnectionManager, getTenantDatabaseName } from '../db/tenant-manager.js';
import { createTenantSchema } from '../schemas/tenant.schema.js';
import {
  TenantNotFoundError,
  TenantSuspendedError,
  ValidationError,
} from '../lib/errors.js';
import { TENANT_STATUS } from '../lib/constants.js';
import { escapeRegex } from '../lib/string.js';

/**
 * Service handling Tenant lifecycle, registration, and context resolution
 */
export class TenantService {
  /**
   * Retrieves a tenant record by tenantId from the platform database
   * @param {string} tenantId
   */
  static async getTenantById(tenantId) {
    if (!tenantId) return null;
    const TenantModel = await getPlatformTenantModel();
    return TenantModel.findOne({ tenantId: tenantId.trim().toLowerCase() }).lean();
  }

  /**
   * Resolves the full TenantContext for an active tenant.
   * Connects to/reuses the tenant's isolated MongoDB database.
   *
   * @param {string} tenantId
   * @returns {Promise<{
   *   tenantId: string,
   *   storeName: string,
   *   databaseName: string,
   *   status: string,
   *   connection: import('mongoose').Connection
   * }>}
   */
  static async resolveTenantContext(tenantId) {
    if (!tenantId) {
      throw new ValidationError('tenantId is required to resolve tenant context.');
    }

    const tenant = await this.getTenantById(tenantId);

    if (!tenant) {
      throw new TenantNotFoundError(tenantId);
    }

    if (tenant.status !== TENANT_STATUS.ACTIVE) {
      throw new TenantSuspendedError(tenantId);
    }

    // Get or reuse the dedicated tenant database connection
    const connection = await TenantConnectionManager.getTenantConnection(tenant.databaseName);

    return {
      tenantId: tenant.tenantId,
      storeName: tenant.storeName,
      databaseName: tenant.databaseName,
      status: tenant.status,
      connection,
    };
  }

  /**
   * Registers a new tenant in the platform database.
   * @param {object} input
   */
  static async registerTenant(input) {
    const validated = createTenantSchema.parse(input);

    // Generate tenantId from storeName slug if not explicitly supplied
    let tenantId = validated.tenantId;
    if (!tenantId) {
      const slug = validated.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      tenantId = `${slug}-${randomSuffix}`;
    } else {
      tenantId = tenantId.toLowerCase().trim();
    }

    const databaseName = getTenantDatabaseName(tenantId);

    const TenantModel = await getPlatformTenantModel();

    // Check for uniqueness
    const existing = await TenantModel.findOne({
      $or: [{ tenantId }, { databaseName }, { email: validated.email.toLowerCase() }],
    });

    if (existing) {
      if (existing.tenantId === tenantId) {
        throw new ValidationError(`Tenant with ID "${tenantId}" already exists.`);
      }
      if (existing.databaseName === databaseName) {
        throw new ValidationError(`Database "${databaseName}" is already registered.`);
      }
      if (existing.email === validated.email.toLowerCase()) {
        throw new ValidationError(`Email "${validated.email}" is already registered.`);
      }
    }

    const tenant = await TenantModel.create({
      tenantId,
      storeName: validated.storeName.trim(),
      ownerName: validated.ownerName.trim(),
      email: validated.email.toLowerCase().trim(),
      phone: validated.phone.trim(),
      databaseName,
      status: validated.status || TENANT_STATUS.ACTIVE,
    });

    return tenant.toObject();
  }

  /**
   * Updates a tenant's status (ACTIVE, SUSPENDED, ARCHIVED)
   * @param {string} tenantId
   * @param {string} status
   */
  static async updateStatus(tenantId, status) {
    const TenantModel = await getPlatformTenantModel();
    const tenant = await TenantModel.findOneAndUpdate(
      { tenantId: tenantId.trim().toLowerCase() },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    if (!tenant) {
      throw new TenantNotFoundError(tenantId);
    }

    // If tenant suspended, remove their connection from cache
    if (status !== TENANT_STATUS.ACTIVE) {
      await TenantConnectionManager.closeTenantConnection(tenant.databaseName);
    }

    return tenant.toObject();
  }

  /**
   * Lists all tenants with search, status filtering, and sorting
   * @param {{ search?: string, status?: string }} [options={}]
   */
  static async listTenants(options = {}) {
    const { search, status } = options;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim().length > 0) {
      const term = escapeRegex(search.trim());
      const regex = new RegExp(term, 'i');
      query.$or = [
        { storeName: regex },
        { ownerName: regex },
        { email: regex },
        { tenantId: regex },
      ];
    }

    const TenantModel = await getPlatformTenantModel();
    return TenantModel.find(query).sort({ createdAt: -1 }).lean();
  }

  /**
   * Aggregates platform-level statistics for Superadmin dashboard
   */
  static async getPlatformDashboardMetrics() {
    const TenantModel = await getPlatformTenantModel();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      pendingTenants,
      newThisMonth,
      newThisWeek,
    ] = await Promise.all([
      TenantModel.countDocuments(),
      TenantModel.countDocuments({ status: TENANT_STATUS.ACTIVE }),
      TenantModel.countDocuments({ status: TENANT_STATUS.SUSPENDED }),
      TenantModel.countDocuments({ status: TENANT_STATUS.PENDING }),
      TenantModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      TenantModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      pendingTenants,
      newTenantsThisMonth: newThisMonth,
      newTenantsThisWeek: newThisWeek,
    };
  }
}
