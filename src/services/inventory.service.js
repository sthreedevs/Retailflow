import mongoose from 'mongoose';
import { getProductModel } from '../models/tenant/product.model.js';
import { getInventoryModel } from '../models/tenant/inventory.model.js';
import { getStockMovementModel } from '../models/tenant/stock-movement.model.js';

/**
 * Executes a callback within a MongoDB transaction if replica set is active,
 * or gracefully runs sequentially with error checking on standalone instances.
 * @param {import('mongoose').Connection} connection
 * @param {(session: import('mongoose').ClientSession | null) => Promise<any>} operation
 */
export async function withTenantTransaction(connection, operation) {
  const isReplicaSet = Boolean(
    connection.client?.topology?.description?.type?.includes('ReplicaSet') ||
    connection.client?.topology?.s?.description?.type?.includes('ReplicaSet')
  );

  if (!isReplicaSet) {
    return await operation(null);
  }

  const session = await connection.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Ensures an inventory record exists for a product.
 * @param {import('mongoose').Connection} tenantConn
 * @param {string | import('mongoose').Types.ObjectId} productId
 * @param {object} [user]
 */
export async function ensureInventoryRecord(tenantConn, productId, user = null) {
  const Inventory = getInventoryModel(tenantConn);
  const Product = getProductModel(tenantConn);

  const productObjId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;

  let inventory = await Inventory.findOne({ productId: productObjId });
  if (inventory) {
    return inventory;
  }

  const product = await Product.findById(productObjId);
  if (!product) {
    throw new Error('Product not found in tenant database');
  }

  const initialOpening = Number(product.openingStock) || 0;
  const initialMin = Number(product.minimumStock) || 5;
  const initialReorder = Number(product.reorderLevel) || 10;

  inventory = await Inventory.create({
    productId: productObjId,
    currentStock: initialOpening,
    openingStock: initialOpening,
    minimumStock: initialMin,
    reorderLevel: initialReorder,
    location: 'Main Store',
    lastAdjustedAt: initialOpening > 0 ? new Date() : null,
  });

  if (initialOpening > 0) {
    const StockMovement = getStockMovementModel(tenantConn);
    await StockMovement.create({
      productId: productObjId,
      movementType: 'OPENING',
      quantity: initialOpening,
      direction: 'IN',
      previousStock: 0,
      newStock: initialOpening,
      unitCost: product.dp || 0,
      reason: 'Initial opening stock configuration',
      referenceId: `OPN-${Date.now().toString(36).toUpperCase()}`,
      createdBy: {
        userId: user?.userId || 'system',
        name: user?.name || 'System Setup',
        role: user?.role || 'SYSTEM',
      },
    });
  }

  return inventory;
}

/**
 * Aggregates high-level inventory overview metrics and stock valuations.
 * @param {import('mongoose').Connection} tenantConn
 */
export async function getInventoryOverview(tenantConn) {
  const Product = getProductModel(tenantConn);

  const pipeline = [
    { $match: { status: { $ne: 'ARCHIVED' } } },
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
        dp: { $ifNull: ['$dp', 0] },
        mrp: { $ifNull: ['$mrp', 0] },
        currentStock: { $ifNull: ['$inv.currentStock', 0] },
        minimumStock: { $ifNull: ['$inv.minimumStock', 5] },
        reorderLevel: { $ifNull: ['$inv.reorderLevel', 10] },
      },
    },
    {
      $project: {
        currentStock: 1,
        minimumStock: 1,
        reorderLevel: 1,
        dp: 1,
        mrp: 1,
        stockValuationDP: { $multiply: ['$currentStock', '$dp'] },
        stockValuationMRP: { $multiply: ['$currentStock', '$mrp'] },
        isOutOfStock: { $lte: ['$currentStock', 0] },
        isLowStock: {
          $and: [
            { $gt: ['$currentStock', 0] },
            { $lte: ['$currentStock', '$minimumStock'] },
          ],
        },
        isInStock: { $gt: ['$currentStock', '$minimumStock'] },
      },
    },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStockUnits: { $sum: '$currentStock' },
        outOfStockCount: { $sum: { $cond: ['$isOutOfStock', 1, 0] } },
        lowStockCount: { $sum: { $cond: ['$isLowStock', 1, 0] } },
        inStockCount: { $sum: { $cond: ['$isInStock', 1, 0] } },
        totalValuationDP: { $sum: '$stockValuationDP' },
        totalValuationMRP: { $sum: '$stockValuationMRP' },
      },
    },
  ];

  const results = await Product.aggregate(pipeline);
  const summary = results[0] || {
    totalProducts: 0,
    totalStockUnits: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    inStockCount: 0,
    totalValuationDP: 0,
    totalValuationMRP: 0,
  };

  return {
    totalProducts: summary.totalProducts,
    totalStockUnits: Math.round(summary.totalStockUnits * 100) / 100,
    outOfStockCount: summary.outOfStockCount,
    lowStockCount: summary.lowStockCount,
    inStockCount: summary.inStockCount,
    valuationDP: Math.round(summary.totalValuationDP * 100) / 100,
    valuationMRP: Math.round(summary.totalValuationMRP * 100) / 100,
    potentialMargin: Math.max(0, Math.round((summary.totalValuationMRP - summary.totalValuationDP) * 100) / 100),
  };
}

