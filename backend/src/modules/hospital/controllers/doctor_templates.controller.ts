import { Request, Response } from 'express'
import { HospitalDoctorTemplate } from '../models/DoctorTemplate'

export async function list(req: Request, res: Response) {
  try {
    const doctorId = (req.params.doctorId || req.query.doctorId || '').toString()
    const q = (req.query.q || '').toString().trim().toLowerCase()
    const page = Math.max(1, parseInt((req.query.page || '1').toString(), 10))
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit || '50').toString(), 10)))
    const filter: any = {}
    if (doctorId) filter.doctorId = doctorId
    if (q) filter.name = { $regex: q, $options: 'i' }
    const rows = await HospitalDoctorTemplate.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean()
    res.json({ templates: rows })
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to list templates' })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const doctorId = (req.params.doctorId || req.body.doctorId || '').toString()
    const name = (req.body?.name || '').toString().trim()
    const data = req.body?.data ?? {}
    if (!doctorId) return res.status(400).json({ message: 'doctorId required' })
    if (!name) return res.status(400).json({ message: 'name required' })
    const dup = await HospitalDoctorTemplate.findOne({ doctorId, name }).lean()
    if (dup) return res.status(409).json({ message: 'Template already exists' })
    const row = await HospitalDoctorTemplate.create({ doctorId, name, data })
    res.status(201).json(row)
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to create template' })
  }
}

export async function update(req: Request, res: Response) {
  try {
    const doctorId = (req.params.doctorId || req.body.doctorId || '').toString()
    const id = (req.params.id || '').toString()
    const patch: any = {}
    if (req.body?.name != null) {
      patch.name = (req.body.name || '').toString().trim()
      if (!patch.name) return res.status(400).json({ message: 'name required' })
      const dup = await HospitalDoctorTemplate.findOne({ doctorId, name: patch.name, _id: { $ne: id } }).lean()
      if (dup) return res.status(409).json({ message: 'Template already exists' })
    }
    if (req.body?.data != null) patch.data = req.body.data
    const row = await HospitalDoctorTemplate.findByIdAndUpdate(id, { $set: patch }, { new: true })
    if (!row) return res.status(404).json({ message: 'Template not found' })
    res.json(row)
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to update template' })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = (req.params.id || '').toString()
    await HospitalDoctorTemplate.findByIdAndDelete(id)
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Failed to delete template' })
  }
}
