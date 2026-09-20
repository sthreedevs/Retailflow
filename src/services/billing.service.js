import mongoose from 'mongoose';
import { getProductModel } from '../models/tenant/product.model.js';
import { getInventoryModel } from '../models/tenant/inventory.model.js';
import { getStockMovementModel } from '../models/tenant/stock-movement.model.js';
import { getTenantSettingsModel } from '../models/tenant/settings.model.js';
import { getCustomerModel } from '../models/tenant/customer.model.js';
import { getSaleModel } from '../models/tenant/sale.model.js';
import { getCounterModel } from '../models/tenant/counter.model.js';
import { withTenantTransaction, ensureInventoryRecord } from './inventory.service.js';
import { createInvoiceAccessToken } from './invoice-token.service.js';

/**
 * Atomically generates the next sequential invoice number for a tenant.
 * Uses the store's configured invoicePrefix from TenantSettings (e.g. 'INV-00001').
 * @param {import('mongoose').Connection} tenantConn
 */
export async function generateNextInvoiceNumber(tenantConn) {
  const Counter = getCounterModel(tenantConn);
  const TenantSettings = getTenantSettingsModel(tenantConn);

  const settings = await TenantSettings.findOne().lean();
  const prefix = settings?.invoicePrefix?.trim() || 'INV-';

  const counter = await Counter.findByIdAndUpdate(
    'invoiceNumber',
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  const sequenceStr = String(counter.seq).padStart(5, '0');
  return `${prefix}${sequenceStr}`;
}

/**
 * Rapidly searches products for POS counter with live current stock status.
 * Matches exact barcode, SKU, or product name regex.
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} params
 */
export async function searchProductsForPOS(tenantConn, { query = '', barcode = '' }) {
  const Product = getProductModel(tenantConn);

  const matchConditions = [{ status: 'ACTIVE' }];

  if (barcode && barcode.trim()) {
    const cleanBarcode = barcode.trim();
    matchConditions.push({
      $or: [
        { barcode: cleanBarcode },
        { sku: cleanBarcode },
      ],
    });
  } else if (query && query.trim()) {
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    matchConditions.push({
      $or: [
        { name: regex },
        { sku: regex },
        { barcode: regex },
      ],
    });
  }

  const pipeline = [
    { $match: { $and: matchConditions } },
    {
      $lookup: {
        from: 'inventory',
        localField: '_id',
        foreignField: 'productId',
        as: 'inv',
      },
    },
    {
      $unwind: {
        path: '$inv',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        productId: '$_id',
        name: 1,
        sku: 1,
        barcode: 1,
        category: 1,
        packSize: 1,
        unit: 1,
        mrp: { $ifNull: ['$mrp', 0] },
        dp: { $ifNull: ['$dp', 0] },
        currentStock: { $ifNull: ['$inv.currentStock', 0] },
      },
    },
    { $limit: 25 },
  ];

  return await Product.aggregate(pipeline);
}

/**
 * Searches customers by name or phone for fast billing selector.
 * @param {import('mongoose').Connection} tenantConn
 * @param {string} search
 */
export async function searchCustomers(tenantConn, search = '') {
  const Customer = getCustomerModel(tenantConn);
  const query = {};

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ name: regex }, { phone: regex }];
  }

  return await Customer.find(query).sort({ lastPurchaseAt: -1, createdAt: -1 }).limit(10).lean();
}

/**
 * Creates or retrieves a customer.
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} customerData
 */
export async function createCustomer(tenantConn, { name, phone = '', address = '' }) {
  const Customer = getCustomerModel(tenantConn);

  if (phone && phone.trim()) {
    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      existing.name = name.trim();
      if (address) existing.address = address.trim();
      await existing.save();
      return existing;
    }
  }

  return await Customer.create({
    name: name.trim(),
    phone: phone.trim(),
    address: address.trim(),
    isWalkIn: false,
  });
}

/**
 * Completes a retail POS sale:
 * 1. Validates cart items and checks stock availability.
 * 2. Generates sequential invoice number.
 * 3. Creates Sale and item records.
 * 4. Atomically decrements Inventory stock.
 * 5. Logs StockMovement of type 'SALE' with invoice reference.
 * 6. Updates customer metrics if applicable.
 *
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} salePayload
 * @param {object} user
 */
