import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { listInventory } from '@/services/inventory.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || 'ALL';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const sort = searchParams.get('sort') || 'name_asc';

    const result = await listInventory(tenantContext.connection, {
      search,
      category,
      status,
      page,
      limit,
      sort,
    });

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
      { success: false, message: error?.message || 'Failed to fetch inventory items.' },
      { status: 500 }
    );
  }
}
