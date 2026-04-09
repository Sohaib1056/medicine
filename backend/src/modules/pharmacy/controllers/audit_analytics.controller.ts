import { Request, Response } from 'express'
import { Dispense } from '../models/Dispense'
import { Purchase } from '../models/Purchase'
import { Expense } from '../models/Expense'
import { InventoryItem } from '../models/InventoryItem'
import { AuditLog } from '../models/AuditLog'

// Helper to parse dates from query params
function parseDateRange(from?: string, to?: string) {
  const result: any = {}
  if (from) {
    result.$gte = new Date(from).toISOString()
  }
  if (to) {
    const hasTime = /T\d{2}:\d{2}/.test(String(to))
    const end = new Date(to)
    if (!hasTime) end.setHours(23, 59, 59, 999)
    result.$lte = end.toISOString()
  }
  return Object.keys(result).length > 0 ? result : undefined
}

// Helper to format date as YYYY-MM-DD
function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Get Monday of the week for a given date
function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 Sun ... 6 Sat
  const diff = day === 0 ? -6 : 1 - day // Monday as start
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * GET /pharmacy/audit/analytics
 * Returns comprehensive audit analytics including:
 * - Sales summary (total, profit, count)
 * - Purchases summary (total, count)
 * - Expenses summary (total, count)
 * - Inventory valuation (stock values)
 * - Weekly sales breakdown for charts
 * - Comparison data (sales vs purchases vs expenses)
 */
