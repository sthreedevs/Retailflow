import { getPlatformConnection } from './mongodb.js';
import { DatabaseConnectionError, ValidationError } from '../lib/errors.js';

if (!global.__tenantConnectionsCache) {
  global.__tenantConnectionsCache = new Map();
}

const tenantCache = global.__tenantConnectionsCache;

/**
 * Derives standard tenant database name from a tenant ID.
 * Format: tenant_<tenantId>
 * @param {string} tenantId
 * @returns {string}
 */
export function getTenantDatabaseName(tenantId) {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new ValidationError('A valid tenantId string is required to resolve tenant database name.');
  }
  const cleanId = tenantId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!cleanId) {
    throw new ValidationError(`Invalid tenantId provided: "${tenantId}".`);
  }
  return `tenant_${cleanId}`;
}

export class TenantConnectionManager {
  /**
   * Retrieves or creates a cached Mongoose Connection for a specific tenant database.
   * Leverages the shared MongoDB cluster connection and selects the tenant database dynamically.
   *
   * @param {string} databaseName - Target tenant database name (e.g., "tenant_store123")
   * @returns {Promise<import('mongoose').Connection>}
   */
  static async getTenantConnection(databaseName) {
    if (!databaseName || typeof databaseName !== 'string') {
      throw new ValidationError('A valid databaseName is required.');
    }

    const trimmedDbName = databaseName.trim().toLowerCase();

    // Prevent tenants from accessing the platform database or admin databases directly
    if (trimmedDbName === 'platform' || trimmedDbName === 'admin' || trimmedDbName === 'local' || trimmedDbName === 'config') {
      throw new ValidationError(`Database name "${trimmedDbName}" is reserved and cannot be accessed as a tenant database.`);
    }

    // Check cache
    const existingConn = tenantCache.get(trimmedDbName);
    if (existingConn && existingConn.readyState === 1) {
      return existingConn;
    }

    try {
      // Obtain the shared cluster platform connection
      const platformConn = await getPlatformConnection();

      // Dynamic database selection with Mongoose useDb (uses internal connection pool)
      const tenantConn = platformConn.useDb(trimmedDbName, { useCache: true });

      tenantCache.set(trimmedDbName, tenantConn);

      return tenantConn;
    } catch (error) {
      tenantCache.delete(trimmedDbName);
      throw new DatabaseConnectionError(
        trimmedDbName,
        error?.message || String(error)
      );
    }
  }

  /**
   * Convenience method to retrieve a tenant connection directly from a tenantId.
   * @param {string} tenantId
   * @returns {Promise<import('mongoose').Connection>}
   */
  static async getTenantConnectionByTenantId(tenantId) {
    const dbName = getTenantDatabaseName(tenantId);
    return this.getTenantConnection(dbName);
  }

  /**
   * Returns a list of all currently cached tenant database names.
   * @returns {string[]}
   */
  static getCachedDatabases() {
    return Array.from(tenantCache.keys());
  }

  /**
   * Checks if a tenant database connection is currently cached.
   * @param {string} databaseName
   * @returns {boolean}
   */
  static hasConnection(databaseName) {
    const conn = tenantCache.get(databaseName.trim().toLowerCase());
    return Boolean(conn && conn.readyState === 1);
  }

  /**
   * Evicts a specific tenant connection from the cache without closing the shared cluster client.
   * @param {string} databaseName
   */
  static async evictTenantConnection(databaseName) {
    const trimmed = databaseName.trim().toLowerCase();
    tenantCache.delete(trimmed);
  }

  /**
   * Alias for backward compatibility
   */
  static async closeTenantConnection(databaseName) {
    return this.evictTenantConnection(databaseName);
  }

  /**
   * Resets all cached tenant connections.
   */
  static async resetCache() {
    tenantCache.clear();
  }

  /**
   * Closes all tenant connections and resets the cache.
   * Useful for testing, maintenance, or process termination.
   */
  static async closeAllConnections() {
    tenantCache.clear();
  }
}
