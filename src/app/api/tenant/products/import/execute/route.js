import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { ProductImportService } from '@/services/product-import.service.js';
import { AuditService } from '@/services/audit.service.js';
import { USER_ROLES } from '@/lib/constants.js';
import { ForbiddenError, ValidationError, handleApiError } from '@/lib/errors.js';

export async function POST(request) {
  try {
    const { user, tenantContext } = await requireTenant(request);

    // Enforce role authorization: Only Store Owner or Admin can import products
    if (user.role === USER_ROLES.CASHIER || user.role === USER_ROLES.STAFF) {
      throw new ForbiddenError('Only Store Owner or Store Admin can execute product catalog imports.');
    }

    const body = await request.json();
    const { validRows, meta } = body;

    if (!validRows || !Array.isArray(validRows) || validRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid rows found to import.' },
        { status: 400 }
      );
    }

    // Safety limit to avoid unbounded memory usage
    if (validRows.length > 10000) {
      throw new ValidationError('Bulk import cannot exceed 10,000 products in a single batch.');
    }

    const summary = await ProductImportService.executeBulkImport(
      validRows,
      meta || {},
      tenantContext.connection,
      user
    );

    // Audit log import execution
    AuditService.logAction(
      'PRODUCT_BULK_IMPORT',
      user,
      tenantContext.tenantId,
      {
        importedCount: summary.importedCount,
        failedCount: summary.failedCount,
        fileName: meta?.fileName || 'catalog',
      }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    return handleApiError(error, 'Bulk import execution failed.');
  }
}
