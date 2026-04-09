import { Schema, model, models } from 'mongoose'

const DoctorTemplateSchema = new Schema({
  doctorId: { type: Schema.Types.ObjectId, ref: 'Hospital_Doctor', required: true, index: true },
  name: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
}, { timestamps: true })

DoctorTemplateSchema.index({ doctorId: 1, name: 1 }, { unique: true })

export type HospitalDoctorTemplateDoc = {
  _id: string
  doctorId: string
  name: string
  data?: any
  createdAt?: Date
  updatedAt?: Date
}

export const HospitalDoctorTemplate = models.Hospital_DoctorTemplate || model('Hospital_DoctorTemplate', DoctorTemplateSchema)