export async function completeSale(tenantConn, salePayload, user) {
  const {
    items = [],
    customer = { name: 'Walk-in Customer' },
    discountTotal = 0,
    taxTotal = 0,
    paymentMethod = 'CASH',
    amountPaid = 0,
    notes = '',
  } = salePayload;

  if (!items || items.length === 0) {
    throw new Error('Cannot complete sale with an empty cart.');
  }

  const Inventory = getInventoryModel(tenantConn);
  const StockMovement = getStockMovementModel(tenantConn);
  const Sale = getSaleModel(tenantConn);
  const Customer = getCustomerModel(tenantConn);

  // 1. Pre-validate stock availability for all cart items
  for (const item of items) {
    const productObjId = typeof item.productId === 'string' ? new mongoose.Types.ObjectId(item.productId) : item.productId;
    const inv = await ensureInventoryRecord(tenantConn, productObjId, user);
    const available = Number(inv.currentStock) || 0;
    const requested = Number(item.quantity);

    if (requested > available) {
      throw new Error(
        `Insufficient stock for "${item.name}". Available: ${available} ${item.unit || 'units'}, Requested: ${requested}`
      );
    }
  }

  // 2. Calculate item totals and bill summary
  let calculatedSubtotal = 0;
  const processedItems = items.map((item) => {
    const qty = Number(item.quantity);
    const rate = Number(item.unitPrice);
    const itemDisc = Number(item.discount || 0);
    const itemTax = Number(item.taxAmount || 0);
    const lineTotal = Math.round((qty * rate - itemDisc + itemTax) * 100) / 100;

    calculatedSubtotal += qty * rate;

    return {
      productId: typeof item.productId === 'string' ? new mongoose.Types.ObjectId(item.productId) : item.productId,
      name: item.name,
      sku: item.sku || '',
      barcode: item.barcode || '',
      packSize: item.packSize || '',
      unit: item.unit || 'PCS',
      quantity: qty,
      unitPrice: rate,
      mrp: Number(item.mrp || rate),
      dp: Number(item.dp || 0),
      discount: itemDisc,
      taxRate: Number(item.taxRate || 0),
      taxAmount: itemTax,
      lineTotal,
    };
  });

  const lineDiscountsTotal = processedItems.reduce((acc, it) => acc + (it.discount || 0), 0);
  const combinedDiscountTotal = Math.round((lineDiscountsTotal + Number(discountTotal || 0)) * 100) / 100;
  const subtotal = Math.round(calculatedSubtotal * 100) / 100;
  const rawGrandTotal = Math.max(0, subtotal - combinedDiscountTotal + Number(taxTotal || 0));
  const grandTotal = Math.round(rawGrandTotal);
  const roundedOff = Math.round((grandTotal - rawGrandTotal) * 100) / 100;
  const tendered = Number(amountPaid) || grandTotal;
  const changeDue = Math.max(0, Math.round((tendered - grandTotal) * 100) / 100);

  // 3. Execute atomic transaction
  return await withTenantTransaction(tenantConn, async (session) => {
    const opts = session ? { session } : {};

    // Generate sequential invoice number
    const invoiceNumber = await generateNextInvoiceNumber(tenantConn);

    // Decrement stock and record StockMovement for each line item atomically
    const decrementedItems = [];
    try {
      for (const item of processedItems) {
        const updatedInv = await Inventory.findOneAndUpdate(
          {
            productId: item.productId,
            currentStock: { $gte: item.quantity },
          },
          {
            $inc: { currentStock: -item.quantity },
            $set: { lastAdjustedAt: new Date() },
          },
          {
            returnDocument: 'after',
            session: session || undefined,
          }
        );

        if (!updatedInv) {
          throw new Error(
            `Insufficient stock for "${item.name}". Stock was depleted by another concurrent checkout.`
          );
        }

        decrementedItems.push({ productId: item.productId, quantity: item.quantity });

        const newStock = Number(updatedInv.currentStock);
        const prevStock = newStock + item.quantity;

        await StockMovement.create(
          [
            {
              productId: item.productId,
              movementType: 'SALE',
              quantity: item.quantity,
              direction: 'OUT',
              previousStock: prevStock,
              newStock,
              unitCost: item.dp || 0,
              reason: `Retail POS Sale: ${invoiceNumber}`,
              referenceId: invoiceNumber,
              createdBy: {
                userId: user?.userId || 'unknown',
                name: user?.name || user?.email || 'Cashier',
                role: user?.role || 'CASHIER',
              },
            },
          ],
          opts
        );
      }
    } catch (err) {
      if (!session) {
        for (const dec of decrementedItems) {
          await Inventory.updateOne(
            { productId: dec.productId },
            { $inc: { currentStock: dec.quantity } }
          ).catch(() => {});
        }
      }
      throw err;
    }

    // Resolve or link customer
    let linkedCustomer = {
      customerId: null,
      name: customer?.name?.trim() || 'Walk-in Customer',
      phone: customer?.phone?.trim() || '',
      address: customer?.address?.trim() || '',
    };

    if (customer?.customerId) {
      linkedCustomer.customerId = new mongoose.Types.ObjectId(customer.customerId);
      const custDoc = await Customer.findById(linkedCustomer.customerId).session(session || null);
      if (custDoc) {
        custDoc.totalPurchases = (custDoc.totalPurchases || 0) + 1;
        custDoc.totalSpent = (custDoc.totalSpent || 0) + grandTotal;
        custDoc.lastPurchaseAt = new Date();
        await custDoc.save(opts);
      }
    } else if (customer?.phone && customer.phone.trim()) {
      let custDoc = await Customer.findOne({ phone: customer.phone.trim() }).session(session || null);
      if (!custDoc) {
        custDoc = new Customer({
          name: customer.name || 'Customer',
          phone: customer.phone.trim(),
          address: customer.address || '',
          totalPurchases: 1,
          totalSpent: grandTotal,
          lastPurchaseAt: new Date(),
        });
      } else {
        custDoc.totalPurchases = (custDoc.totalPurchases || 0) + 1;
        custDoc.totalSpent = (custDoc.totalSpent || 0) + grandTotal;
        custDoc.lastPurchaseAt = new Date();
      }
      await custDoc.save(opts);
      linkedCustomer.customerId = custDoc._id;
    }

    // Create Sale record
    const [sale] = await Sale.create(
      [
        {
          invoiceNumber,
          customer: linkedCustomer,
          items: processedItems,
          subtotal,
          discountTotal: combinedDiscountTotal,
          taxTotal: Number(taxTotal),
          grandTotal,
          roundedOff,
          paymentMethod,
          paymentStatus: 'PAID',
          amountPaid: tendered,
          changeDue,
          status: 'COMPLETED',
          notes: notes.trim(),
          billedBy: {
            userId: user?.userId || 'unknown',
            name: user?.name || user?.email || 'Cashier',
            role: user?.role || 'CASHIER',
          },
        },
      ],
      opts
    );

    return sale;
  });
}

