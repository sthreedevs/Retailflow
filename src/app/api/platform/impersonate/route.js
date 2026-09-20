import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/server/auth.js';
import { TenantService } from '@/services/tenant.service.js';
import { AuditService } from '@/services/audit.service.js';
import { createSessionToken, getSessionCookieOptions } from '@/lib/session.js';
import { AppError } from '@/lib/errors.js';
import { USER_ROLES } from '@/lib/constants.js';

export async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'tenantId is required to impersonate.' },
        { status: 400 }
      );
    }

    const tenant = await TenantService.getTenantById(tenantId);
    if (!tenant) {
      return NextResponse.json(
        { success: false, message: `Tenant "${tenantId}" not found.` },
        { status: 404 }
      );
    }

    // Create impersonation session with impersonatedBy metadata
    const impersonationPayload = {
      userId: admin.userId,
      email: admin.email,
      name: admin.name || 'Superadmin',
      role: USER_ROLES.STORE_OWNER,
      tenantId: tenant.tenantId,
      storeName: tenant.storeName,
      impersonatedBy: {
        userId: admin.userId,
        email: admin.email,
      },
    };

    const impersonationToken = await createSessionToken(impersonationPayload);

    // Record audit event
    await AuditService.logAction(
      'SUPERADMIN_IMPERSONATION_STARTED',
      admin,
      tenant.tenantId,
      { storeName: tenant.storeName }
    );

    const response = NextResponse.json({
      success: true,
      storeName: tenant.storeName,
      redirectUrl: '/tenant/dashboard',
    });

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set({
      ...cookieOpts,
      value: impersonationToken,
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Impersonation failed.' },
      { status: 500 }
    );
  }
}