/**
 * Lists paginated inventory joined with product catalog.
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} options
 */
export async function listInventory(tenantConn, options = {}) {
  const Product = getProductModel(tenantConn);
  const {
    search = '',
    category = '',
    status = 'ALL',
    page = 1,
    limit = 20,
    sort = 'name_asc',
  } = options;

  const matchConditions = [{ status: { $ne: 'ARCHIVED' } }];

  if (category && category !== 'ALL') {
    matchConditions.push({ category });
  }

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    matchConditions.push({
      $or: [{ name: regex }, { sku: regex }, { barcode: regex }],
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
        brand: 1,
        packSize: 1,
        unit: 1,
        mrp: { $ifNull: ['$mrp', 0] },
        dp: { $ifNull: ['$dp', 0] },
        sp: { $ifNull: ['$sp', 0] },
        currentStock: { $ifNull: ['$inv.currentStock', 0] },
        minimumStock: { $ifNull: ['$inv.minimumStock', 5] },
        reorderLevel: { $ifNull: ['$inv.reorderLevel', 10] },
        location: { $ifNull: ['$inv.location', 'Main Store'] },
        lastAdjustedAt: '$inv.lastAdjustedAt',
        inventoryId: '$inv._id',
      },
    },
    {
      $addFields: {
        stockStatus: {
          $cond: {
            if: { $lte: ['$currentStock', 0] },
            then: 'OUT_OF_STOCK',
            else: {
              $cond: {
                if: { $lte: ['$currentStock', '$minimumStock'] },
                then: 'LOW_STOCK',
                else: 'IN_STOCK',
              },
            },
          },
        },
        stockValuationDP: { $multiply: ['$currentStock', '$dp'] },
        stockValuationMRP: { $multiply: ['$currentStock', '$mrp'] },
        reorderDeficit: {
          $max: [0, { $subtract: ['$reorderLevel', '$currentStock'] }],
        },
      },
    },
  ];

  if (status && status !== 'ALL') {
    pipeline.push({ $match: { stockStatus: status } });
  }

  let sortStage = { name: 1 };
  if (sort === 'stock_asc') sortStage = { currentStock: 1 };
  else if (sort === 'stock_desc') sortStage = { currentStock: -1 };
  else if (sort === 'name_desc') sortStage = { name: -1 };
  else if (sort === 'valuation_desc') sortStage = { stockValuationDP: -1 };
  else if (sort === 'reorder_desc') sortStage = { reorderDeficit: -1, currentStock: 1 };

  pipeline.push({ $sort: sortStage });

  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await Product.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  pipeline.push({ $skip: skip }, { $limit: Number(limit) });

  const items = await Product.aggregate(pipeline);

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

/**
 * Adjusts stock balance to a verified physical count and records an ADJUSTMENT movement.
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} params
 */