export async function getAnalytics(req: Request, res: Response) {
  try {
    const from = req.query.from as string | undefined
    const to = req.query.to as string | undefined
    const dateFilter = parseDateRange(from, to)

    // Build match filters
    const salesMatch: any = {}
    const purchasesMatch: any = {}
    const expensesMatch: any = {}

    if (dateFilter) {
      salesMatch.datetime = dateFilter
      // Purchases and Expenses use string date format (YYYY-MM-DD)
      // Extract date portion from ISO datetime strings for proper comparison
      const fromDate = from ? from.slice(0, 10) : undefined
      const toDate = to ? to.slice(0, 10) : undefined
      if (fromDate) purchasesMatch.date = { $gte: fromDate }
      if (toDate) purchasesMatch.date = { ...purchasesMatch.date, $lte: toDate }
      if (fromDate) expensesMatch.date = { $gte: fromDate }
      if (toDate) expensesMatch.date = { ...expensesMatch.date, $lte: toDate }
    }

    // Run all aggregations in parallel
    const [
      salesAgg,
      purchasesAgg,
      expensesAgg,
      inventoryStats,
      dailySalesAgg
    ] = await Promise.all([
      // Sales aggregation
      Dispense.aggregate([
        { $match: salesMatch },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: { $ifNull: ['$total', 0] } },
            totalProfit: { $sum: { $ifNull: ['$profit', 0] } },
            count: { $sum: 1 }
          }
        }
      ]),

      // Purchases aggregation
      Purchase.aggregate([
        { $match: purchasesMatch },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
            count: { $sum: 1 }
          }
        }
      ]),

      // Expenses aggregation
      Expense.aggregate([
        { $match: expensesMatch },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
            count: { $sum: 1 }
          }
        }
      ]),

      // Inventory stats
      InventoryItem.aggregate([
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalOnHand: { $sum: { $ifNull: ['$onHand', 0] } },
            stockPurchaseValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$onHand', 0] },
                  { $ifNull: ['$lastBuyPerUnit', 0] }
                ]
              }
            },
            stockSaleValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$onHand', 0] },
                  { $ifNull: ['$lastSalePerUnit', 0] }
                ]
              }
            }
          }
        }
      ]),

      // Daily sales for weekly aggregation
      dateFilter
        ? Dispense.aggregate([
            { $match: salesMatch },
            {
              $group: {
                _id: { $substr: ['$datetime', 0, 10] },
                value: { $sum: { $ifNull: ['$total', 0] } }
              }
            },
            { $sort: { _id: 1 } }
          ])
        : Promise.resolve([])
    ])

    // Calculate weekly sales from daily data
    let weeklySales: Array<{ week: string; value: number }> = []
    if (from && to && dailySalesAgg.length > 0) {
      const dayMap = new Map<string, number>()
      for (const day of dailySalesAgg) {
        dayMap.set(day._id, day.value)
      }

      const start = new Date(from)
      const end = new Date(to)
      const firstWeek = weekStart(start)

      for (let wk = new Date(firstWeek); wk <= end; wk.setDate(wk.getDate() + 7)) {
        const weekKey = fmtDate(wk)
        let sum = 0
        for (let i = 0; i < 7; i++) {
          const d = new Date(wk)
          d.setDate(d.getDate() + i)
          if (d > end) break
          const k = fmtDate(d)
          sum += dayMap.get(k) || 0
        }
        weeklySales.push({ week: weekKey, value: Number(sum.toFixed(2)) })
      }
    }

    // Extract values from aggregations
    const sales = salesAgg[0] || { totalAmount: 0, totalProfit: 0, count: 0 }
    const purchases = purchasesAgg[0] || { totalAmount: 0, count: 0 }
    const expenses = expensesAgg[0] || { totalAmount: 0, count: 0 }
    const inventory = inventoryStats[0] || {
      totalItems: 0,
      totalOnHand: 0,
      stockPurchaseValue: 0,
      stockSaleValue: 0
    }

    // Calculate net profit
    const netProfit = (sales.totalProfit || 0) - (expenses.totalAmount || 0)

    // Comparison data for charts
    const comparison = [
      { label: 'Sales', value: sales.totalAmount || 0, color: '#22c55e' },
      { label: 'Purchases', value: purchases.totalAmount || 0, color: '#a855f7' },
      { label: 'Expenses', value: expenses.totalAmount || 0, color: '#fb7185' }
    ]

    // Trend data (if date range spans multiple days)
    let trend: Array<{ date: string; sales: number; purchases: number; expenses: number }> = []
    if (dateFilter) {
      const [dailyPurchases, dailyExpenses] = await Promise.all([
        Purchase.aggregate([
          { $match: purchasesMatch },
          {
            $group: {
              _id: { $substr: ['$date', 0, 10] },
              value: { $sum: { $ifNull: ['$totalAmount', 0] } }
            }
          }
        ]),
        Expense.aggregate([
          { $match: expensesMatch },
          {
            $group: {
              _id: { $substr: ['$date', 0, 10] },
              value: { $sum: { $ifNull: ['$amount', 0] } }
            }
          }
        ])
      ])

      const purchasesMap = new Map<string, number>(dailyPurchases.map((d: any) => [d._id, d.value]))
      const expensesMap = new Map<string, number>(dailyExpenses.map((d: any) => [d._id, d.value]))
      const salesMap = new Map<string, number>(dailySalesAgg.map((d: any) => [d._id, d.value]))

      // Get all unique dates
      const allDates = new Set([
        ...salesMap.keys(),
        ...purchasesMap.keys(),
        ...expensesMap.keys()
      ])

      trend = Array.from(allDates)
        .sort()
        .map(date => ({
          date,
          sales: salesMap.get(date) || 0,
          purchases: purchasesMap.get(date) || 0,
          expenses: expensesMap.get(date) || 0
        }))
    }

    res.json({
      summary: {
        sales: {
          total: Number((sales.totalAmount || 0).toFixed(2)),
          profit: Number((sales.totalProfit || 0).toFixed(2)),
          count: sales.count || 0
        },
        purchases: {
          total: Number((purchases.totalAmount || 0).toFixed(2)),
          count: purchases.count || 0
        },
        expenses: {
          total: Number((expenses.totalAmount || 0).toFixed(2)),
          count: expenses.count || 0
        },
        netProfit: Number(netProfit.toFixed(2)),
        inventory: {
          totalItems: inventory.totalItems || 0,
          totalOnHand: inventory.totalOnHand || 0,
          stockPurchaseValue: Number((inventory.stockPurchaseValue || 0).toFixed(2)),
          stockSaleValue: Number((inventory.stockSaleValue || 0).toFixed(2))
        }
      },
      weeklySales,
      comparison,
      trend,
      period: { from, to }
    })
  } catch (error: any) {
    console.error('Audit analytics error:', error)
    res.status(500).json({ error: error?.message || 'Failed to fetch audit analytics' })
  }
}

