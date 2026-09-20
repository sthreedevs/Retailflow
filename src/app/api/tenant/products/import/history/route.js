import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { ProductImportService } from '@/services/product-import.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const history = await ProductImportService.getImportHistory(tenantContext.connection);

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to retrieve import history.' },
      { status: 500 }
    );
  }
}
