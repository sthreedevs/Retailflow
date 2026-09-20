import { NextResponse } from 'next/server';
import { verifyInvoiceAccessToken } from '@/services/invoice-token.service.js';
import { TenantService } from '@/services/tenant.service.js';
import { getSaleDetail } from '@/services/billing.service.js';
import { assertRateLimit, getClientIp } from '@/lib/rate-limiter.js';
import { handleApiError } from '@/lib/errors.js';

export async function GET(request, { params }) {
  try {
    const clientIp = getClientIp(request);
    assertRateLimit(`public_invoice:${clientIp}`, {
      limit: 60,
      windowMs: 60000,
      message: 'Too many invoice requests. Please slow down and try again shortly.',
    });

    const { token } = await params;

    const payload = await verifyInvoiceAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'This invoice link is invalid, expired, or has been tampered with.' },
        { status: 403 }
      );
    }

    const { tenantId, saleId } = payload;

    // Securely resolve tenant and verify the store is currently ACTIVE
    const tenantContext = await TenantService.resolveTenantContext(tenantId);

    const detail = await getSaleDetail(tenantContext.connection, saleId, {
      tenantId: tenantContext.tenantId,
    });

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to retrieve invoice.');
  }
}
