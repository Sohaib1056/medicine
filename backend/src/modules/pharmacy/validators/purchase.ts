import { z } from 'zod'

export const purchaseLineSchema = z.object({
  medicineId: z.string().min(1).optional(),
  name: z.string().min(1),
  genericName: z.string().optional(),
  manufacturer: z.string().optional(),
  unitsPerPack: z.coerce.number().int().positive().default(1),
  packs: z.coerce.number().int().nonnegative().default(0),
  totalItems: z.coerce.number().int().nonnegative().default(0),
  buyPerPack: z.coerce.number().nonnegative().default(0),
  buyPerUnit: z.coerce.number().nonnegative().default(0),
  salePerPack: z.coerce.number().nonnegative().default(0),
  salePerUnit: z.coerce.number().nonnegative().default(0),
  category: z.string().optional(),
  brand: z.string().optional(),
  unitType: z.string().optional(),
  shelfNumber: z.string().optional(),
  maxPackAllow: z.coerce.number().int().nonnegative().optional(),
  barcode: z.string().optional(),
  minStock: z.coerce.number().int().nonnegative().optional(),
  defaultDiscountPct: z.coerce.number().min(0).max(100).optional(),
  lineTaxType: z.enum(['percent', 'fixed']).optional(),
  lineTaxValue: z.coerce.number().nonnegative().optional(),
  expiry: z.string().optional(),
  image: z.string().optional(), // Image path
})

export const purchaseCreateSchema = z.object({
  date: z.string().min(1),
  invoice: z.string().min(1),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  lines: z.array(purchaseLineSchema).min(1),
})

export const purchaseQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
})
