import { Request, Response } from 'express'
import { InventoryItem } from '../models/InventoryItem'
import { AuditLog } from '../models/AuditLog'

export async function create(req: Request, res: Response) {
  const {
    name,
    genericName,
    manufacturer,
    category,
    brand,
    unitType,
    shelfNumber,
    barcode,
    narcotic,
    unitsPerPack,
    minStock,
    onHand,
    salePerUnit,
    image,
    description,
  } = req.body || {}

  // Validate required fields
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Medicine name is required' })
  }

  // Normalize name to key
  const key = String(name).trim().toLowerCase()

  // Check for duplicate
  const existing = await InventoryItem.findOne({ key })
  if (existing) {
    return res.status(400).json({ 
      error: 'An item with this name already exists (case-insensitive)' 
    })
  }

  // Validate numeric fields
  const unitsPerPackNum = Number(unitsPerPack) || 1
  if (unitsPerPackNum < 1) {
    return res.status(400).json({ error: 'Units per pack must be at least 1' })
  }

  const onHandNum = Number(onHand) || 0
  if (onHandNum < 0) {
    return res.status(400).json({ error: 'Initial stock cannot be negative' })
  }

  // Create item
  const item = new InventoryItem({
    key,
    name: String(name).trim(),
    genericName: genericName ? String(genericName).trim() : undefined,
    manufacturer: manufacturer ? String(manufacturer).trim() : undefined,
    category: category ? String(category).trim() : undefined,
    brand: brand ? String(brand).trim() : undefined,
    unitType: unitType ? String(unitType).trim() : undefined,
    shelfNumber: shelfNumber ? String(shelfNumber).trim() : undefined,
    barcode: barcode ? String(barcode).trim() : undefined,
    narcotic: Boolean(narcotic),
    unitsPerPack: unitsPerPackNum,
    onHand: onHandNum,
    minStock: minStock ? Number(minStock) : undefined,
    lastSalePerUnit: salePerUnit ? Number(salePerUnit) : 0,
    avgCostPerUnit: 0,
    image: image ? String(image).trim() : undefined,
    description: description ? String(description).trim() : undefined,
  })

  try {
    await item.save()
  } catch (err: any) {
    return res.status(400).json({ 
      error: err?.message || 'Failed to create item' 
    })
  }

  // Create audit log
  try {
    const actor = (req as any).user?.name || (req as any).user?.email || 'system'
    await AuditLog.create({
      actor,
      action: 'Create Inventory Item',
      label: 'CREATE_INVENTORY',
      method: 'POST',
      path: req.originalUrl,
      at: new Date().toISOString(),
      detail: `${item.name} — key:${item.key}`,
    })
  } catch {}

  res.status(201).json({ 
    ok: true, 
    item: {
      _id: item._id,
      key: item.key,
      name: item.name,
      onHand: item.onHand,
    }
  })
}

export async function list(req: Request, res: Response){
  const search = (req.query.search as string) || ''
  const limit = Number(req.query.limit || 10)
  const page = Math.max(1, Number((req.query.page as any) || 1))
  const filter: any = {}
  if (search){
    // Escape special regex characters to prevent invalid RegExp errors
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp(escaped, 'i')
    filter.$or = [
      { name: rx }, 
      { category: rx }, 
      { genericName: rx }, 
      { manufacturer: rx },
      { lastGenericName: rx },
      { brand: rx },
      { lastBrand: rx }
    ]
  }
  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    InventoryItem.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    InventoryItem.countDocuments(filter),
  ])
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)))
  res.json({ items, total, page, totalPages })
}

