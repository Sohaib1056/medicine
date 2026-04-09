import { Request, Response } from 'express'
import { Purchase } from '../models/Purchase'
import { PurchaseDraft } from '../models/PurchaseDraft'
import { InventoryItem } from '../models/InventoryItem'
import { purchaseCreateSchema, purchaseQuerySchema } from '../validators/purchase'
import { AuditLog } from '../models/AuditLog'

export async function list(req: Request, res: Response) {
  const parsed = purchaseQuerySchema.safeParse(req.query)
  const { from, to, search, page, limit } = parsed.success ? parsed.data as any : {}
  const filter: any = {}
  if (from || to) {
    filter.date = {}
    if (from) filter.date.$gte = from
    if (to) filter.date.$lte = to
  }
  if (search) {
    const rx = new RegExp(search, 'i')
    filter.$or = [{ invoice: rx }, { supplierName: rx }, { 'lines.name': rx }]
  }
  const effectiveLimit = Number(limit || 10)
  const currentPage = Math.max(1, Number(page || 1))
  const skip = (currentPage - 1) * effectiveLimit
  const total = await Purchase.countDocuments(filter)
  const items = await Purchase.find(filter).sort({ date: -1, invoice: -1 }).skip(skip).limit(effectiveLimit).lean()
  const totalPages = Math.max(1, Math.ceil(total / effectiveLimit))
  res.json({ items, total, page: currentPage, totalPages })
}

export async function create(req: Request, res: Response) {
  console.log('[DEBUG] create purchase - body:', JSON.stringify(req.body, null, 2))
  try {
    const data = purchaseCreateSchema.parse(req.body)
    console.log('[DEBUG] parsed data:', JSON.stringify(data, null, 2))
    const lines = data.lines.map(l => {
      const unitsPerPack = l.unitsPerPack || 1
      const packs = l.packs || 0
      const buyPerPack = l.buyPerPack || 0
      const salePerPack = l.salePerPack || 0

      const totalItems = l.totalItems || unitsPerPack * packs
      const buyPerUnit = l.buyPerUnit || (unitsPerPack ? (buyPerPack / unitsPerPack) : 0)
      const salePerUnit = l.salePerUnit || (unitsPerPack ? (salePerPack / unitsPerPack) : 0)

      // Legacy clients sometimes send only `lineTaxValue` without `lineTaxType`.
      // Treat missing type as a fixed amount per pack (backward-compatible).
      const lineTaxType = (l as any).lineTaxType as ('percent' | 'fixed' | undefined)
      const lineTaxValue = Number((l as any).lineTaxValue || 0)
      let buyPerPackAfterTax = buyPerPack
      if (lineTaxValue > 0) {
        if (lineTaxType === 'percent') buyPerPackAfterTax = buyPerPack + (buyPerPack * lineTaxValue) / 100
        else buyPerPackAfterTax = buyPerPack + lineTaxValue
      }
      const buyPerUnitAfterTax = unitsPerPack ? (buyPerPackAfterTax / unitsPerPack) : 0

      return {
        ...(l as any),
        unitsPerPack,
        packs,
        totalItems,
        buyPerUnit,
        salePerUnit,
        lineTaxType,
        lineTaxValue: lineTaxValue || undefined,
        buyPerPackAfterTax: Number(buyPerPackAfterTax.toFixed(6)),
        buyPerUnitAfterTax: Number(buyPerUnitAfterTax.toFixed(6)),
      }
    })

    const gross = lines.reduce((s, l: any) => s + (Number(l.buyPerPack || 0) * Number(l.packs || 0)), 0)
    const lineTaxes = lines.reduce((s, l: any) => {
      const packs = Number(l.packs || 0)
      const buyPerPack = Number(l.buyPerPack || 0)
      const buyPerPackAfterTax = Number(l.buyPerPackAfterTax || buyPerPack)
      return s + (buyPerPackAfterTax - buyPerPack) * packs
    }, 0)

    const totalAmount = gross
    const doc = await PurchaseDraft.create({
      date: data.date,
      invoice: data.invoice,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      companyId: (data as any).companyId,
      companyName: (data as any).companyName,
      totals: {
        gross: Number(gross.toFixed(2)),
        discount: 0,
        taxable: Number(gross.toFixed(2)),
        lineTaxes: Number(lineTaxes.toFixed(2)),
        invoiceTaxes: 0,
        net: Number((gross + lineTaxes).toFixed(2)),
      },
      lines,
    })
    console.log('[DEBUG] created draft doc:', doc._id, JSON.stringify(doc.toObject(), null, 2))

    res.status(201).json(doc)
  } catch (err) {
    console.error('[DEBUG] create purchase error:', err)
    throw err
  }
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params
  await Purchase.findByIdAndDelete(id)
  res.json({ ok: true })
}

export async function summary(req: Request, res: Response) {
  const parsed = purchaseQuerySchema.safeParse(req.query)
  const { from, to } = parsed.success ? parsed.data : {}
  const match: any = {}
  if (from || to) {
    match.date = {}
    if (from) match.date.$gte = from
    if (to) match.date.$lte = to
  }
  const agg = await Purchase.aggregate([
    { $match: match },
    { $group: { _id: null, totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } }, count: { $sum: 1 } } }
  ])
  const totalAmount = agg[0]?.totalAmount || 0
  const count = agg[0]?.count || 0
  res.json({ totalAmount: Number(totalAmount.toFixed(2)), count })
}
