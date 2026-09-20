import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/server/auth.js';
import { getPlatformAggregatedAnalytics } from '@/services/platform-stats.service.js';
import { AuditService } from '@/services/audit.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const admin = await requireSuperAdmin(request);
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range');
    const range = rangeParam === '7d' ? '7d' : '30d';

    // Query aggregated platform statistics without querying individual tenant databases
    const [analytics, recentLogs] = await Promise.all([
      getPlatformAggregatedAnalytics({ range }),
      AuditService.getRecentLogs(15),
    ]);

    // Record audit entry for viewing platform analytics
    AuditService.logAction(
      'VIEW_PLATFORM_ANALYTICS',
      admin,
      null,
      { range }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      data: analytics,
      recentActivity: recentLogs,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to load platform dashboard analytics.' },
      { status: 500 }
    );
  }
}
