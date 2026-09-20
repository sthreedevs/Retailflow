import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const StockAdjustmentSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .regex(objectIdRegex, 'Invalid Product ID format'),
  newStock: z
    .number({ required_error: 'New physical count is required' })
    .min(0, 'Physical count cannot be negative'),
  reason: z
    .string({ required_error: 'Reason for adjustment is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters long'),
});

export const StockDamageSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .regex(objectIdRegex, 'Invalid Product ID format'),
  quantity: z
    .number({ required_error: 'Damaged quantity is required' })
    .positive('Damaged quantity must be greater than zero'),
  reason: z
    .string({ required_error: 'Reason for damage write-off is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters long'),
});

export const OpeningStockSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .regex(objectIdRegex, 'Invalid Product ID format'),
  openingStock: z
    .number({ required_error: 'Opening stock count is required' })
    .min(0, 'Opening stock cannot be negative'),
  reason: z.string().trim().optional(),
});

export const UpdateThresholdsSchema = z.object({
  minimumStock: z
    .number({ required_error: 'Minimum stock is required' })
    .min(0, 'Minimum stock cannot be negative'),
  reorderLevel: z
    .number({ required_error: 'Reorder level is required' })
    .min(0, 'Reorder level cannot be negative'),
});
