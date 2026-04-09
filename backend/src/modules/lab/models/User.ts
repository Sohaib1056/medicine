import { Schema, model, models } from 'mongoose'

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  role: { type: String, default: 'admin' },
  passwordHash: { type: String, required: true },
  pmdcNumber: { type: String, default: '' },
  digitalSignatureDataUrl: { type: String, default: '' },
}, { timestamps: true })

export type LabUserDoc = {
  _id: string
  username: string
  role: string
  passwordHash: string
  pmdcNumber?: string
  digitalSignatureDataUrl?: string
}

export const LabUser = models.Lab_User || model('Lab_User', UserSchema)
