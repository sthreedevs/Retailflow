import { getSessionFromRequest } from '../lib/session.js';
import { TenantService } from '../services/tenant.service.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';
import { USER_ROLES } from '../lib/constants.js';

/**
 * Validates that the request has an active authenticated session.
 *
 * @param {Request} request
 * @returns {Promise<{
 *   userId: string,
 *   email: string,
 *   role: string,
 *   tenantId?: string,
 *   name: string
 * }>}
 */
export async function requireAuth(request) {
  const session = await getSessionFromRequest(request);

  if (!session || !session.userId) {
    throw new UnauthorizedError('Authentication required.');
  }

  return session;
}

/**
 * Validates that the authenticated user possesses one of the allowed roles.
 *
 * @param {string[]|string} allowedRoles
 * @param {Request} request
 */
export async function requireRole(allowedRoles, request) {
  const session = await requireAuth(request);
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.role)) {
    throw new ForbiddenError(
      `Access denied. Role "${session.role}" is not authorized for this resource.`
    );
  }

  return session;
}

/**
 * Validates that the authenticated user is a SUPER_ADMIN.
 *
 * @param {Request} request
 */
export async function requireSuperAdmin(request) {
  return requireRole([USER_ROLES.SUPER_ADMIN], request);
}

/**
 * Resolves the authenticated user's isolated TenantContext.
 *
 * CRITICAL TENANT ISOLATION RULE:
 * Tenant identity is resolved EXCLUSIVELY from the verified server-side session.
 * Client-supplied tenantId parameters from query strings, headers, or body are NEVER trusted.
 *
 * @param {Request} request
 * @returns {Promise<{
 *   user: object,
 *   tenantContext: {
 *     tenantId: string,
 *     storeName: string,
 *     databaseName: string,
 *     status: string,
 *     connection: import('mongoose').Connection
 *   }
 * }>}
 */
export async function requireTenant(request) {
  const user = await requireAuth(request);

  // Superadmin is a platform role and does not have a default tenant binding
  if (user.role === USER_ROLES.SUPER_ADMIN) {
    throw new ForbiddenError('Superadmin must access tenant resources via platform tenant proxy.');
  }

  if (!user.tenantId) {
    throw new ForbiddenError('Authenticated user is not assigned to any store/tenant.');
  }

  // Server-side tenant resolution:
  // authenticated user -> user.tenantId -> platform Tenant -> databaseName -> tenant connection
  const tenantContext = await TenantService.resolveTenantContext(user.tenantId);

  return {
    user,
    tenantContext,
  };
}
