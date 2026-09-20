/**
 * Tenant Lifecycle Statuses
 */
export const TENANT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING',
  ARCHIVED: 'ARCHIVED',
});

export const TENANT_STATUSES = Object.values(TENANT_STATUS);

/**
 * User Roles: Platform level and Tenant level
 */
export const USER_ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  STORE_OWNER: 'STORE_OWNER',
  STORE_ADMIN: 'STORE_ADMIN',
  STAFF: 'STAFF',
  CASHIER: 'CASHIER',
});

export const PLATFORM_ROLES = [USER_ROLES.SUPER_ADMIN];

export const TENANT_ROLES = [
  USER_ROLES.STORE_OWNER,
  USER_ROLES.STORE_ADMIN,
  USER_ROLES.STAFF,
  USER_ROLES.CASHIER,
];

export const ALL_ROLES = Object.values(USER_ROLES);
