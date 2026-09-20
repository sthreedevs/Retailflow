import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { adjustStock, setOpeningStock } from '@/services/inventory.service.js';
import { AuditService } from '@/services/audit.service.js';
import { StockAdjustmentSchema, OpeningStockSchema } from '@/schemas/inventory.schema.js';
import { USER_ROLES } from '@/lib/constants.js';
import { ForbiddenError, handleApiError } from '@/lib/errors.js';

export async function POST(request) {
  try {
    const { user, tenantContext } = await requireTenant(request);

    // Enforce role authorization: Cashiers cannot adjust stock
    if (user.role === USER_ROLES.CASHIER) {
      throw new ForbiddenError('Cashiers are not authorized to perform manual inventory adjustments.');
    }

    const body = await request.json();
    const mode = body.mode || 'ADJUSTMENT';

    if (mode === 'OPENING') {
      const validation = OpeningStockSchema.safeParse(body);
      if (!validation.success) {
        const errorMsg = validation.error.issues.map((e) => e.message).join(', ');
        return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
      }

      const result = await setOpeningStock(tenantContext.connection, {
        productId: validation.data.productId,
        openingStock: validation.data.openingStock,
        reason: validation.data.reason,
        user,
      });

      AuditService.logAction(
        'INVENTORY_OPENING_STOCK_SET',
        user,
        tenantContext.tenantId,
        { productId: validation.data.productId, openingStock: validation.data.openingStock }
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    const validation = StockAdjustmentSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const result = await adjustStock(tenantContext.connection, {
      productId: validation.data.productId,
      newStock: validation.data.newStock,
      reason: validation.data.reason,
      user,
    });

    AuditService.logAction(
      'INVENTORY_STOCK_ADJUSTED',
      user,
      tenantContext.tenantId,
      { productId: validation.data.productId, newStock: validation.data.newStock, reason: validation.data.reason }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to adjust stock.');
  }
}
