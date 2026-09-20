import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/server/auth.js';
import { TenantService } from '@/services/tenant.service.js';
import { TenantProvisioningService } from '@/services/tenant-provisioning.service.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const adminUser = await requireSuperAdmin(request);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const tenants = await TenantService.listTenants({ search, status });

    return NextResponse.json({
      success: true,
      requestedBy: adminUser.email,
      count: tenants.length,
      tenants,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    const body = await request.json();

    const result = await TenantProvisioningService.provisionTenant(body, admin);

    return NextResponse.json(
      {
        success: true,
        message: `Tenant "${result.tenant.storeName}" successfully provisioned.`,
        tenant: result.tenant,
        ownerUser: {
          userId: result.ownerUser.userId,
          email: result.ownerUser.email,
          name: result.ownerUser.name,
          role: result.ownerUser.role,
        },
        initialPassword: result.tempPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message, errors: error.errors },
        { status: error.statusCode }
      );
    }

    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', message: 'Invalid input fields', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to provision tenant.' },
      { status: 500 }
    );
  }
}
