import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { ProductImportService } from '@/services/product-import.service.js';
import { AppError } from '@/lib/errors.js';

export async function POST(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const body = await request.json();
    const { rows, columnMapping } = body;

    if (!rows || !Array.isArray(rows) || !columnMapping) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload. rows and columnMapping are required.' },
        { status: 400 }
      );
    }

    const result = await ProductImportService.validateAndPreview(
      rows,
      columnMapping,
      tenantContext.connection
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to generate preview.' },
      { status: 500 }
    );
  }
}
