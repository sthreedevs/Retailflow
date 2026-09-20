import { z } from 'zod';
import { TenantService } from './tenant.service.js';
import { AuthService } from './auth.service.js';
import { AuditService } from './audit.service.js';
import { TenantConnectionManager, getTenantDatabaseName } from '../db/tenant-manager.js';
import { getTenantSettingsModel } from '../models/tenant/settings.model.js';
import { getProductModel } from '../models/tenant/product.model.js';
import { getCustomerModel } from '../models/tenant/customer.model.js';
import { getInventoryModel } from '../models/tenant/inventory.model.js';
import { getSaleModel } from '../models/tenant/sale.model.js';
import { getStockMovementModel } from '../models/tenant/stock-movement.model.js';
import { USER_ROLES, TENANT_STATUS, TENANT_STATUSES } from '../lib/constants.js';

export const provisionTenantSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters').trim(),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters').trim(),
  email: z.string().email('Invalid owner email address').trim().toLowerCase(),
  phone: z.string().min(7, 'Phone number must be at least 7 characters').trim(),
  status: z.enum(TENANT_STATUSES).optional().default(TENANT_STATUS.ACTIVE),
  initialPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export class TenantProvisioningService {
  /**
   * Orchestrates full tenant provisioning:
   * 1. Generates unique tenantId & safe databaseName
   * 2. Registers tenant in platform database
   * 3. Initializes isolated tenant database with default settings and indexes
   * 4. Registers STORE_OWNER user in platform database
   * 5. Records audit log
   *
   * @param {object} input
   * @param {{ userId: string, email: string, role: string }} performedBy
   */
  static async provisionTenant(input, performedBy) {
    const validated = provisionTenantSchema.parse(input);

    // 1. Generate unique tenantId slug
    const baseSlug = validated.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24);

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const tenantId = `${baseSlug}-${randomSuffix}`;
    const databaseName = getTenantDatabaseName(tenantId);

    // 2. Save tenant record in platform DB
    const tenant = await TenantService.registerTenant({
      tenantId,
      storeName: validated.storeName,
      ownerName: validated.ownerName,
      email: validated.email,
      phone: validated.phone,
      status: validated.status,
    });

    // 3. Connect to isolated tenant database, initialize settings and build indexes
    const tenantConn = await TenantConnectionManager.getTenantConnection(databaseName);
    const TenantSettings = getTenantSettingsModel(tenantConn);
    const Product = getProductModel(tenantConn);
    const Customer = getCustomerModel(tenantConn);
    const Inventory = getInventoryModel(tenantConn);
    const Sale = getSaleModel(tenantConn);
    const StockMovement = getStockMovementModel(tenantConn);

    await Promise.allSettled([
      TenantSettings.create({
        storeName: validated.storeName,
        currency: 'INR',
        currencySymbol: '₹',
        taxEnabled: false,
        taxRate: 0,
        invoicePrefix: 'INV-',
        receiptWidth: '80mm',
        phone: validated.phone,
        email: validated.email,
      }),
      Product.createIndexes(),
      Customer.createIndexes(),
      Inventory.createIndexes(),
      Sale.createIndexes(),
      StockMovement.createIndexes(),
    ]);

    // 4. Create STORE_OWNER account in platform users
    const tempPassword = validated.initialPassword || 'StoreOwner123!';
    const ownerUser = await AuthService.registerUser({
      email: validated.email,
      password: tempPassword,
      name: validated.ownerName,
      role: USER_ROLES.STORE_OWNER,
      tenantId: tenant.tenantId,
    });

    // 5. Record platform audit log
    await AuditService.logAction(
      'TENANT_CREATED',
      performedBy,
      tenant.tenantId,
      {
        storeName: tenant.storeName,
        databaseName,
        ownerEmail: validated.email,
        ownerUserId: ownerUser.userId,
      }
    );

    return {
      tenant,
      ownerUser,
      tempPassword,
    };
  }
}
