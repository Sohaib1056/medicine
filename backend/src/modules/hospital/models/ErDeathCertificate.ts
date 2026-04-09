import { Schema, model, models } from 'mongoose'

const ErDeathCertificateSchema = new Schema({
  tokenId: { type: Schema.Types.ObjectId, ref: 'Hospital_Token', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Lab_Patient' },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Hospital_Doctor' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Hospital_Department' },
  // Legacy fields
  dateOfDeath: { type: Date },
  timeOfDeath: { type: String },
  causeOfDeath: { type: String },
  placeOfDeath: { type: String },
  notes: { type: String },
  // New structured fields
  dcNo: { type: String },
  mrNumber: { type: String },
  relative: { type: String },
  ageSex: { type: String },
  address: { type: String },
  presentingComplaints: { type: String },
  diagnosis: { type: String },
  primaryCause: { type: String },
  secondaryCause: { type: String },
  receiverName: { type: String },
  receiverRelation: { type: String },
  receiverIdCard: { type: String },
  receiverDate: { type: Date },
  receiverTime: { type: String },
  staffName: { type: String },
  staffSignDate: { type: Date },
  staffSignTime: { type: String },
  doctorName: { type: String },
  doctorSignDate: { type: Date },
  doctorSignTime: { type: String },
  createdBy: { type: String },
}, { timestamps: true })

ErDeathCertificateSchema.index({ tokenId: 1 }, { unique: true })
ErDeathCertificateSchema.index({ dcNo: 1 })

export type HospitalErDeathCertificateDoc = {
  _id: string
  tokenId: string
  patientId: string
  doctorId?: string
  departmentId?: string
  dateOfDeath?: Date
  timeOfDeath?: string
  causeOfDeath?: string
  placeOfDeath?: string
  notes?: string
  dcNo?: string
  mrNumber?: string
  relative?: string
  ageSex?: string
  address?: string
  presentingComplaints?: string
  diagnosis?: string
  primaryCause?: string
  secondaryCause?: string
  receiverName?: string
  receiverRelation?: string
  receiverIdCard?: string
  receiverDate?: Date
  receiverTime?: string
  staffName?: string
  staffSignDate?: Date
  staffSignTime?: string
  doctorName?: string
  doctorSignDate?: Date
  doctorSignTime?: string
  createdBy?: string
}

export const HospitalErDeathCertificate = models.Hospital_ErDeathCertificate || model('Hospital_ErDeathCertificate', ErDeathCertificateSchema)
