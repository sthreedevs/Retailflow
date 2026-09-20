import bcrypt from 'bcryptjs';
import { getPlatformUserModel } from '../models/platform/user.model.js';
import { TenantService } from './tenant.service.js';
import { createUserSchema } from '../schemas/auth.schema.js';
import {
  UnauthorizedError,
  TenantNotFoundError,
  TenantSuspendedError,
  ValidationError,
} from '../lib/errors.js';
import { USER_ROLES, TENANT_STATUS } from '../lib/constants.js';

export class AuthService {
  /**
   * Authenticates a user with email and password.
   * Enforces tenant verification and status checks for tenant users.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{
   *   userId: string,
   *   email: string,
   *   name: string,
   *   role: string,
   *   tenantId?: string,
   *   tenantName?: string
   * }>}
   */
  static async authenticateUser(email, password) {
    if (!email || !password) {
      throw new UnauthorizedError('Email and password are required.');
    }

    const UserModel = await getPlatformUserModel();
    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Your account is inactive or suspended.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // If tenant user, verify the tenant store exists and is ACTIVE
    let tenantName = null;
    if (user.role !== USER_ROLES.SUPER_ADMIN) {
      if (!user.tenantId) {
        throw new UnauthorizedError('User account is missing tenant association.');
      }

      const tenant = await TenantService.getTenantById(user.tenantId);
      if (!tenant) {
        throw new TenantNotFoundError(user.tenantId);
      }

      if (tenant.status !== TENANT_STATUS.ACTIVE) {
        throw new TenantSuspendedError(user.tenantId);
      }

      tenantName = tenant.storeName;
    }

    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId || undefined,
      tenantName: tenantName || undefined,
    };
  }

  /**
   * Registers a new platform user or tenant user
   * @param {object} input
   */
  static async registerUser(input) {
    const validated = createUserSchema.parse(input);

    const UserModel = await getPlatformUserModel();

    // Check email uniqueness
    const existing = await UserModel.findOne({ email: validated.email });
    if (existing) {
      throw new ValidationError(`User with email "${validated.email}" already exists.`);
    }

    // Verify tenant exists if tenant user
    if (validated.role !== USER_ROLES.SUPER_ADMIN) {
      const tenant = await TenantService.getTenantById(validated.tenantId);
      if (!tenant) {
        throw new TenantNotFoundError(validated.tenantId);
      }
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);
    const userId = validated.userId || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const user = await UserModel.create({
      userId,
      email: validated.email,
      passwordHash,
      name: validated.name,
      role: validated.role,
      tenantId: validated.role === USER_ROLES.SUPER_ADMIN ? undefined : validated.tenantId,
      status: validated.status || 'ACTIVE',
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;
    return userObj;
  }

  /**
   * Finds user by userId
   * @param {string} userId
   */
  static async getUserById(userId) {
    if (!userId) return null;
    const UserModel = await getPlatformUserModel();
    return UserModel.findOne({ userId }).select('-passwordHash').lean();
  }
}
