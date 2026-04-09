import type { Request, Response } from 'express'
import { PurchaseOrder } from '../models/PurchaseOrder'
import { InventoryItem } from '../models/InventoryItem'
import { PurchaseDraft } from '../models/PurchaseDraft'
import mongoose from 'mongoose'

// GET /pharmacy/purchase-orders
export async function list(req: Request, res: Response) {
  try {
    const { status, supplierId, companyId, from, to, search, page = '1', limit = '20' } = req.query
    
    const filter: any = {}
    
    if (status) filter.status = status
    if (supplierId) filter.supplierId = supplierId
    if (companyId) filter.companyId = companyId
    
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = from
      if (to) filter.date.$lte = to
    }
    
    if (search) {
      filter.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } },
      ]
    }
    
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20))
    const skip = (pageNum - 1) * limitNum
    
    const [items, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PurchaseOrder.countDocuments(filter),
    ])
    
    return res.json({
      items: items.map((it: any) => ({ ...it, id: it._id?.toString?.() || it._id })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to list purchase orders' })
  }
}

// GET /pharmacy/purchase-orders/:id
export async function getOne(req: Request, res: Response) {
  try {
    const { id } = req.params
    const doc = await PurchaseOrder.findById(id).lean()
    if (!doc) return res.status(404).json({ error: 'Purchase order not found' })
    return res.json({ ...doc, id: doc._id?.toString?.() || doc._id })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to get purchase order' })
  }
}

// POST /pharmacy/purchase-orders
export async function create(req: Request, res: Response) {
  try {
    const body = req.body || {}
    
    // Calculate totals
    const items = body.items || []
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + ((item.estimatedUnitPrice || 0) * (item.quantity || 0)), 0)
    const taxPercent = body.taxPercent || 0
    const taxAmount = (subtotal * taxPercent) / 100
    const shippingCost = body.shippingCost || 0
    const discount = body.discount || 0
    const total = subtotal + taxAmount + shippingCost - discount
    
    const doc = await PurchaseOrder.create({
      ...body,
      subtotal,
      taxAmount,
      total,
      status: body.status || 'draft',
    })
    
    return res.status(201).json({ 
      success: true, 
      id: doc._id?.toString?.() || doc._id,
      poNumber: doc.poNumber,
      doc: doc.toObject?.() || doc,
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to create purchase order' })
  }
}

// PUT /pharmacy/purchase-orders/:id
export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params
    const body = req.body || {}
    
    // Recalculate totals if items changed
    if (body.items) {
      const items = body.items
      const subtotal = items.reduce((sum: number, item: any) => 
        sum + ((item.estimatedUnitPrice || 0) * (item.quantity || 0)), 0)
      const taxPercent = body.taxPercent || 0
      const taxAmount = (subtotal * taxPercent) / 100
      const shippingCost = body.shippingCost || 0
      const discount = body.discount || 0
      body.subtotal = subtotal
      body.taxAmount = taxAmount
      body.total = subtotal + taxAmount + shippingCost - discount
    }
    
    const doc = await PurchaseOrder.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date().toISOString() },
      { new: true, runValidators: true }
    ).lean()
    
    if (!doc) return res.status(404).json({ error: 'Purchase order not found' })
    
    return res.json({ 
      success: true, 
      id: doc._id?.toString?.() || doc._id,
      doc: { ...doc, id: doc._id?.toString?.() || doc._id },
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to update purchase order' })
  }
}

// DELETE /pharmacy/purchase-orders/:id
export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    const doc = await PurchaseOrder.findByIdAndDelete(id)
    if (!doc) return res.status(404).json({ error: 'Purchase order not found' })
    return res.json({ success: true, id })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to delete purchase order' })
  }
}

