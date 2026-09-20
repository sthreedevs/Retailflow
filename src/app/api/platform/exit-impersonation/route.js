import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth.js';
import { AuditService } from '@/services/audit.service.js';
import { createSessionToken, getSessionCookieOptions } from '@/lib/session.js';
import { USER_ROLES } from '@/lib/constants.js';

export async function POST(request) {
  try {
    const session = await requireAuth(request);

    if (!session.impersonatedBy) {
      return NextResponse.json(
        { success: false, message: 'Current session is not an impersonation session.' },
        { status: 400 }
      );
    }

    const admin = session.impersonatedBy;

    // Log exit audit event
    await AuditService.logAction(
      'SUPERADMIN_IMPERSONATION_ENDED',
      admin,
      session.tenantId,
      { storeName: session.storeName }
    );

    // Restore clean Superadmin session
    const superAdminPayload = {
      userId: admin.userId,
      email: admin.email,
      name: 'Superadmin',
      role: USER_ROLES.SUPER_ADMIN,
    };

    const adminToken = await createSessionToken(superAdminPayload);

    const response = NextResponse.json({
      success: true,
      redirectUrl: '/superadmin/tenants',
    });

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set({
      ...cookieOpts,
      value: adminToken,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to exit impersonation.' },
      { status: 500 }
    );
  }
}
