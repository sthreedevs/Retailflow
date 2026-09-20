import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { recordDamage } from '@/services/inventory.service.js';
import { AuditService } from '@/services/audit.service.js';
import { StockDamageSchema } from '@/schemas/inventory.schema.js';
import { USER_ROLES } from '@/lib/constants.js';
import { ForbiddenError, handleApiError } from '@/lib/errors.js';

export async function POST(request) {
  try {
    const { user, tenantContext } = await requireTenant(request);

    // Enforce role authorization: Cashiers cannot record damaged stock
    if (user.role === USER_ROLES.CASHIER) {
      throw new ForbiddenError('Cashiers are not authorized to declare damaged stock.');
    }

    const body = await request.json();

    const validation = StockDamageSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const result = await recordDamage(tenantContext.connection, {
      productId: validation.data.productId,
      quantity: validation.data.quantity,
      reason: validation.data.reason,
      user,
    });

    AuditService.logAction(
      'INVENTORY_DAMAGE_RECORDED',
      user,
      tenantContext.tenantId,
      { productId: validation.data.productId, quantity: validation.data.quantity, reason: validation.data.reason }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to record damaged stock.');
  }
}
