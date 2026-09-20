import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { getInventoryOverview } from '@/services/inventory.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const overview = await getInventoryOverview(tenantContext.connection);

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch inventory overview.' },
      { status: 500 }
    );
  }
}
