import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { getProductModel } from '@/models/tenant/product.model.js';
import { escapeRegex } from '@/lib/string.js';
import { handleApiError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const Product = getProductModel(tenantContext.connection);

    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (search.trim()) {
      const safePattern = escapeRegex(search.trim());
      const regex = new RegExp(safePattern, 'i');
      query.$or = [{ name: regex }, { sku: regex }, { barcode: regex }, { category: regex }];
    }

    const [total, products, categories] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.distinct('category'),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      categories,
      products,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch products.');
  }
}
