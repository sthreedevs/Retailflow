import { Schema } from 'mongoose';

export const TenantSettingsSchema = new Schema(
  {
    storeName: {
      type: String,
      required: [true, 'storeName is required'],
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: '₹',
      trim: true,
    },
    taxEnabled: {
      type: Boolean,
      default: false,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    invoicePrefix: {
      type: String,
      default: 'INV-',
      trim: true,
    },
    receiptWidth: {
      type: String,
      enum: ['80mm', '58mm', 'A4'],
      default: '80mm',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    footerMessage: {
      type: String,
      trim: true,
      default: 'Thank you for shopping with us! Visit again.',
    },
  },
  {
    timestamps: true,
    collection: 'settings',
  }
);

/**
 * Returns the TenantSettings model bound to a specific tenant connection.
 * @param {import('mongoose').Connection} connection
 */
export function getTenantSettingsModel(connection) {
  if (connection.models.TenantSettings) {
    return connection.models.TenantSettings;
  }
  return connection.model('TenantSettings', TenantSettingsSchema);
}
