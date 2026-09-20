import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { getProductStockDetail, updateThresholds } from '@/services/inventory.service.js';
import { UpdateThresholdsSchema } from '@/schemas/inventory.schema.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request, { params }) {
  try {
    const { tenantContext } = await requireTenant(request);
    const { productId } = await params;

    const detail = await getProductStockDetail(tenantContext.connection, productId);

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch product stock detail.' },
      { status: 404 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { tenantContext } = await requireTenant(request);
    const { productId } = await params;
    const body = await request.json();

    const validation = UpdateThresholdsSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const updated = await updateThresholds(tenantContext.connection, {
      productId,
      minimumStock: validation.data.minimumStock,
      reorderLevel: validation.data.reorderLevel,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update stock thresholds.' },
      { status: 400 }
    );
  }
}
