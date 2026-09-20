import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    // Resolved purely from server-side verified session
    const { user, tenantContext } = await requireTenant(request);

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      tenant: {
        tenantId: tenantContext.tenantId,
        storeName: tenantContext.storeName,
        databaseName: tenantContext.databaseName,
        status: tenantContext.status,
        dbConnected: tenantContext.connection.readyState === 1,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}