export async function listFiltered(req: Request, res: Response){
  const search = (req.query.search as string) || ''
  const status = String(req.query.status || '').toLowerCase() // 'low' | 'out' | 'expiring'
  const limit = Math.max(1, Number(req.query.limit || 100))
  const page = Math.max(1, Number((req.query.page as any) || 1))
  const skip = (page - 1) * limit

  if (!['low','out','expiring'].includes(status)){
    return res.status(400).json({ error: 'Invalid status' })
  }

  const nameFilter: any = {}
  if (search){
    const rx = new RegExp(search, 'i')
    nameFilter.$or = [
      { name: rx }, 
      { category: rx }, 
      { genericName: rx }, 
      { manufacturer: rx },
      { lastGenericName: rx },
      { brand: rx },
      { lastBrand: rx }
    ]
  }

  // Build base query
  let query: any = nameFilter
  let sort: any = { name: 1 }

  if (status === 'out'){
    query = { ...nameFilter, onHand: { $lte: 0 } }
  } else if (status === 'low'){
    // onHand > 0 AND onHand < minStock AND minStock != null
    query = {
      ...nameFilter,
      $expr: {
        $and: [
          { $gt: ['$onHand', 0] },
          { $ne: ['$minStock', null] },
          { $lt: ['$onHand', '$minStock'] },
        ]
      }
    }
  } else if (status === 'expiring'){
    const now = new Date()
    const soon = new Date(now.getTime() + 30*24*60*60*1000)
    const soonStr = soon.toISOString().slice(0,10)
    // earliestExpiry is stored as yyyy-mm-dd string; lexical compare works
    query = { ...nameFilter, earliestExpiry: { $lte: soonStr } }
    sort = { earliestExpiry: 1, name: 1 }
  }

  const [items, total] = await Promise.all([
    InventoryItem.find(query).sort(sort).skip(skip).limit(limit).lean(),
    InventoryItem.countDocuments(query),
  ])
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)))
  res.json({ items, total, page, totalPages })
}

