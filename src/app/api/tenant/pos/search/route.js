import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { searchProductsForPOS } from '@/services/billing.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('query') || '';
    const barcode = searchParams.get('barcode') || '';

    const products = await searchProductsForPOS(tenantContext.connection, {
      query,
      barcode,
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to search products for POS.' },
      { status: 500 }
    );
  }
}
