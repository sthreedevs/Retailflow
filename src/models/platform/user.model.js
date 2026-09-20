import { Schema } from 'mongoose';
import { ALL_ROLES, USER_ROLES } from '../../lib/constants.js';
import { getPlatformConnection } from '../../db/mongodb.js';

export const UserSchema = new Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'passwordHash is required'],
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'role is required'],
      enum: ALL_ROLES,
      index: true,
    },
    tenantId: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      required: function () {
        return this.role !== USER_ROLES.SUPER_ADMIN;
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

UserSchema.index({ tenantId: 1, role: 1 });

/**
 * Returns the User model bound to the platform connection.
 * @param {import('mongoose').Connection} connection
 */
export function getUserModel(connection) {
  if (connection.models.User) {
    return connection.models.User;
  }
  return connection.model('User', UserSchema);
}

/**
 * Helper to obtain the User model bound directly to the platform database.
 * @returns {Promise<import('mongoose').Model<any>>}
 */
export async function getPlatformUserModel() {
  const conn = await getPlatformConnection();
  return getUserModel(conn);
}
