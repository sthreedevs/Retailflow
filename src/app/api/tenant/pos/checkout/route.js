import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { completeSale, getSaleDetail } from '@/services/billing.service.js';
import { recordPlatformSaleEvent } from '@/services/platform-stats.service.js';
import { CreateSaleSchema } from '@/schemas/pos.schema.js';
import { handleApiError } from '@/lib/errors.js';
import { logger } from '@/lib/logger.js';

export async function POST(request) {
  try {
    const { user, tenantContext } = await requireTenant(request);
    const body = await request.json();

    const validation = CreateSaleSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const createdSale = await completeSale(tenantContext.connection, validation.data, user);
    const saleDetail = await getSaleDetail(tenantContext.connection, createdSale._id, {
      tenantId: tenantContext.tenantId,
    });

    // Atomically update platform summary records in background
    const totalUnits = createdSale.items?.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0) || 1;
    recordPlatformSaleEvent({
      tenantId: tenantContext.tenantId,
      storeName: tenantContext.storeName,
      saleDate: createdSale.createdAt || new Date(),
      grandTotal: createdSale.grandTotal,
      unitsCount: totalUnits,
    }).catch((err) => {
      logger.error('Failed to record platform sale event:', err, { tenantId: tenantContext.tenantId });
    });

    return NextResponse.json({
      success: true,
      sale: saleDetail.sale,
      store: saleDetail.store,
      delivery: saleDetail.delivery,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to complete sale transaction.');
  }
}