// POST /pharmacy/purchase-orders/:id/send
export async function send(req: Request, res: Response) {
  try {
    const { id } = req.params
    const doc = await PurchaseOrder.findByIdAndUpdate(
      id,
      { status: 'sent', sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { new: true }
    ).lean()
    
    if (!doc) return res.status(404).json({ error: 'Purchase order not found' })
    return res.json({ success: true, id, status: doc.status })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to send purchase order' })
  }
}

// POST /pharmacy/purchase-orders/:id/confirm
export async function confirm(req: Request, res: Response) {
  try {
    const { id } = req.params
    const docRaw = await PurchaseOrder.findByIdAndUpdate(
      id,
      { status: 'confirmed', confirmedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { new: true }
    ).lean()
    if (!docRaw) return res.status(404).json({ error: 'Purchase order not found' })

    // Create a Pending Review draft for this PO (idempotent by invoice number)
    const po = docRaw as any
    const draftInvoice = `PO-${String(po.poNumber || po._id || id)}`
    const existingDraft = await PurchaseDraft.findOne({ invoice: draftInvoice }).lean()
    if (!existingDraft) {
      const lines: any[] = []
      for (const it of (po.items || [])) {
        const name = String(it.name || '').trim()
        if (!name) continue
        const key = name.toLowerCase()
        let inv: any = null
        if (it.inventoryItemId) {
          const iid = String(it.inventoryItemId)
          if (mongoose.isValidObjectId(iid)) {
            inv = await InventoryItem.findById(iid).lean()
          } else {
            inv = await InventoryItem.findOne({ $or: [{ key: iid.toLowerCase() }, { name: iid }] }).lean()
          }
        }
        if (!inv) inv = await InventoryItem.findOne({ key }).lean()
        const unitsPerPack = Number(inv?.unitsPerPack || 1)
        const packs = (String(it.unit || 'packs').toLowerCase() === 'packs') ? Number(it.quantity || 0) : 0
        const totalItems = (String(it.unit || 'packs').toLowerCase() !== 'packs') ? Number(it.quantity || 0) : undefined
        const orderedUnits = (totalItems != null && totalItems > 0) ? totalItems : (packs * (unitsPerPack || 1))
        lines.push({
          name,
          genericName: it.genericName || inv?.genericName || undefined,
          category: it.category || inv?.category || undefined,
          unitsPerPack: unitsPerPack || 1,
          packs,
          totalItems,
          orderedUnits,
          buyPerPack: 0,
          salePerPack: inv?.lastSalePerPack || 0,
          minStock: inv?.minStock != null ? inv.minStock : undefined,
        })
      }
      await PurchaseDraft.create({
        date: po.expectedDeliveryDate || po.date || new Date().toISOString().slice(0,10),
        invoice: draftInvoice,
        sourceType: 'PO',
        sourceRef: po.poNumber || String(id),
        supplierId: po.supplierId || undefined,
        supplierName: po.supplierName || undefined,
        companyId: po.companyId || undefined,
        companyName: po.companyName || undefined,
        invoiceTaxes: [],
        totals: { gross: 0, discount: 0, taxable: 0, lineTaxes: 0, invoiceTaxes: 0, net: 0 },
        lines,
      })
    }

    return res.json({ success: true, id, status: po.status })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to confirm purchase order' })
  }
}

// POST /pharmacy/purchase-orders/:id/receive
export async function receive(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { partially = false } = req.body || {}
    
    const status = partially ? 'partially_received' : 'received'
    const doc = await PurchaseOrder.findByIdAndUpdate(
      id,
      { status, receivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { new: true }
    ).lean()
    
    if (!doc) return res.status(404).json({ error: 'Purchase order not found' })
    return res.json({ success: true, id, status: doc.status })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to receive purchase order' })
  }
}

// POST /pharmacy/purchase-orders/:id/cancel
export async function cancel(req: Request, res: Response) {
  try {
    const { id } = req.params
    const doc = await PurchaseOrder.findByIdAndUpdate(
      id,
      { status: 'cancelled', updatedAt: new Date().toISOString() },
      { new: true }
    ).lean()
    
    if (!doc) return res.status(404).json({ error: 'Purchase order not found' })
    return res.json({ success: true, id, status: doc.status })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to cancel purchase order' })
  }
}

// GET /pharmacy/purchase-orders/inventory-suggestions
export async function inventorySuggestions(req: Request, res: Response) {
  try {
    const { q, limit = '20' } = req.query
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 20))
    
    const filter: any = {}
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { genericName: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ]
    }
    
    const items = await InventoryItem.find(filter)
      .sort({ name: 1 })
      .limit(limitNum)
      .select('key name genericName category unitsPerPack minStock onHand lastSalePerUnit')
      .lean()
    
    return res.json({
      items: items.map((it: any) => ({
        id: it.key,
        name: it.name,
        genericName: it.genericName,
        category: it.category,
        unitsPerPack: it.unitsPerPack,
        minStock: it.minStock,
        onHand: it.onHand,
        lastSalePrice: it.lastSalePerUnit,
      })),
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to get inventory suggestions' })
  }
}

// GET /pharmacy/purchase-orders/summary
export async function summary(req: Request, res: Response) {
  try {
    const { from, to, status } = req.query
    
    const match: any = {}
    if (from || to) {
      match.date = {}
      if (from) match.date.$gte = from
      if (to) match.date.$lte = to
    }
    if (status) match.status = status
    
    const [totalCount, statusCounts, totalValue] = await Promise.all([
      PurchaseOrder.countDocuments(match),
      PurchaseOrder.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ])
    
    const statusMap: Record<string, number> = {}
    statusCounts.forEach((s: any) => { statusMap[s._id] = s.count })
    
    return res.json({
      totalCount,
      totalValue: totalValue[0]?.total || 0,
      byStatus: statusMap,
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to get summary' })
  }
}