export async function listManufacturers(req: Request, res: Response){
  try {
    const manufacturers = await InventoryItem.distinct('manufacturer', { manufacturer: { $nin: [null, ''], $exists: true } })
    res.json(manufacturers.sort())
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function summary(req: Request, res: Response){
  const search = (req.query.search as string) || ''
  const limit = Number(req.query.limit || 500)

  function parseDate(s?: string){
    if (!s) return undefined as Date | undefined
    const d = new Date(s)
    return isNaN(d.getTime()) ? undefined : d
  }

  const filter: any = {}
  if (search){
    // Escape special regex characters to prevent invalid RegExp errors
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp(escaped, 'i')
    filter.$or = [
      { name: rx }, 
      { category: rx }, 
      { genericName: rx }, 
      { manufacturer: rx },
      { lastGenericName: rx },
      { brand: rx },
      { lastBrand: rx }
    ]
  }
  // Use current inventory collection for accurate onHand and pricing
  const allItems = await InventoryItem.find(filter).lean()
  const now = new Date()
  const soon = new Date(now.getTime() + 30*24*60*60*1000)
  const soonStr = soon.toISOString().slice(0,10)
  const stockSaleValue = allItems.reduce((s:any,it:any)=> s + (Number(it.onHand||0) * Number(it.lastSalePerUnit||0)), 0)
  const stockPurchaseValue = allItems.reduce((s:any,it:any)=> s + (Number(it.onHand||0) * Number(it.lastBuyPerUnit||0)), 0)
  // Counts via DB queries to exactly match filtered lists
  const [lowStockCount, outOfStockCount, expiringSoonCount] = await Promise.all([
    InventoryItem.countDocuments({ ...filter, $expr: { $and: [ { $gt: ['$onHand', 0] }, { $ne: ['$minStock', null] }, { $lt: ['$onHand', '$minStock'] } ] } }),
    InventoryItem.countDocuments({ ...filter, onHand: { $lte: 0 } }),
    InventoryItem.countDocuments({ ...filter, earliestExpiry: { $lte: soonStr } }),
  ])
  const totalInventoryOnHand = allItems.reduce((s:any,it:any)=> s + Number(it.onHand||0), 0)
  const distinctCount = allItems.length
  const expiringSoonItems = await InventoryItem.find({ ...filter, earliestExpiry: { $lte: soonStr } })
    .sort({ earliestExpiry: 1, name: 1 })
    .limit(50)
    .select({ name: 1, earliestExpiry: 1, onHand: 1 })
    .lean()
    .then((arr: any) => arr.map((it: any) => ({ name: it.name, earliestExpiry: it.earliestExpiry, onHand: it.onHand })))

  const items = (limit ? allItems.slice(0, limit) : allItems).map((it: any) => ({
    name: it.name,
    category: it.category,
    unitsPerPack: it.unitsPerPack,
    minStock: it.minStock,
    onHand: it.onHand,
    earliestExpiry: it.earliestExpiry,
    lastInvoice: it.lastInvoice,
    lastSupplier: it.lastSupplier,
    lastGenericName: it.genericName,
    manufacturer: it.manufacturer,
    lastSalePerUnit: it.lastSalePerUnit,
  }))

  res.json({
    items,
    stats: {
      stockSaleValue: Number(stockSaleValue.toFixed(2)),
      stockPurchaseValue: Number(stockPurchaseValue.toFixed(2)),
      lowStockCount,
      outOfStockCount,
      expiringSoonCount,
      totalInventoryOnHand: Number(totalInventoryOnHand),
      distinctCount,
    },
    expiringSoonItems,
  })
}

export async function remove(req: Request, res: Response){
  const { key } = req.params
  const norm = String(key || '').trim().toLowerCase()
  if (!norm) return res.status(400).json({ error: 'Key required' })
  const before: any = await InventoryItem.findOne({ key: norm }).lean()
  await InventoryItem.findOneAndDelete({ key: norm })
  try {
    const actor = (req as any).user?.name || (req as any).user?.email || 'system'
    await AuditLog.create({
      actor,
      action: 'Delete Inventory',
      label: 'DELETE_INVENTORY',
      method: 'DELETE',
      path: req.originalUrl,
      at: new Date().toISOString(),
      detail: `${before?.name || ''} — key:${norm}`,
    })
  } catch {}
  res.json({ ok: true })
}

export async function update(req: Request, res: Response){
  const { key } = req.params
  const norm = String(key || '').trim().toLowerCase()
  if (!norm) return res.status(400).json({ error: 'Key required' })

  const {
    name,
    genericName,
    manufacturer,
    category,
    brand,
    unitType,
    barcode,
    narcotic,
    unitsPerPack,
    minStock,
    maxPackAllow,
    onHand,
    shelfNumber,
    buyPerPack,
    buyPerUnit,
    salePerPack,
    salePerUnit,
    expiry,
    invoice,
    date,
    supplierId,
    supplierName,
    companyId,
    companyName,
    defaultDiscountPct,
    lineTaxType,
    lineTaxValue,
    image,
    description,
  } = (req.body || {})

  const doc = await InventoryItem.findOne({ key: norm })
  if (!doc) return res.status(404).json({ error: 'Item not found' })

  if (typeof name === 'string' && name.trim()){
    doc.name = name.trim()
    doc.key = name.trim().toLowerCase()
  }
  if (genericName !== undefined) doc.genericName = genericName || undefined
  if (manufacturer !== undefined) doc.manufacturer = manufacturer || undefined
  if (category !== undefined) doc.category = category || undefined
  if (brand !== undefined) doc.brand = brand || undefined
  if (unitType !== undefined) doc.unitType = unitType || undefined
  if (barcode !== undefined) doc.barcode = barcode || undefined
  if (narcotic !== undefined) doc.narcotic = Boolean(narcotic)
  if (unitsPerPack !== undefined) doc.unitsPerPack = Math.max(1, Number(unitsPerPack)||1)
  if (minStock !== undefined && minStock !== '') doc.minStock = Number(minStock)
  if (maxPackAllow !== undefined && maxPackAllow !== '') doc.maxPackAllow = Number(maxPackAllow)
  if (onHand !== undefined && onHand !== '') doc.onHand = Number(onHand)
  if (shelfNumber !== undefined) doc.shelfNumber = shelfNumber || undefined
  
  // Pricing fields
  if (buyPerPack !== undefined && buyPerPack !== '') {
    doc.lastBuyPerPack = Number(buyPerPack)
    if (doc.unitsPerPack && doc.unitsPerPack > 0) {
      doc.lastBuyPerUnit = Number((Number(buyPerPack) / doc.unitsPerPack).toFixed(6))
    }
  }
  if (buyPerUnit !== undefined && buyPerUnit !== '') {
    doc.lastBuyPerUnit = Number(buyPerUnit)
    if (doc.unitsPerPack && doc.unitsPerPack > 0) {
      doc.lastBuyPerPack = Number((Number(buyPerUnit) * doc.unitsPerPack).toFixed(6))
    }
  }
  if (salePerPack !== undefined && salePerPack !== '') {
    doc.lastSalePerPack = Number(salePerPack)
    if (doc.unitsPerPack && doc.unitsPerPack > 0) {
      doc.lastSalePerUnit = Number((Number(salePerPack) / doc.unitsPerPack).toFixed(6))
    }
  }
  if (salePerUnit !== undefined && salePerUnit !== ''){
    doc.lastSalePerUnit = Number(salePerUnit)
    if (doc.unitsPerPack && doc.unitsPerPack>0){
      doc.lastSalePerPack = Number((Number(salePerUnit) * doc.unitsPerPack).toFixed(6))
    }
  }
  
  if (invoice !== undefined) doc.lastInvoice = String(invoice||'')
  if (date !== undefined) doc.lastInvoiceDate = String(date||'')
  if (supplierId !== undefined) doc.lastSupplierId = supplierId || undefined
  if (supplierName !== undefined) doc.lastSupplier = supplierName || undefined
  if (companyId !== undefined) doc.lastCompanyId = companyId || undefined
  if (companyName !== undefined) doc.lastCompany = companyName || undefined
  if (defaultDiscountPct !== undefined && defaultDiscountPct !== '') doc.defaultDiscountPct = Math.max(0, Math.min(100, Number(defaultDiscountPct)))
  if (lineTaxType !== undefined) doc.lastLineTaxType = lineTaxType || undefined
  if (lineTaxValue !== undefined && lineTaxValue !== '') doc.lastLineTaxValue = Number(lineTaxValue)
  if (image !== undefined) doc.image = image || undefined
  if (description !== undefined) doc.description = description || undefined
  if (expiry){
    const e = String(expiry)
    doc.lastExpiry = e
    // maintain earliestExpiry as min
    const prev = doc.earliestExpiry ? new Date(doc.earliestExpiry) : undefined
    const cur = new Date(e)
    if (!prev || (cur < prev)) doc.earliestExpiry = e
  }

  try {
    await doc.save()
  } catch (err: any){
    return res.status(400).json({ error: err?.message || 'Update failed' })
  }
  try {
    const actor = (req as any).user?.name || (req as any).user?.email || 'system'
    await AuditLog.create({
      actor,
      action: 'Edit Inventory',
      label: 'EDIT_INVENTORY',
      method: 'PUT',
      path: req.originalUrl,
      at: new Date().toISOString(),
      detail: `${doc.name || ''} — key:${doc.key}`,
    })
  } catch {}
  res.json({ ok: true })
}

export async function adjust(req: Request, res: Response){
  const {
    name,
    key,
    physicalCount,
    systemCount,
    reason,
    note,
    datetime,
  } = (req.body || {})
  const resolvedKey = String((key || name || '')).trim().toLowerCase()
  if (!resolvedKey) return res.status(400).json({ error: 'Medicine name/key required' })
  const doc = await InventoryItem.findOne({ key: resolvedKey })
  if (!doc) return res.status(404).json({ error: 'Item not found' })
  const current = (systemCount != null && systemCount !== '') ? Number(systemCount) : Number(doc.onHand || 0)
  const physical = Number(physicalCount)
  if (isNaN(physical)) return res.status(400).json({ error: 'Physical count must be a number' })
  const delta = Number(physical) - Number(current)
  doc.onHand = Number(physical)
  try { await doc.save() } catch (e: any){ return res.status(400).json({ error: e?.message || 'Adjustment failed' }) }
  try {
    const actor = (req as any).user?.name || (req as any).user?.email || 'system'
    const ts = String(datetime || new Date().toISOString())
    const det = [
      `Item:${doc.name}`,
      `Old:${current}`,
      `New:${physical}`,
      `Delta:${delta}`,
      reason ? `Reason:${reason}` : '',
      note ? `Note:${note}` : '',
    ].filter(Boolean).join(' | ')
    await AuditLog.create({
      actor,
      action: 'Inventory Adjustment',
      label: 'INVENTORY_ADJUST',
      method: 'POST',
      path: req.originalUrl,
      at: ts,
      detail: det,
    })
  } catch {}
  res.json({ ok: true, item: { _id: doc._id, key: doc.key, name: doc.name, onHand: doc.onHand } })
}

export async function publicProducts(req: Request, res: Response){
  const search = (req.query.search as string) || ''
  const limit = Math.max(1, Math.min(500, Number(req.query.limit || 100)))
  const filter: any = { onHand: { $gt: 0 } }
  if (search){
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp(escaped, 'i')
    filter.$or = [
      { name: rx },
      { category: rx },
      { genericName: rx },
      { manufacturer: rx },
      { brand: rx }
    ]
  }
  const items = await InventoryItem.find(filter)
    .select({
      name: 1,
      category: 1,
      genericName: 1,
      manufacturer: 1,
      brand: 1,
      image: 1,
      description: 1,
      onHand: 1,
      lastSalePerUnit: 1,
      unitsPerPack: 1
    })
    .sort({ name: 1 })
    .limit(limit)
    .lean()
  res.json({ items })
}