/**
 * GET /pharmacy/audit/top-items
 * Returns top selling items and most profitable items for the period
 */
export async function getTopItems(req: Request, res: Response) {
  try {
    const from = req.query.from as string | undefined
    const to = req.query.to as string | undefined
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)))
    const dateFilter = parseDateRange(from, to)

    const match: any = {}
    if (dateFilter) match.datetime = dateFilter

    // Aggregate sales lines to find top items by quantity and profit
    const topByQuantity = await Dispense.aggregate([
      { $match: match },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.name',
          totalQty: { $sum: { $ifNull: ['$lines.qty', 0] } },
          totalRevenue: {
            $sum: {
              $multiply: [
                { $ifNull: ['$lines.qty', 0] },
                { $ifNull: ['$lines.unitPrice', 0] }
              ]
            }
          },
          totalProfit: {
            $sum: {
              $multiply: [
                { $ifNull: ['$lines.qty', 0] },
                { $subtract: [{ $ifNull: ['$lines.unitPrice', 0] }, { $ifNull: ['$lines.costPerUnit', 0] }] }
              ]
            }
          }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: limit }
    ])

    const topByProfit = await Dispense.aggregate([
      { $match: match },
      { $unwind: '$lines' },
      {
        $group: {
          _id: '$lines.name',
          totalQty: { $sum: { $ifNull: ['$lines.qty', 0] } },
          totalRevenue: {
            $sum: {
              $multiply: [
                { $ifNull: ['$lines.qty', 0] },
                { $ifNull: ['$lines.unitPrice', 0] }
              ]
            }
          },
          totalProfit: {
            $sum: {
              $multiply: [
                { $ifNull: ['$lines.qty', 0] },
                { $subtract: [{ $ifNull: ['$lines.unitPrice', 0] }, { $ifNull: ['$lines.costPerUnit', 0] }] }
              ]
            }
          }
        }
      },
      { $sort: { totalProfit: -1 } },
      { $limit: limit }
    ])

    res.json({
      byQuantity: topByQuantity.map((item: any) => ({
        name: item._id,
        quantity: item.totalQty,
        revenue: Number(item.totalRevenue.toFixed(2)),
        profit: Number(item.totalProfit.toFixed(2))
      })),
      byProfit: topByProfit.map((item: any) => ({
        name: item._id,
        quantity: item.totalQty,
        revenue: Number(item.totalRevenue.toFixed(2)),
        profit: Number(item.totalProfit.toFixed(2))
      }))
    })
  } catch (error: any) {
    console.error('Top items error:', error)
    res.status(500).json({ error: error?.message || 'Failed to fetch top items' })
  }
}

/**
 * GET /pharmacy/audit/sale/:id
 * Get detailed audit information for a specific sale
 */
export async function getSaleDetail(req: Request, res: Response) {
  try {
    const { id } = req.params
    const sale = await Dispense.findById(id).lean()
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' })
    }

    // Calculate detailed metrics
    const lineDetails = (sale.lines || []).map((line: any) => ({
      name: line.name,
      qty: line.qty,
      unitPrice: line.unitPrice,
      costPerUnit: line.costPerUnit || 0,
      discountRs: line.discountRs || 0,
      revenue: Number(((line.qty || 0) * (line.unitPrice || 0)).toFixed(2)),
      cost: Number(((line.qty || 0) * (line.costPerUnit || 0)).toFixed(2)),
      profit: Number(((line.qty || 0) * ((line.unitPrice || 0) - (line.costPerUnit || 0)) - (line.discountRs || 0)).toFixed(2))
    }))

    res.json({
      ...sale,
      lineDetails,
      metrics: {
        subtotal: sale.subtotal,
        discount: (sale.lineDiscountTotal || 0) + ((sale.subtotal - (sale.lineDiscountTotal || 0)) * (sale.discountPct || 0) / 100),
        total: sale.total,
        totalProfit: sale.profit,
        margin: sale.subtotal > 0 ? Number(((sale.profit / sale.subtotal) * 100).toFixed(2)) : 0
      }
    })
  } catch (error: any) {
    console.error('Sale detail error:', error)
    res.status(500).json({ error: error?.message || 'Failed to fetch sale detail' })
  }
}