export async function adjustStock(tenantConn, { productId, newStock, reason, user }) {
  if (newStock < 0) {
    throw new Error('New stock count cannot be negative');
  }

  const Inventory = getInventoryModel(tenantConn);
  const Product = getProductModel(tenantConn);
  const StockMovement = getStockMovementModel(tenantConn);

  const productObjId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;
  const product = await Product.findById(productObjId);
  if (!product) {
    throw new Error('Product not found');
  }

  let inventory = await Inventory.findOne({ productId: productObjId });
  if (!inventory) {
    inventory = await ensureInventoryRecord(tenantConn, productObjId, user);
  }

  const previousStock = Number(inventory.currentStock) || 0;
  const targetStock = Number(newStock);
  const delta = targetStock - previousStock;

  if (delta === 0) {
    return { inventory, movement: null, message: 'Stock already matches target count' };
  }

  const direction = delta > 0 ? 'IN' : 'OUT';
  const quantity = Math.abs(delta);
  const referenceId = `ADJ-${Date.now().toString(36).toUpperCase()}`;

  return await withTenantTransaction(tenantConn, async (session) => {
    const opts = session ? { session } : {};

    inventory.currentStock = targetStock;
    inventory.lastAdjustedAt = new Date();
    await inventory.save(opts);

    const [movement] = await StockMovement.create(
      [
        {
          productId: productObjId,
          movementType: 'ADJUSTMENT',
          quantity,
          direction,
          previousStock,
          newStock: targetStock,
          unitCost: product.dp || 0,
          reason: reason || 'Physical count adjustment',
          referenceId,
          createdBy: {
            userId: user?.userId || 'unknown',
            name: user?.name || user?.email || 'Store User',
            role: user?.role || 'STORE_ADMIN',
          },
        },
      ],
      opts
    );

    return { inventory, movement };
  });
}

/**
 * Records damaged stock write-off and generates a DAMAGE movement.
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} params
 */
export async function recordDamage(tenantConn, { productId, quantity, reason, user }) {
  const damagedQty = Number(quantity);
  if (damagedQty <= 0) {
    throw new Error('Damaged quantity must be greater than zero');
  }

  const Inventory = getInventoryModel(tenantConn);
  const Product = getProductModel(tenantConn);
  const StockMovement = getStockMovementModel(tenantConn);

  const productObjId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;
  const product = await Product.findById(productObjId);
  if (!product) {
    throw new Error('Product not found');
  }

  let inventory = await Inventory.findOne({ productId: productObjId });
  if (!inventory) {
    inventory = await ensureInventoryRecord(tenantConn, productObjId, user);
  }

  const previousStock = Number(inventory.currentStock) || 0;
  if (damagedQty > previousStock) {
    throw new Error(`Damaged quantity (${damagedQty}) exceeds current stock (${previousStock})`);
  }

  const newStock = previousStock - damagedQty;
  const referenceId = `DMG-${Date.now().toString(36).toUpperCase()}`;

  return await withTenantTransaction(tenantConn, async (session) => {
    const opts = session ? { session } : {};

    inventory.currentStock = newStock;
    inventory.lastAdjustedAt = new Date();
    await inventory.save(opts);

    const [movement] = await StockMovement.create(
      [
        {
          productId: productObjId,
          movementType: 'DAMAGE',
          quantity: damagedQty,
          direction: 'OUT',
          previousStock,
          newStock,
          unitCost: product.dp || 0,
          reason: reason || 'Damaged goods write-off',
          referenceId,
          createdBy: {
            userId: user?.userId || 'unknown',
            name: user?.name || user?.email || 'Store User',
            role: user?.role || 'STORE_ADMIN',
          },
        },
      ],
      opts
    );

    return { inventory, movement };
  });
}

/**
 * Sets initial opening stock for a product and creates an OPENING movement.
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} params
 */
