import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { getSaleDetail } from '@/services/billing.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request, { params }) {
  try {
    const { tenantContext } = await requireTenant(request);
    const { id } = await params;

    const data = await getSaleDetail(tenantContext.connection, id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch bill details.' },
      { status: 404 }
    );
  }
}