/**
 * GET /pharmacy/audit/purchase/:id
 * Get detailed audit information for a specific purchase
 */
export async function getPurchaseDetail(req: Request, res: Response) {
  try {
    const { id } = req.params
    const purchase = await Purchase.findById(id).lean()
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' })
    }

    const lineDetails = (purchase.lines || []).map((line: any) => {
      const unitsPerPack = Number(line.unitsPerPack || 1)
      const orderedUnits = Number(line.orderedUnits || 0)
      const receivedUnits = Number(line.totalItems || 0)
      const shortageUnits = Math.max(0, orderedUnits - receivedUnits)
      const orderedPacks = unitsPerPack > 0 ? Number((orderedUnits / unitsPerPack).toFixed(2)) : 0
      const receivedPacks = unitsPerPack > 0 ? Number((receivedUnits / unitsPerPack).toFixed(2)) : Number(line.packs || 0)
      const shortagePacks = unitsPerPack > 0 ? Number((shortageUnits / unitsPerPack).toFixed(2)) : 0
      const buyPerUnitEff = Number(line.buyPerUnitAfterTax || line.buyPerUnit || (unitsPerPack ? (Number(line.buyPerPack || 0) / unitsPerPack) : 0) || 0)
      const salePerUnitEff = Number(line.salePerUnit || (unitsPerPack ? (Number(line.salePerPack || 0) / unitsPerPack) : 0) || 0)
      const lineCost = Number((receivedUnits * buyPerUnitEff).toFixed(2))
      const lineRevenue = Number((receivedUnits * salePerUnitEff).toFixed(2))
      return {
        name: line.name,
        packs: line.packs,
        unitsPerPack,
        totalItems: receivedUnits,
        orderedUnits,
        orderedPacks,
        receivedPacks,
        shortageUnits,
        shortagePacks,
        buyPerPack: line.buyPerPack,
        buyPerUnit: buyPerUnitEff,
        salePerPack: line.salePerPack,
        salePerUnit: salePerUnitEff,
        lineCost,
        lineRevenue,
        total: lineCost
      }
    })

    res.json({
      ...purchase,
      lineDetails,
      metrics: {
        totalOrderedUnits: lineDetails.reduce((s: number, l: any) => s + Number(l.orderedUnits || 0), 0),
        totalReceivedUnits: lineDetails.reduce((s: number, l: any) => s + Number(l.totalItems || 0), 0),
        totalShortageUnits: lineDetails.reduce((s: number, l: any) => s + Number(l.shortageUnits || 0), 0),
        totalLines: lineDetails.length,
        totalItems: lineDetails.reduce((sum: number, l: any) => sum + (l.totalItems || 0), 0),
        totalAmount: purchase.totalAmount || lineDetails.reduce((sum: number, l: any) => sum + Number(l.lineCost || 0), 0),
        potentialRevenue: lineDetails.reduce((sum: number, l: any) => sum + Number(l.lineRevenue || ((l.totalItems || 0) * (l.salePerUnit || 0))), 0)
      }
    })
  } catch (error: any) {
    console.error('Purchase detail error:', error)
    res.status(500).json({ error: error?.message || 'Failed to fetch purchase detail' })
  }
}

/**
 * GET /pharmacy/audit/inventory/:id
 * Get detailed audit trail for an inventory item
 */
