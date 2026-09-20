import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { ProductImportService } from '@/services/product-import.service.js';

export async function GET(request, { params }) {
  try {
    const { tenantContext } = await requireTenant(request);
    const resolvedParams = await params;
    const { historyId } = resolvedParams;

    const csvContent = await ProductImportService.generateErrorReportCsv(
      tenantContext.connection,
      historyId
    );

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="import_errors_${historyId}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to generate error report.' },
      { status: 500 }
    );
  }
}