export async function setOpeningStock(tenantConn, { productId, openingStock, reason, user }) {
  const initialStock = Number(openingStock);
  if (initialStock < 0) {
    throw new Error('Opening stock cannot be negative');
  }

  const Inventory = getInventoryModel(tenantConn);
  const Product = getProductModel(tenantConn);
  const StockMovement = getStockMovementModel(tenantConn);

  const productObjId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;
  const product = await Product.findById(productObjId);
  if (!product) {
    throw new Error('Product not found');
  }

  let inventory = await Inventory.findOne({ productId: productObjId });
  const previousStock = inventory ? Number(inventory.currentStock) || 0 : 0;
  const referenceId = `OPN-${Date.now().toString(36).toUpperCase()}`;

  return await withTenantTransaction(tenantConn, async (session) => {
    const opts = session ? { session } : {};

    if (!inventory) {
      inventory = new Inventory({
        productId: productObjId,
        currentStock: initialStock,
        openingStock: initialStock,
        minimumStock: product.minimumStock || 5,
        reorderLevel: product.reorderLevel || 10,
        location: 'Main Store',
        lastAdjustedAt: new Date(),
      });
    } else {
      inventory.openingStock = initialStock;
      inventory.currentStock = initialStock;
      inventory.lastAdjustedAt = new Date();
    }
    await inventory.save(opts);

    const [movement] = await StockMovement.create(
      [
        {
          productId: productObjId,
          movementType: 'OPENING',
          quantity: initialStock,
          direction: 'IN',
          previousStock,
          newStock: initialStock,
          unitCost: product.dp || 0,
          reason: reason || 'Configured opening stock balance',
          referenceId,
          createdBy: {
            userId: user?.userId || 'unknown',
            name: user?.name || user?.email || 'Store User',
            role: user?.role || 'STORE_ADMIN',
          },
        },
      ],
      opts
    );

    return { inventory, movement };
  });
}

/**
 * Updates stock alert thresholds (minimum stock, reorder level).
 * Note: Does not mutate stock quantity, therefore no stock movement is created.
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} params
 */
export async function updateThresholds(tenantConn, { productId, minimumStock, reorderLevel }) {
  const Inventory = getInventoryModel(tenantConn);
  const productObjId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;

  let inventory = await Inventory.findOne({ productId: productObjId });
  if (!inventory) {
    inventory = await ensureInventoryRecord(tenantConn, productObjId);
  }

  if (minimumStock !== undefined) inventory.minimumStock = Number(minimumStock);
  if (reorderLevel !== undefined) inventory.reorderLevel = Number(reorderLevel);

  await inventory.save();
  return inventory;
}

/**
 * Retrieves paginated audit log of stock movements.
 * @param {import('mongoose').Connection} tenantConn
 * @param {object} options
 */
export async function getStockMovements(tenantConn, options = {}) {
  const StockMovement = getStockMovementModel(tenantConn);
  const { productId, movementType, page = 1, limit = 20 } = options;

  const query = {};
  if (productId) {
    query.productId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;
  }
  if (movementType && movementType !== 'ALL') {
    query.movementType = movementType;
  }

  const total = await StockMovement.countDocuments(query);
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const movements = await StockMovement.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate({
      path: 'productId',
      select: 'name sku barcode category packSize unit dp mrp',
    })
    .lean();

  return {
    movements,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

/**
 * Retrieves single product inventory details along with recent stock movements.
 * @param {import('mongoose').Connection} tenantConn
 * @param {string | import('mongoose').Types.ObjectId} productId
 */
export async function getProductStockDetail(tenantConn, productId) {
  const Product = getProductModel(tenantConn);
  const StockMovement = getStockMovementModel(tenantConn);

  const productObjId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;
  const product = await Product.findById(productObjId).lean();
  if (!product) {
    throw new Error('Product not found');
  }

  const inventory = await ensureInventoryRecord(tenantConn, productObjId);

  const recentMovements = await StockMovement.find({ productId: productObjId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const currentStock = Number(inventory.currentStock) || 0;
  const minimumStock = Number(inventory.minimumStock) || 5;
  const reorderLevel = Number(inventory.reorderLevel) || 10;

  let stockStatus = 'IN_STOCK';
  if (currentStock <= 0) {
    stockStatus = 'OUT_OF_STOCK';
  } else if (currentStock <= minimumStock) {
    stockStatus = 'LOW_STOCK';
  }

  return {
    product,
    inventory: inventory.toObject ? inventory.toObject() : inventory,
    stockStatus,
    valuationDP: Math.round(currentStock * (product.dp || 0) * 100) / 100,
    valuationMRP: Math.round(currentStock * (product.mrp || 0) * 100) / 100,
    reorderDeficit: Math.max(0, reorderLevel - currentStock),
    recentMovements,
  };
}
