import { Schema } from 'mongoose';

export const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    // Catalog pricing & packaging fields
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: [0, 'MRP cannot be negative'],
      default: 0,
    },
    dp: {
      type: Number,
      min: [0, 'DP cannot be negative'],
      default: 0,
    },
    // IMPORTANT: SP is a numeric catalog field whose meaning is currently unconfirmed.
    // DO NOT treat SP as selling price.
    sp: {
      type: Number,
      default: 0,
    },
    // IMPORTANT: Pack size (e.g. 100g, 500ml, 1000ml), NOT inventory quantity.
    packSize: {
      type: String,
      trim: true,
      default: '',
    },
    unit: {
      type: String,
      trim: true,
      default: 'PCS',
    },
    // Inventory configuration fields
    openingStock: {
      type: Number,
      min: [0, 'Opening stock cannot be negative'],
      default: 0,
    },
    minimumStock: {
      type: Number,
      min: [0, 'Minimum stock cannot be negative'],
      default: 0,
    },
    reorderLevel: {
      type: Number,
      min: [0, 'Reorder level cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ category: 1, status: 1 });

/**
 * Returns the Product model bound to a specific tenant connection.
 * @param {import('mongoose').Connection} connection
 */
export function getProductModel(connection) {
  if (connection.models.Product) {
    return connection.models.Product;
  }
  return connection.model('Product', ProductSchema);
}
