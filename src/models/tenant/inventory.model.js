import { Schema } from 'mongoose';

export const InventorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      unique: true,
      index: true,
    },
    currentStock: {
      type: Number,
      required: [true, 'Current stock is required'],
      min: [0, 'Current stock cannot be negative'],
      default: 0,
      index: true,
    },
    openingStock: {
      type: Number,
      min: [0, 'Opening stock cannot be negative'],
      default: 0,
    },
    minimumStock: {
      type: Number,
      min: [0, 'Minimum stock cannot be negative'],
      default: 5,
    },
    reorderLevel: {
      type: Number,
      min: [0, 'Reorder level cannot be negative'],
      default: 10,
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Store',
    },
    lastAdjustedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'inventory',
  }
);

InventorySchema.index({ currentStock: 1, minimumStock: 1 });
InventorySchema.index({ updatedAt: -1 });

/**
 * Returns the Inventory model bound to a specific tenant connection.
 * @param {import('mongoose').Connection} connection
 */
export function getInventoryModel(connection) {
  if (connection.models.Inventory) {
    return connection.models.Inventory;
  }
  return connection.model('Inventory', InventorySchema);
}
