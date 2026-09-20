import { Schema } from 'mongoose';

export const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'CREDIT', 'OTHER'];
export const PAYMENT_STATUSES = ['PAID', 'PENDING', 'PARTIAL'];
export const SALE_STATUSES = ['COMPLETED', 'CANCELLED', 'REFUNDED'];

export const SaleItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    barcode: {
      type: String,
      trim: true,
      default: '',
    },
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
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.001, 'Quantity must be greater than zero'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price / rate is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    mrp: {
      type: Number,
      default: 0,
    },
    dp: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
    },
  },
  { _id: false }
);

export const SaleSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    customer: {
      customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        default: null,
      },
      name: {
        type: String,
        trim: true,
        default: 'Walk-in Customer',
      },
      phone: {
        type: String,
        trim: true,
        default: '',
      },
      address: {
        type: String,
        trim: true,
        default: '',
      },
    },
    items: {
      type: [SaleItemSchema],
      required: [true, 'At least one sale item is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A bill must contain at least one item.',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    roundedOff: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'CASH',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'PAID',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    changeDue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: SALE_STATUSES,
      default: 'COMPLETED',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    billedBy: {
      userId: { type: String, default: '' },
      name: { type: String, default: '' },
      role: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    collection: 'sales',
  }
);

SaleSchema.index({ createdAt: -1 });
SaleSchema.index({ 'customer.phone': 1 });
SaleSchema.index({ status: 1, createdAt: -1 });
SaleSchema.index({ paymentMethod: 1, createdAt: -1 });

/**
 * Returns the Sale model bound to a specific tenant connection.
 * @param {import('mongoose').Connection} connection
 */
export function getSaleModel(connection) {
  if (connection.models.Sale) {
    return connection.models.Sale;
  }
  return connection.model('Sale', SaleSchema);
}
