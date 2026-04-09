import { Schema, model, models } from 'mongoose'

const ErShortStaySchema = new Schema({
  tokenId: { type: Schema.Types.ObjectId, ref: 'Hospital_Token', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Lab_Patient' },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Hospital_Doctor' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Hospital_Department' },
  admittedAt: { type: Date },
  dischargedAt: { type: Date },
  data: { type: Schema.Types.Mixed },
  notes: { type: String },
  createdBy: { type: String },
}, { timestamps: true })

ErShortStaySchema.index({ tokenId: 1 }, { unique: true })

export type HospitalErShortStayDoc = {
  _id: string
  tokenId: string
  patientId?: string
  doctorId?: string
  departmentId?: string
  admittedAt?: Date
  dischargedAt?: Date
  data?: any
  notes?: string
  createdBy?: string
}

export const HospitalErShortStay = models.Hospital_ErShortStay || model('Hospital_ErShortStay', ErShortStaySchema)