export async function getInventoryDetail(req: Request, res: Response) {
  try {
    const { id } = req.params
    const item = await InventoryItem.findById(id).lean()
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    // Find related sales and purchases
    const [relatedSales, relatedPurchases] = await Promise.all([
      Dispense.find({ 'lines.name': item.name })
        .sort({ datetime: -1 })
        .limit(20)
        .select({ billNo: 1, datetime: 1, customer: 1, 'lines.$': 1 })
        .lean(),
      Purchase.find({ 'lines.name': item.name })
        .sort({ date: -1 })
        .limit(20)
        .select({ invoice: 1, date: 1, supplierName: 1, 'lines.$': 1 })
        .lean()
    ])

    const salesHistory = relatedSales.map((sale: any) => {
      const line = sale.lines?.find((l: any) => l.name === item.name)
      return {
        type: 'sale',
        date: sale.datetime,
        reference: sale.billNo,
        party: sale.customer,
        qty: line?.qty || 0,
        price: line?.unitPrice || 0
      }
    })

    const purchaseHistory = relatedPurchases.map((purchase: any) => {
      const line = purchase.lines?.find((l: any) => l.name === item.name)
      return {
        type: 'purchase',
        date: purchase.date,
        reference: purchase.invoice,
        party: purchase.supplierName,
        qty: line?.totalItems || 0,
        price: line?.buyPerUnit || 0
      }
    })

    // Combine and sort by date
    const history = [...salesHistory, ...purchaseHistory]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30)

    // Fetch recent audit adjustments for this item
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp(`Item:\\s*${escapeRegExp(item.name)}`, 'i')
    const logs = await AuditLog.find({ action: 'Inventory Adjustment', detail: { $regex: rx } })
      .sort({ at: -1 })
      .limit(20)
      .lean()
    const parseAdj = (detail?: string) => {
      const out: any = {}
      const parts = String(detail || '').split('|').map(s => s.trim())
      parts.forEach(p => {
        const [k, ...rest] = p.split(':')
        const v = rest.join(':').trim()
        const key = (k || '').toLowerCase()
        if (key === 'item') out.item = v
        else if (key === 'old') out.old = Number(v)
        else if (key === 'new') out.next = Number(v)
        else if (key === 'delta') out.delta = Number(v)
        else if (key === 'reason' || key === 'note') out.reason = v
      })
      return out
    }
    const adjustments = (logs || []).map(l => {
      const p = parseAdj(l.detail)
      return {
        date: l.at,
        reason: p.reason || '',
        old: p.old ?? null,
        next: p.next ?? null,
        delta: p.delta ?? null,
        actor: l.actor || 'system'
      }
    })
    const unitCost = Number(item.lastBuyPerUnit || 0)
    const unitSale = Number(item.lastSalePerUnit || 0)
    const totalNegativeDelta = adjustments.reduce((s, a) => s + (Number(a.delta || 0) < 0 ? Math.abs(Number(a.delta || 0)) : 0), 0)
    const adjustmentsLossCost = Number((totalNegativeDelta * unitCost).toFixed(2))
    const adjustmentsLossSale = Number((totalNegativeDelta * unitSale).toFixed(2))

    res.json({
      item: {
        _id: item._id,
        name: item.name,
        genericName: item.genericName,
        category: item.category,
        onHand: item.onHand,
        minStock: item.minStock,
        lastBuyPerUnit: item.lastBuyPerUnit,
        lastSalePerUnit: item.lastSalePerUnit,
        earliestExpiry: item.earliestExpiry,
        lastInvoice: item.lastInvoice,
        lastSupplier: item.lastSupplier
      },
      valuation: {
        stockValueAtCost: Number(((item.onHand || 0) * (item.lastBuyPerUnit || 0)).toFixed(2)),
        stockValueAtSale: Number(((item.onHand || 0) * (item.lastSalePerUnit || 0)).toFixed(2)),
        potentialProfit: Number(((item.onHand || 0) * ((item.lastSalePerUnit || 0) - (item.lastBuyPerUnit || 0))).toFixed(2))
      },
      history,
      adjustments,
      metrics: {
        adjustmentsLossCost,
        adjustmentsLossSale,
      }
    })
  } catch (error: any) {
    console.error('Inventory detail error:', error)
    res.status(500).json({ error: error?.message || 'Failed to fetch inventory detail' })
  }
}
