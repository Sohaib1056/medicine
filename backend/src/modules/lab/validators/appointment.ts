import { z } from 'zod'

export const createAppointmentSchema = z.object({
  dateIso: z.string().min(10).optional(),
  appointmentDate: z.string().min(10).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  priority: z.enum(['Normal','Urgent']).optional(),
  tests: z.array(z.string().min(1)).min(1),
  // patient linkage optional
  patientId: z.string().optional(),
  mrn: z.string().optional(),
  patientName: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  age: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((val, ctx) => {
  const d = String(val.dateIso || val.appointmentDate || '').trim()
  if (!d) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'dateIso is required' })
  }
})

export const updateAppointmentSchema = z.object({
  dateIso: z.string().min(10).optional(),
  appointmentDate: z.string().min(10).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  priority: z.enum(['Normal','Urgent']).optional(),
  tests: z.array(z.string().min(1)).min(1).optional(),
  patientName: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  age: z.string().optional(),
  notes: z.string().optional(),
})

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['booked','confirmed','cancelled']),
})

export const listAppointmentsSchema = z.object({
  date: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.enum(['booked','confirmed','cancelled','converted']).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
})
