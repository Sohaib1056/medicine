import { Schema, model, models } from 'mongoose'

const ErDischargeSummarySchema = new Schema({
  tokenId: { type: Schema.Types.ObjectId, ref: 'Hospital_Token', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Lab_Patient' },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Hospital_Doctor' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Hospital_Department' },
  dischargeDate: { type: Date, default: Date.now },
  diagnosis: { type: String },
  courseInHospital: { type: String },
  procedures: [{ type: String }],
  conditionAtDischarge: { type: String },
  medications: [{ type: String }],
  advice: { type: String },
  followUpDate: { type: Date },
  notes: { type: String },
  createdBy: { type: String },
  printedAt: { type: Date },
}, { timestamps: true })

ErDischargeSummarySchema.index({ tokenId: 1 }, { unique: true })

export type HospitalErDischargeSummaryDoc = {
  _id: string
  tokenId: string
  patientId?: string
  doctorId?: string
  departmentId?: string
  dischargeDate?: Date
  diagnosis?: string
  courseInHospital?: string
  procedures?: string[]
  conditionAtDischarge?: string
  medications?: string[]
  advice?: string
  followUpDate?: Date
  notes?: string
  createdBy?: string
  printedAt?: Date
}

export const HospitalErDischargeSummary = models.Hospital_ER_Discharge_Summary || model('Hospital_ER_Discharge_Summary', ErDischargeSummarySchema, 'hospital_er_discharge_summary')
