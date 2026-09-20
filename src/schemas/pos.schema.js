import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const CartItemSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .regex(objectIdRegex, 'Invalid Product ID'),
  name: z.string().trim().min(1, 'Product name is required'),
  sku: z.string().trim().optional().default(''),
  barcode: z.string().trim().optional().default(''),
  packSize: z.string().trim().optional().default(''),
  unit: z.string().trim().optional().default('PCS'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be greater than zero'),
  unitPrice: z
    .number({ required_error: 'Unit price / rate is required' })
    .min(0, 'Unit price cannot be negative'),
  mrp: z.number().min(0).optional().default(0),
  dp: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  taxRate: z.number().min(0).optional().default(0),
  taxAmount: z.number().min(0).optional().default(0),
  lineTotal: z.number().optional(),
});

export const CustomerSchema = z.object({
  customerId: z.string().regex(objectIdRegex).optional().nullable(),
  name: z.string().trim().default('Walk-in Customer'),
  phone: z.string().trim().optional().default(''),
  address: z.string().trim().optional().default(''),
});

export const CustomerCreateSchema = z.object({
  name: z.string({ required_error: 'Customer name is required' }).trim().min(1, 'Name cannot be empty'),
  phone: z.string().trim().optional().default(''),
  address: z.string().trim().optional().default(''),
});

export const CreateSaleSchema = z.object({
  items: z.array(CartItemSchema).min(1, 'Cart must contain at least one item'),
  customer: CustomerSchema.optional().default({ name: 'Walk-in Customer' }),
  discountTotal: z.number().min(0).optional().default(0),
  taxTotal: z.number().min(0).optional().default(0),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'CREDIT', 'OTHER']).default('CASH'),
  amountPaid: z.number().min(0).optional().default(0),
  notes: z.string().trim().optional().default(''),
});
