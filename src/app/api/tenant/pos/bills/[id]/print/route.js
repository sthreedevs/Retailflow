import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { getSaleDetail } from '@/services/billing.service.js';
import { generateInvoiceHTML } from '@/services/invoice-html.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request, { params }) {
  try {
    const { tenantContext, user } = await requireTenant(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const formatParam = searchParams.get('format') || searchParams.get('layout');
    const autoprintParam = searchParams.get('autoprint');
    const autoprint = autoprintParam !== '0' && autoprintParam !== 'false';

    const detail = await getSaleDetail(tenantContext.connection, id, {
      tenantId: user.tenantId,
    });

    const layout = formatParam && ['A4', '80mm', '58mm'].includes(formatParam)
      ? formatParam
      : detail.store?.receiptWidth || '80mm';

    const html = generateInvoiceHTML(detail.sale, detail.store, layout, autoprint);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
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
      { success: false, message: error?.message || 'Failed to render bill document.' },
      { status: 500 }
    );
  }
}
