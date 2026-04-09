import { Schema, model, models } from 'mongoose'

const SettingsSchema = new Schema({
  pharmacyName: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  email: { type: String, default: '' },
  license: { type: String, default: '' },
  billingFooter: { type: String, default: '' },
  logoDataUrl: { type: String, default: '' },
  taxRate: { type: Number, default: 0 },
  maxSaleLimit: { type: Number, default: 0 },
}, { timestamps: true })

export type SettingsDoc = {
  _id: string
  pharmacyName: string
  phone: string
  address: string
  email: string
  license: string
  billingFooter: string
  logoDataUrl?: string
  taxRate?: number
  maxSaleLimit?: number
}

export const Settings = models.Pharmacy_Settings || model('Pharmacy_Settings', SettingsSchema)
