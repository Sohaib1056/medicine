import { z } from 'zod'

export const dispenseLineSchema = z.object({
  medicineId: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.coerce.number().nonnegative(),
  qty: z.coerce.number().int().positive(),
  discountRs: z.coerce.number().nonnegative().default(0).optional(),
  packMode: z.enum(['loose', 'pack']).default('loose').optional(),
  lineTaxType: z.enum(['percent', 'fixed']).default('percent').optional(),
  lineTaxValue: z.coerce.number().nonnegative().default(0).optional(),
})

export const dispenseCreateSchema = z.object({
  datetime: z.string().optional(),
  customer: z.string().optional(),
  customerPhone: z.string().optional(),
  customerId: z.string().optional(),
  payment: z.enum(['Cash','Card','Credit']).default('Cash'),
  discountPct: z.coerce.number().nonnegative().default(0),
  lineDiscountTotal: z.coerce.number().nonnegative().default(0).optional(),
  lineGstTotal: z.coerce.number().nonnegative().default(0).optional(),
  billGstType: z.enum(['percent', 'fixed']).default('percent').optional(),
  billGstValue: z.coerce.number().nonnegative().default(0).optional(),
  billGstAmount: z.coerce.number().nonnegative().default(0).optional(),
  subtotal: z.coerce.number().nonnegative().optional(),
  total: z.coerce.number().nonnegative().optional(),
  lines: z.array(dispenseLineSchema).min(1),
  createdBy: z.string().optional(),
  prescriptionId: z.string().optional(),
})

export const salesQuerySchema = z.object({
  bill: z.string().optional(),
  customer: z.string().optional(),
  customerId: z.string().optional(),
  payment: z.enum(['Any','Cash','Card','Credit']).default('Any').optional(),
  medicine: z.string().optional(),
  user: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
})
