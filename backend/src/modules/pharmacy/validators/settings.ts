import { z } from 'zod'

export const settingsUpdateSchema = z.object({
  pharmacyName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  license: z.string().optional(),
  billingFooter: z.string().optional(),
  logoDataUrl: z.string().optional(),
  taxRate: z.number().optional(),
  maxSaleLimit: z.number().optional(),
})

export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>
