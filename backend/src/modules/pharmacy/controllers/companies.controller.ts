import { Request, Response } from 'express'
import { Company } from '../models/Company'
import { Supplier } from '../models/Supplier'
import { InventoryItem } from '../models/InventoryItem'
import { companyCreateSchema, companyUpdateSchema, companyQuerySchema } from '../validators/company'
import { ApiError } from '../../../common/errors/ApiError'

export async function list(req: Request, res: Response){
  const parsed = companyQuerySchema.safeParse(req.query)
  const { q, distributorId, page, limit } = parsed.success ? parsed.data as any : {}
  const filter: any = {}
  if (q){ filter.name = { $regex: q, $options: 'i' } }
  if (distributorId){ filter.distributorId = distributorId }
  const effectiveLimit = Math.max(1, Math.min(500, Number(limit || 50)))
  const currentPage = Math.max(1, Number(page || 1))
  const skip = (currentPage - 1) * effectiveLimit
  const total = await Company.countDocuments(filter)
  const items = await Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(effectiveLimit).lean()
  // Hydrate distributorName for older records that may have distributorId but no distributorName
  try {
    const idsNeedingName = Array.from(new Set((items as any[])
      .filter(it => it && it.distributorId && !it.distributorName)
      .map(it => String(it.distributorId))))
    if (idsNeedingName.length){
      const sups = await Supplier.find({ _id: { $in: idsNeedingName } }, { name: 1 }).lean()
      const nameMap = new Map<string, string>(sups.map(s => [String((s as any)._id), String((s as any).name || '')]))
      for (const it of items as any[]){
        if (it && it.distributorId && !it.distributorName){
          const nm = nameMap.get(String(it.distributorId))
          if (nm) it.distributorName = nm
        }
      }
    }
  } catch {}
  const totalPages = Math.max(1, Math.ceil(total / effectiveLimit))
  res.json({ items, total, page: currentPage, totalPages })
}

export async function create(req: Request, res: Response){
  const data = companyCreateSchema.parse(req.body)
  const doc = await Company.create(data)
  res.status(201).json(doc)
}

export async function update(req: Request, res: Response){
  const id = req.params.id
  const data = companyUpdateSchema.parse(req.body)
  const updated = await Company.findByIdAndUpdate(id, data, { new: true })
  if (!updated) throw new ApiError(404, 'Company not found')
  res.json(updated)
}

export async function remove(req: Request, res: Response){
  const id = req.params.id
  const found = await Company.findByIdAndDelete(id)
  if (!found) throw new ApiError(404, 'Company not found')
  res.json({ ok: true })
}

// Supplier-bound helpers
export async function listForSupplier(req: Request, res: Response){
  const supplierId = String(req.params.id || '')
  if (!supplierId) throw new ApiError(400, 'Supplier id required')
  const items = await Company.find({ distributorId: supplierId }).sort({ name: 1 }).lean()
  res.json({ items })
}

export async function assignToSupplier(req: Request, res: Response){
  const supplierId = String(req.params.id || '')
  if (!supplierId) throw new ApiError(400, 'Supplier id required')
  const body = req.body || {}
  const assignIds: string[] = Array.isArray(body.companyIds) ? body.companyIds.map((x:any)=>String(x)) : []
  const unassignIds: string[] = Array.isArray(body.unassignIds) ? body.unassignIds.map((x:any)=>String(x)) : []
  // Assign
  if (assignIds.length){
    const sup = await Supplier.findById(supplierId).lean()
    // Get the names of the companies being assigned
    const companiesToAssign = await Company.find({ _id: { $in: assignIds } }).lean()
    const companyNamesToAssign = companiesToAssign.map((c: { name: string }) => c.name)

    // Assign companies to supplier
    await Company.updateMany(
      { _id: { $in: assignIds } },
      { $set: { distributorId: supplierId, distributorName: (sup as any)?.name || undefined } }
    )

    // Also update inventory items from these manufacturers (by name)
    if (companyNamesToAssign.length > 0 && sup) {
      await InventoryItem.updateMany(
        { manufacturer: { $in: companyNamesToAssign } }, // Match by manufacturer name
        { 
          $set: { 
            lastSupplier: (sup as any).name || '', // Set supplier Name
            lastSupplierId: supplierId // Set supplier ID
          } 
        } 
      )
    }
  }
  // Unassign from this supplier only
  if (unassignIds.length){
    // Get company names being unassigned to also clear inventory
    const companiesToUnassign = await Company.find({ _id: { $in: unassignIds } }).lean()
    const companyNamesToUnassign = companiesToUnassign.map((c: { name: string }) => c.name)

    await Company.updateMany(
      { _id: { $in: unassignIds }, distributorId: supplierId },
      { $unset: { distributorId: '', distributorName: '' } }
    )

    if (companyNamesToUnassign.length > 0) {
      // Clear supplier from inventory items of these manufacturers IF they are currently assigned to this supplier
      await InventoryItem.updateMany(
        { 
          manufacturer: { $in: companyNamesToUnassign },
          lastSupplierId: supplierId 
        },
        { 
          $unset: { lastSupplier: '', lastSupplierId: '' } 
        }
      )
    }
  }
  res.json({ ok: true })
}
