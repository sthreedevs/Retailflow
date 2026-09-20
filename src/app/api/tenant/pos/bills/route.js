import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { listSales } from '@/services/billing.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const paymentMethod = searchParams.get('paymentMethod') || 'ALL';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));

    const result = await listSales(tenantContext.connection, {
      search,
      paymentMethod,
      startDate,
      endDate,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch bills.' },
      { status: 500 }
    );
  }
}
