import { Schema, model, models } from 'mongoose'

const ErReceivedDeathSchema = new Schema({
  tokenId: { type: Schema.Types.ObjectId, ref: 'Hospital_Token', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Lab_Patient' },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Hospital_Doctor' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Hospital_Department' },
  srNo: { type: String },
  patientCnic: { type: String },
  relative: { type: String },
  ageSex: { type: String },
  emergencyReportedDate: { type: Date },
  emergencyReportedTime: { type: String },
  receiving: {
    pulse: { type: String },
    bloodPressure: { type: String },
    respiratoryRate: { type: String },
    pupils: { type: String },
    cornealReflex: { type: String },
    ecg: { type: String },
  },
  diagnosis: { type: String },
  attendantName: { type: String },
  attendantRelative: { type: String },
  attendantRelation: { type: String },
  attendantAddress: { type: String },
  attendantCnic: { type: String },
  deathDeclaredBy: { type: String },
  chargeNurseName: { type: String },
  doctorName: { type: String },
  createdBy: { type: String },
}, { timestamps: true })

ErReceivedDeathSchema.index({ tokenId: 1 }, { unique: true })
ErReceivedDeathSchema.index({ srNo: 1 })

export type HospitalErReceivedDeathDoc = {
  _id: string
  tokenId: string
  patientId: string
  doctorId?: string
  departmentId?: string
  srNo?: string
  patientCnic?: string
  relative?: string
  ageSex?: string
  emergencyReportedDate?: Date
  emergencyReportedTime?: string
  receiving?: {
    pulse?: string
    bloodPressure?: string
    respiratoryRate?: string
    pupils?: string
    cornealReflex?: string
    ecg?: string
  }
  diagnosis?: string
  attendantName?: string
  attendantRelative?: string
  attendantRelation?: string
  attendantAddress?: string
  attendantCnic?: string
  deathDeclaredBy?: string
  chargeNurseName?: string
  doctorName?: string
  createdBy?: string
}

export const HospitalErReceivedDeath = models.Hospital_ErReceivedDeath || model('Hospital_ErReceivedDeath', ErReceivedDeathSchema)
