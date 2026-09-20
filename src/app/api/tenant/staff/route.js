import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireTenant } from '@/server/auth.js';
import { getPlatformUserModel } from '@/models/platform/user.model.js';
import { AuthService } from '@/services/auth.service.js';
import { AuditService } from '@/services/audit.service.js';
import { USER_ROLES } from '@/lib/constants.js';
import { ForbiddenError, ValidationError, handleApiError } from '@/lib/errors.js';

const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([USER_ROLES.STORE_ADMIN, USER_ROLES.CASHIER, USER_ROLES.STAFF], {
    errorMap: () => ({ message: 'Role must be STORE_ADMIN, CASHIER, or STAFF' }),
  }),
});

const updateStaffSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  role: z.enum([USER_ROLES.STORE_ADMIN, USER_ROLES.CASHIER, USER_ROLES.STAFF]).optional(),
});

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const UserModel = await getPlatformUserModel();

    const staffList = await UserModel.find({ tenantId: tenantContext.tenantId })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      staff: staffList,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch staff members.');
  }
}

export async function POST(request) {
  try {
    const { user, tenantContext } = await requireTenant(request);

    // Enforce role authorization: Only STORE_OWNER or STORE_ADMIN can add staff
    if (user.role !== USER_ROLES.STORE_OWNER && user.role !== USER_ROLES.STORE_ADMIN) {
      throw new ForbiddenError('Only Store Owner or Store Admin can add staff members.');
    }

    const body = await request.json();
    const validated = createStaffSchema.parse(body);

    const newStaff = await AuthService.registerUser({
      name: validated.name,
      email: validated.email,
      password: validated.password,
      role: validated.role,
      tenantId: tenantContext.tenantId,
      status: 'ACTIVE',
    });

    await AuditService.logAction(
      'STAFF_CREATED',
      user,
      tenantContext.tenantId,
      {
        createdUserId: newStaff.userId,
        staffEmail: newStaff.email,
        staffRole: newStaff.role,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Staff member added successfully.',
        staff: newStaff,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, 'Failed to create staff member.');
  }
}

export async function PATCH(request) {
  try {
    const { user, tenantContext } = await requireTenant(request);

    // Enforce role authorization: Only STORE_OWNER or STORE_ADMIN can modify staff
    if (user.role !== USER_ROLES.STORE_OWNER && user.role !== USER_ROLES.STORE_ADMIN) {
      throw new ForbiddenError('Only Store Owner or Store Admin can manage staff members.');
    }

    const body = await request.json();
    const validated = updateStaffSchema.parse(body);

    // Guard: Prevent self-status modification
    if (validated.userId === user.userId && validated.status === 'INACTIVE') {
      throw new ValidationError('You cannot deactivate your own user account.');
    }

    const UserModel = await getPlatformUserModel();
    const targetUser = await UserModel.findOne({
      userId: validated.userId,
      tenantId: tenantContext.tenantId,
    });

    if (!targetUser) {
      throw new ValidationError('Staff member not found in this store.');
    }

    // Guard: STORE_ADMIN cannot modify or demote STORE_OWNER
    if (targetUser.role === USER_ROLES.STORE_OWNER && user.role !== USER_ROLES.STORE_OWNER) {
      throw new ForbiddenError('Only the Store Owner can modify Store Owner accounts.');
    }

    const updates = {};
    if (validated.status) updates.status = validated.status;
    if (validated.role) updates.role = validated.role;

    const updatedUser = await UserModel.findOneAndUpdate(
      { userId: validated.userId, tenantId: tenantContext.tenantId },
      { $set: updates },
      { returnDocument: 'after' }
    )
      .select('-passwordHash')
      .lean();

    await AuditService.logAction(
      'STAFF_UPDATED',
      user,
      tenantContext.tenantId,
      {
        targetUserId: targetUser.userId,
        updates,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully.',
      staff: updatedUser,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to update staff member.');
  }
}
