import { Schema, model, models } from 'mongoose'

const PurchaseOrderItemSchema = new Schema({
  inventoryItemId: { type: String },
  name: { type: String, required: true },
  genericName: { type: String },
  category: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: 'packs' },
  notes: { type: String },
  estimatedUnitPrice: { type: Number, default: 0 },
}, { _id: false })

const PurchaseOrderSchema = new Schema({
  poNumber: { type: String, unique: true, index: true },
  date: { type: String, required: true },
  expectedDeliveryDate: { type: String },
  
  // Supplier details
  supplierId: { type: String },
  supplierName: { type: String },
  supplierCustom: { type: String },
  
  // Company details
  companyId: { type: String },
  companyName: { type: String },
  companyCustom: { type: String },
  
  // Contact information
  contactPerson: { type: String },
  contactPhone: { type: String },
  contactEmail: { type: String },
  
  // Delivery/Shipping
  shippingAddress: { type: String },
  billingAddress: { type: String },
  
  // Order items
  items: { type: [PurchaseOrderItemSchema], default: [] },
  
  // Totals
  subtotal: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'], 
    default: 'draft',
    index: true 
  },
  
  // Notes
  notes: { type: String },
  terms: { type: String },
  
  // Metadata
  createdBy: { type: String },
  updatedBy: { type: String },
  sentAt: { type: String },
  confirmedAt: { type: String },
  receivedAt: { type: String },
}, { 
  timestamps: true, 
  collection: 'pharmacy_purchaseorders' 
})

// Generate PO number before saving
PurchaseOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.poNumber) {
    const date = new Date()
    const prefix = 'PO'
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const count = await (models.Pharmacy_PurchaseOrder?.countDocuments() || 0)
    this.poNumber = `${prefix}-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

export type PurchaseOrderItemDoc = {
  inventoryItemId?: string
  name: string
  genericName?: string
  category?: string
  quantity: number
  unit: string
  notes?: string
  estimatedUnitPrice?: number
}

export type PurchaseOrderDoc = {
  _id: string
  poNumber: string
  date: string
  expectedDeliveryDate?: string
  supplierId?: string
  supplierName?: string
  supplierCustom?: string
  companyId?: string
  companyName?: string
  companyCustom?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  shippingAddress?: string
  billingAddress?: string
  items: PurchaseOrderItemDoc[]
  subtotal: number
  taxPercent: number
  taxAmount: number
  shippingCost: number
  discount: number
  total: number
  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled'
  notes?: string
  terms?: string
  createdBy?: string
  updatedBy?: string
  sentAt?: string
  confirmedAt?: string
  receivedAt?: string
  createdAt?: string
  updatedAt?: string
}

export const PurchaseOrder = (models.Pharmacy_PurchaseOrder || model('Pharmacy_PurchaseOrder', PurchaseOrderSchema)) as any
