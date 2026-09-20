import { z } from 'zod';
import { ALL_ROLES, USER_ROLES } from '../lib/constants.js';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z
  .object({
    userId: z.string().min(3).optional(),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    role: z.enum(ALL_ROLES),
    tenantId: z.string().min(3).trim().toLowerCase().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional().default('ACTIVE'),
  })
  .refine(
    (data) => {
      // If user is not SUPER_ADMIN, tenantId is strictly required
      if (data.role !== USER_ROLES.SUPER_ADMIN) {
        return Boolean(data.tenantId && data.tenantId.trim().length > 0);
      }
      return true;
    },
    {
      message: 'tenantId is required for tenant users (non-SUPER_ADMIN)',
      path: ['tenantId'],
    }
  );
