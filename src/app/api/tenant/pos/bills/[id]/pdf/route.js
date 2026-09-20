import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { getSaleDetail } from '@/services/billing.service.js';
import { generateInvoicePDFBuffer } from '@/services/invoice-pdf.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request, { params }) {
  try {
    const { tenantContext, user } = await requireTenant(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const formatParam = searchParams.get('format');

    const detail = await getSaleDetail(tenantContext.connection, id, {
      tenantId: user.tenantId,
    });

    const layout = formatParam && ['A4', '80mm', '58mm'].includes(formatParam)
      ? formatParam
      : detail.store?.receiptWidth || 'A4';

    const pdfBuffer = await generateInvoicePDFBuffer(detail.sale, detail.store, layout);

    const filename = `Invoice-${detail.sale.invoiceNumber || 'bill'}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to generate invoice PDF.' },
      { status: 500 }
    );
  }
}
