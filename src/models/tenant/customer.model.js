import { Schema } from 'mongoose';

export const CustomerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    isWalkIn: {
      type: Boolean,
      default: false,
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPurchaseAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'customers',
  }
);

CustomerSchema.index({ phone: 1, name: 1 });

/**
 * Returns the Customer model bound to a specific tenant connection.
 * @param {import('mongoose').Connection} connection
 */
export function getCustomerModel(connection) {
  if (connection.models.Customer) {
    return connection.models.Customer;
  }
  return connection.model('Customer', CustomerSchema);
}
