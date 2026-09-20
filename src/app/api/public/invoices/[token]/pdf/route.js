import { NextResponse } from 'next/server';
import { verifyInvoiceAccessToken } from '@/services/invoice-token.service.js';
import { TenantService } from '@/services/tenant.service.js';
import { getSaleDetail } from '@/services/billing.service.js';
import { generateInvoicePDFBuffer } from '@/services/invoice-pdf.service.js';
import { assertRateLimit, getClientIp } from '@/lib/rate-limiter.js';
import { handleApiError } from '@/lib/errors.js';

export async function GET(request, { params }) {
  try {
    const clientIp = getClientIp(request);
    assertRateLimit(`public_invoice_pdf:${clientIp}`, {
      limit: 60,
      windowMs: 60000,
      message: 'Too many invoice PDF requests. Please slow down and try again shortly.',
    });

    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const formatParam = searchParams.get('format');

    const payload = await verifyInvoiceAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired invoice token.' },
        { status: 403 }
      );
    }

    const { tenantId, saleId } = payload;

    // Securely resolve tenant and verify the store is currently ACTIVE
    const tenantContext = await TenantService.resolveTenantContext(tenantId);

    const detail = await getSaleDetail(tenantContext.connection, saleId, {
      tenantId: tenantContext.tenantId,
    });

    const layout = formatParam && ['A4', '80mm', '58mm'].includes(formatParam)
      ? formatParam
      : detail.store?.receiptWidth || 'A4';

    const pdfBuffer = await generateInvoicePDFBuffer(detail.sale, detail.store, layout);
    const filename = `Invoice-${detail.sale.invoiceNumber || 'receipt'}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to download invoice PDF.');
  }
}
