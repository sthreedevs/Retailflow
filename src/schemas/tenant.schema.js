import { z } from 'zod';
import { TENANT_STATUSES } from '../lib/constants.js';

export const tenantStatusSchema = z.enum(TENANT_STATUSES);

export const tenantIdSchema = z
  .string()
  .min(3, 'tenantId must be at least 3 characters')
  .max(50, 'tenantId must not exceed 50 characters')
  .regex(/^[a-z0-9_-]+$/, 'tenantId can only contain lowercase letters, numbers, hyphens, and underscores');

export const createTenantSchema = z.object({
  tenantId: tenantIdSchema.optional(),
  storeName: z.string().min(2, 'storeName must be at least 2 characters').max(100),
  ownerName: z.string().min(2, 'ownerName must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters').max(20),
  status: tenantStatusSchema.optional().default('ACTIVE'),
});

export const updateTenantStatusSchema = z.object({
  status: tenantStatusSchema,
});
