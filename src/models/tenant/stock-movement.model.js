import { Schema } from 'mongoose';

export const MOVEMENT_TYPES = [
  'OPENING',
  'PURCHASE',
  'SALE',
  'RETURN_IN',
  'RETURN_OUT',
  'ADJUSTMENT',
  'DAMAGE',
  'TRANSFER_IN',
  'TRANSFER_OUT',
];

export const StockMovementSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    movementType: {
      type: String,
      required: [true, 'Movement type is required'],
      enum: {
        values: MOVEMENT_TYPES,
        message: '{VALUE} is not a valid movement type',
      },
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Movement quantity is required'],
      min: [0.001, 'Quantity must be greater than zero'],
    },
    direction: {
      type: String,
      required: [true, 'Movement direction is required'],
      enum: ['IN', 'OUT'],
    },
    previousStock: {
      type: Number,
      required: [true, 'Previous stock is required'],
    },
    newStock: {
      type: Number,
      required: [true, 'New stock is required'],
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    referenceId: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      userId: { type: String, default: '' },
      name: { type: String, default: '' },
      role: { type: String, default: '' },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'stock_movements',
  }
);

StockMovementSchema.index({ productId: 1, createdAt: -1 });
StockMovementSchema.index({ movementType: 1, createdAt: -1 });
StockMovementSchema.index({ createdAt: -1 });

/**
 * Returns the StockMovement model bound to a specific tenant connection.
 * @param {import('mongoose').Connection} connection
 */
export function getStockMovementModel(connection) {
  if (connection.models.StockMovement) {
    return connection.models.StockMovement;
  }
  return connection.model('StockMovement', StockMovementSchema);
}
