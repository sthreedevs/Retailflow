import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { searchCustomers, createCustomer } from '@/services/billing.service.js';
import { CustomerCreateSchema } from '@/schemas/pos.schema.js';
import { AppError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const customers = await searchCustomers(tenantContext.connection, search);

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to search customers.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const body = await request.json();

    const validation = CustomerCreateSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const customer = await createCustomer(tenantContext.connection, validation.data);

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to create customer.' },
      { status: 400 }
    );
  }
}
