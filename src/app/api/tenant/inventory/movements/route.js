import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { getStockMovements } from '@/services/inventory.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get('productId') || '';
    const movementType = searchParams.get('movementType') || searchParams.get('type') || 'ALL';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));

    const result = await getStockMovements(tenantContext.connection, {
      productId,
      movementType,
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
      { success: false, message: error?.message || 'Failed to fetch stock movements.' },
      { status: 500 }
    );
  }
}