/**
 * Lists paginated sales history with summary aggregates.
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} options
 */
export async function listSales(tenantConn, options = {}) {
  const Sale = getSaleModel(tenantConn);
  const {
    search = '',
    paymentMethod = 'ALL',
    startDate,
    endDate,
    page = 1,
    limit = 25,
  } = options;

  const query = {};

  if (paymentMethod && paymentMethod !== 'ALL') {
    query.paymentMethod = paymentMethod;
  }

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [
      { invoiceNumber: regex },
      { 'customer.name': regex },
      { 'customer.phone': regex },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const total = await Sale.countDocuments(query);
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [sales, aggregateResult] = await Promise.all([
    Sale.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalSales: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary = aggregateResult[0] || { totalRevenue: 0, totalSales: 0 };

  return {
    sales,
    summary: {
      totalRevenue: Math.round(summary.totalRevenue * 100) / 100,
      totalSales: summary.totalSales,
    },
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

/**
 * Retrieves full sale/invoice details with store settings for printing/display,
 * including a secure public invoice link and pre-composed WhatsApp sharing message.
 * @param {import('mongoose').Connection} tenantConn
 * @param {string} saleIdOrInvoice
 * @param {object} [options]
 * @param {string} [options.baseUrl]
 * @param {string} [options.tenantId]
 */
export async function getSaleDetail(tenantConn, saleIdOrInvoice, options = {}) {
  const Sale = getSaleModel(tenantConn);
  const TenantSettings = getTenantSettingsModel(tenantConn);

  const query = mongoose.Types.ObjectId.isValid(saleIdOrInvoice)
    ? { _id: new mongoose.Types.ObjectId(saleIdOrInvoice) }
    : { invoiceNumber: saleIdOrInvoice };

  const [sale, settings] = await Promise.all([
    Sale.findOne(query).lean(),
    TenantSettings.findOne().lean(),
  ]);

  if (!sale) {
    throw new Error('Invoice / Sale record not found');
  }

  const dbName = tenantConn.name || '';
  const tenantId = options.tenantId || (dbName.startsWith('tenant_') ? dbName.replace('tenant_', '') : 'store');
  const baseUrl = options.baseUrl || '';

  const token = await createInvoiceAccessToken({
    tenantId,
    saleId: sale._id.toString(),
    invoiceNumber: sale.invoiceNumber,
  });

  const publicInvoiceUrl = `${baseUrl}/invoice/${token}`;
  const storeName = settings?.storeName || 'Retail Store';
  const currency = settings?.currencySymbol || '₹';
  const rawPhone = sale.customer?.phone ? String(sale.customer.phone).replace(/\D/g, '') : '';
  const whatsappPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

  const whatsappMessage = `🧾 *Tax Invoice from ${storeName}*\n\n` +
    `Invoice No: *${sale.invoiceNumber}*\n` +
    `Date: ${new Date(sale.createdAt).toLocaleDateString()}\n` +
    `Customer: ${sale.customer?.name || 'Walk-in'}\n` +
    `Total: *${currency}${sale.grandTotal}* (${sale.paymentMethod})\n\n` +
    `📄 View & download your invoice receipt:\n${publicInvoiceUrl}\n\n` +
    `${settings?.footerMessage || 'Thank you for shopping with us!'}`;

  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return {
    sale,
    store: {
      storeName,
      currency: settings?.currency || 'INR',
      currencySymbol: currency,
      phone: settings?.phone || '',
      email: settings?.email || '',
      address: settings?.address || '',
      receiptWidth: settings?.receiptWidth || '80mm',
      footerMessage: settings?.footerMessage || 'Thank you for shopping with us! Visit again.',
    },
    delivery: {
      token,
      publicInvoiceUrl,
      whatsappUrl,
      whatsappMessage,
    },
  };
}
