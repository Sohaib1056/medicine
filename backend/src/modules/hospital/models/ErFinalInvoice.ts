import { Schema, model, models } from 'mongoose'

const LineItemSchema = new Schema({
  sr: { type: Number },
  description: { type: String },
  rate: { type: Number, default: 0 },
  qty: { type: Number, default: 1 },
  amount: { type: Number, default: 0 },
}, { _id: true })

const ErFinalInvoiceSchema = new Schema({
  tokenId: { type: Schema.Types.ObjectId, ref: 'Hospital_Token' },
  patientId: { type: Schema.Types.ObjectId, ref: 'Lab_Patient' },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Hospital_Doctor' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Hospital_Department' },
  // Invoice reference info
  refNo: { type: String },
  mrn: { type: String },
  patientName: { type: String },
  employeeName: { type: String },
  relationWithPatient: { type: String },
  bps: { type: String },
  designation: { type: String },
  employeeNo: { type: String },
  procedure: { type: String },
  dateOfAdmission: { type: String },
  dateOfDischarge: { type: String },
  dischargeTime: { type: String },
  daysOccupied: { type: Number, default: 0 },
  // Line items and totals
  lineItems: { type: [LineItemSchema], default: [] },
  totalAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalPayable: { type: Number, default: 0 },
  currency: { type: String, default: 'PKR' },
  // Metadata
  createdBy: { type: String },
}, { timestamps: true })

ErFinalInvoiceSchema.index({ tokenId: 1 }, { unique: true, sparse: true })
ErFinalInvoiceSchema.index({ mrn: 1 })
ErFinalInvoiceSchema.index({ refNo: 1 })

export type HospitalErFinalInvoiceDoc = {
  _id: string
  tokenId?: string
  patientId?: string
  doctorId?: string
  departmentId?: string
  refNo?: string
  mrn?: string
  patientName?: string
  employeeName?: string
  relationWithPatient?: string
  bps?: string
  designation?: string
  employeeNo?: string
  procedure?: string
  dateOfAdmission?: string
  dateOfDischarge?: string
  dischargeTime?: string
  daysOccupied?: number
  lineItems?: Array<{
    sr?: number
    description?: string
    rate?: number
    qty?: number
    amount?: number
  }>
  totalAmount?: number
  discount?: number
  totalPayable?: number
  currency?: string
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
}

export const HospitalErFinalInvoice = models.Hospital_ErFinalInvoice || model('Hospital_ErFinalInvoice', ErFinalInvoiceSchema)
