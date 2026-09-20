import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/server/auth.js';
import { syncAllTenantsSalesToPlatform, syncTenantSalesToPlatform } from '@/services/platform-stats.service.js';
import { AuditService } from '@/services/audit.service.js';
import { AppError } from '@/lib/errors.js';

export async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is allowed for full platform sync
    }

    const { tenantId } = body;
    let syncResult;

    if (tenantId) {
      syncResult = await syncTenantSalesToPlatform(tenantId);
      await AuditService.logAction(
        'SYNC_TENANT_STATS',
        admin,
        tenantId,
        { details: syncResult }
      );
    } else {
      syncResult = await syncAllTenantsSalesToPlatform();
      await AuditService.logAction(
        'SYNC_PLATFORM_STATS',
        admin,
        null,
        { syncedCount: syncResult.syncedCount, totalTenants: syncResult.totalTenants }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Platform statistics summary synchronized successfully.',
      result: syncResult,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to sync platform statistics.' },
      { status: 500 }
    );
  }
}
