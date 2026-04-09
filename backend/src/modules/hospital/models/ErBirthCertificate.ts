import { Schema, model, models } from 'mongoose'

const ErBirthCertificateSchema = new Schema({
  tokenId: { type: Schema.Types.ObjectId, ref: 'Hospital_Token' },
  patientId: { type: Schema.Types.ObjectId, ref: 'Lab_Patient' },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Hospital_Doctor' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Hospital_Department' },
  // Serial number (auto-generated)
  srNo: { type: String },
  bcSerialNo: { type: String },
  // Mother/Father info
  motherName: { type: String },
  fatherName: { type: String },
  mrNumber: { type: String },
  phone: { type: String },
  address: { type: String },
  // Baby info
  babyName: { type: String },
  sexOfBaby: { type: String },
  dateOfBirth: { type: Date },
  timeOfBirth: { type: String },
  deliveryType: { type: String },
  deliveryMode: { type: String },
  conditionAtBirth: { type: String },
  weightAtBirth: { type: String },
  bloodGroup: { type: String },
  birthMark: { type: String },
  congenitalAbnormality: { type: String },
  babyHandedOverTo: { type: String },
  notes: { type: String },
  parentSignature: { type: String },
  doctorSignature: { type: String },
  createdBy: { type: String },
}, { timestamps: true })

ErBirthCertificateSchema.index({ tokenId: 1 }, { unique: true, sparse: true })
ErBirthCertificateSchema.index({ srNo: 1 })

export type HospitalErBirthCertificateDoc = {
  _id: string
  tokenId?: string
  patientId?: string
  doctorId?: string
  departmentId?: string
  srNo?: string
  bcSerialNo?: string
  motherName?: string
  fatherName?: string
  mrNumber?: string
  phone?: string
  address?: string
  babyName?: string
  sexOfBaby?: string
  dateOfBirth?: Date
  timeOfBirth?: string
  deliveryType?: string
  deliveryMode?: string
  conditionAtBirth?: string
  weightAtBirth?: string
  bloodGroup?: string
  birthMark?: string
  congenitalAbnormality?: string
  babyHandedOverTo?: string
  notes?: string
  parentSignature?: string
  doctorSignature?: string
  createdBy?: string
}

export const HospitalErBirthCertificate = models.Hospital_ErBirthCertificate || model('Hospital_ErBirthCertificate', ErBirthCertificateSchema)
