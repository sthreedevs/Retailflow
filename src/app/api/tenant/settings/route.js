import { NextResponse } from 'next/server';
import { requireTenant } from '@/server/auth.js';
import { getTenantSettingsModel } from '@/models/tenant/settings.model.js';
import { AuditService } from '@/services/audit.service.js';
import { USER_ROLES } from '@/lib/constants.js';
import { ForbiddenError, handleApiError } from '@/lib/errors.js';

export async function GET(request) {
  try {
    const { tenantContext } = await requireTenant(request);
    const TenantSettings = getTenantSettingsModel(tenantContext.connection);

    let settings = await TenantSettings.findOne().lean();
    if (!settings) {
      settings = await TenantSettings.create({
        storeName: 'Retail Store',
        currency: 'INR',
        currencySymbol: '₹',
        invoicePrefix: 'INV-',
        receiptWidth: '80mm',
        footerMessage: 'Thank you for shopping with us! Visit again.',
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch settings.');
  }
}

export async function PATCH(request) {
  try {
    const { user, tenantContext } = await requireTenant(request);

    // Enforce role authorization: Only STORE_OWNER or STORE_ADMIN can update settings
    if (user.role !== USER_ROLES.STORE_OWNER && user.role !== USER_ROLES.STORE_ADMIN) {
      throw new ForbiddenError('Only Store Owner or Store Admin can modify store settings.');
    }

    const body = await request.json();
    const TenantSettings = getTenantSettingsModel(tenantContext.connection);

    let settings = await TenantSettings.findOne();
    if (!settings) {
      settings = new TenantSettings({});
    }

    if (body.storeName !== undefined) settings.storeName = String(body.storeName).trim();
    if (body.phone !== undefined) settings.phone = String(body.phone).trim();
    if (body.email !== undefined) settings.email = String(body.email).trim();
    if (body.address !== undefined) settings.address = String(body.address).trim();
    if (body.invoicePrefix !== undefined) settings.invoicePrefix = String(body.invoicePrefix).trim();
    if (body.receiptWidth !== undefined && ['80mm', '58mm', 'A4'].includes(body.receiptWidth)) {
      settings.receiptWidth = body.receiptWidth;
    }
    if (body.taxEnabled !== undefined) settings.taxEnabled = Boolean(body.taxEnabled);
    if (body.taxRate !== undefined) settings.taxRate = Math.max(0, Number(body.taxRate) || 0);
    if (body.footerMessage !== undefined) settings.footerMessage = String(body.footerMessage).trim();

    await settings.save();

    // Audit log settings change
    AuditService.logAction(
      'UPDATE_TENANT_SETTINGS',
      user,
      tenantContext.tenantId,
      { updatedFields: Object.keys(body) }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to update settings.');
  }
}
