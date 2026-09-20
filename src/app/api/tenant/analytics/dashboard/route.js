import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { getStoreDashboardMetrics } from '@/services/analytics.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const { searchParams } = new URL(request.url);

    const rangeParam = searchParams.get('range');
    const range = rangeParam === '30d' ? '30d' : '7d';

    const metrics = await getStoreDashboardMetrics(tenantContext.connection, { range });

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to aggregate store analytics.' },
      { status: 500 }
    );
  }
}
