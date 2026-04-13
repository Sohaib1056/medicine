import { Schema, model, models } from 'mongoose'

const CartItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  brand: { type: String },
  manufacturer: { type: String },
  category: { type: String },
  image: { type: String },
  form: { type: String },
  packSize: { type: String },
  requiresPrescription: { type: Boolean, default: false },
  originalPrice: { type: Number, required: true },
  finalPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 },
  stockAvailable: { type: Number, required: true },
  unitsPerPack: { type: Number, default: 1 },
})

const CartSchema = new Schema({
  sessionId: { type: String, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  items: [CartItemSchema],
  couponCode: { type: String },
  couponDiscount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { 
  timestamps: true,
  collection: 'website_carts' 
})

// Index for finding cart by session or user
CartSchema.index({ sessionId: 1, userId: 1 })

export type CartItemDoc = {
  productId: string
  name: string
  brand?: string
  manufacturer?: string
  category?: string
  image?: string
  form?: string
  packSize?: string
  requiresPrescription: boolean
  originalPrice: number
  finalPrice: number
  discountPercent: number
  quantity: number
  stockAvailable: number
  unitsPerPack: number
}

export type CartDoc = {
  _id: string
  sessionId?: string
  userId?: string
  items: CartItemDoc[]
  couponCode?: string
  couponDiscount: number
  createdAt: Date
  updatedAt: Date
}

export const Cart = (models.Website_Cart || model('Website_Cart', CartSchema)) as any
