import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/server/auth.js';
import { TenantService } from '@/services/tenant.service.js';
import { AuditService } from '@/services/audit.service.js';
import { updateTenantStatusSchema } from '@/schemas/tenant.schema.js';
import { AppError } from '@/lib/errors.js';

export async function PATCH(request, { params }) {
  try {
    const admin = await requireSuperAdmin(request);
    const resolvedParams = await params;
    const { tenantId } = resolvedParams;

    const body = await request.json();
    const { status } = updateTenantStatusSchema.parse(body);

    const oldTenant = await TenantService.getTenantById(tenantId);
    const updatedTenant = await TenantService.updateStatus(tenantId, status);

    // Audit log
    await AuditService.logAction(
      'TENANT_STATUS_UPDATED',
      admin,
      tenantId,
      {
        previousStatus: oldTenant?.status,
        newStatus: status,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Tenant "${tenantId}" status updated to ${status}.`,
      tenant: updatedTenant,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', message: 'Invalid status', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update tenant status.' },
      { status: 500 }
    );
  }
}
