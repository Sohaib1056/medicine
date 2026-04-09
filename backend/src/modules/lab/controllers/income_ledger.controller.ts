import { Request, Response } from 'express'
import { LabOrder } from '../models/Order'
import { LabExpense } from '../models/Expense'
import { LabStaffEarning } from '../models/StaffEarning'
import { LabCounter } from '../models/Counter'

// Helper to determine payment status from received vs net amounts
function getPaymentStatus(received: number, net: number): 'paid' | 'partial' | 'unpaid' {
  if (received >= net) return 'paid'
  if (received > 0) return 'partial'
  return 'unpaid'
}

// Parse date with proper timezone handling
function parseDate(s?: string): Date | undefined {
  if (!s) return undefined
  const d = new Date(s)
  return isNaN(d.getTime()) ? undefined : d
}

// Build date filter for orders (using createdAt)
function buildOrderDateFilter(from?: string, to?: string): any {
  const filter: any = {}
  const fromDate = parseDate(from)
  const toDate = parseDate(to)
  
  if (fromDate || toDate) {
    filter.createdAt = {}
    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0)
      filter.createdAt.$gte = fromDate
    }
    if (toDate) {
      toDate.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = toDate
    }
  }
  return filter
}

// Build date filter for expenses (using date string)
function buildExpenseDateFilter(from?: string, to?: string): any {
  const filter: any = {}
  if (from || to) {
    filter.date = {}
    if (from) filter.date.$gte = from.slice(0, 10)
    if (to) filter.date.$lte = to.slice(0, 10)
  }
  return filter
}

// Build date filter for staff earnings
function buildEarningDateFilter(from?: string, to?: string): any {
  const filter: any = {}
  if (from || to) {
    filter.date = {}
    if (from) filter.date.$gte = from.slice(0, 10)
    if (to) filter.date.$lte = to.slice(0, 10)
  }
  return filter
}

export async function incomeLedger(req: Request, res: Response) {
  try {
    const {
      from,
      to,
      transactionType, // 'income_received' | 'income_receivable' | 'expense' | 'salary' | 'all'
      paymentStatus,   // 'paid' | 'partial' | 'unpaid'
      paymentMethod,   // 'Cash' | 'Card' | 'Bank' | 'Online'
      search,          // search token, patient name, invoice, reference
      page = '1',
      limit = '50',
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query as any

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    // Build base date filters
    const orderDateFilter = buildOrderDateFilter(from, to)
    const expenseDateFilter = buildExpenseDateFilter(from, to)
    const earningDateFilter = buildEarningDateFilter(from, to)

    // Fetch all data in parallel
    const [orders, expenses, earnings] = await Promise.all([
      LabOrder.find(orderDateFilter).sort({ createdAt: -1 }).lean(),
      LabExpense.find(expenseDateFilter).sort({ date: -1 }).lean(),
      LabStaffEarning.find(earningDateFilter).sort({ date: -1 }).lean()
    ])

    // Transform orders into transaction format with payment status
    const orderTransactions = orders.map(o => {
      const net = Number(o.net || 0)
      const received = Number(o.receivedAmount || 0)
      const receivable = Number(o.receivableAmount || 0)
      const pmtStatus = getPaymentStatus(received, net)
      
      return {
        _id: String(o._id),
        type: 'income' as const,
        subType: receivable > 0 ? 'income_receivable' : 'income_received' as const,
        date: o.createdAt,
        dateStr: new Date(o.createdAt as any).toISOString().slice(0, 10),
        timeStr: new Date(o.createdAt as any).toLocaleTimeString(),
        tokenNo: o.tokenNo || '-',
        patientName: o.patient?.fullName || '-',
        patientPhone: o.patient?.phone || '-',
        patientMrn: o.patient?.mrn || '-',
        description: `Lab tests: ${Array.isArray(o.tests) ? o.tests.length : 0} test(s)`,
        category: 'income',
        paymentStatus: pmtStatus,
        paymentMethod: o.paymentMethod || 'Cash',
        paymentDetails: o.paymentDetails,
        totalAmount: net,
        receivedAmount: received,
        receivableAmount: receivable,
        status: o.status,
        corporateId: o.corporateId,
        discount: Number(o.discount || 0),
        urgentCharges: Number(o.urgentCharges || 0),
        referringConsultant: o.referringConsultant,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
      }
    })

    // Transform expenses
    const expenseTransactions = expenses.map(e => ({
      _id: String(e._id),
      type: 'expense' as const,
      subType: 'expense' as const,
      date: e.datetime || new Date(e.date + 'T00:00:00'),
      dateStr: e.date,
      timeStr: e.datetime ? new Date(e.datetime).toLocaleTimeString() : '-',
      tokenNo: '-',
      patientName: e.createdBy || '-',
      patientPhone: '-',
      patientMrn: '-',
      description: e.note || `${e.type} expense`,
      category: e.type,
      paymentStatus: 'paid' as const, // expenses are always paid
      paymentMethod: 'Cash' as const,  // default for expenses
      totalAmount: Number(e.amount || 0),
      receivedAmount: Number(e.amount || 0),
      receivableAmount: 0,
      status: 'completed',
      createdBy: e.createdBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }))

    // Transform staff earnings (salaries)
    const salaryTransactions = earnings.map(e => ({
      _id: String(e._id),
      type: 'salary' as const,
      subType: 'salary' as const,
      date: new Date(e.date + 'T00:00:00'),
      dateStr: e.date,
      timeStr: '-',
      tokenNo: '-',
      patientName: e.staffId || '-',
      patientPhone: '-',
      patientMrn: '-',
      description: `${e.category} payment${e.notes ? ': ' + e.notes : ''}`,
      category: e.category,
      paymentStatus: 'paid' as const,
      paymentMethod: 'Cash' as const,
      totalAmount: Number(e.amount || 0),
      receivedAmount: Number(e.amount || 0),
      receivableAmount: 0,
      status: 'completed',
      rate: e.rate,
      base: e.base,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }))

    // Combine all transactions
    let allTransactions = [
      ...orderTransactions,
      ...expenseTransactions,
      ...salaryTransactions
    ]

    // Apply transaction type filter
    if (transactionType && transactionType !== 'all') {
      allTransactions = allTransactions.filter(t => {
        switch (transactionType) {
          case 'income_received':
            return t.subType === 'income_received' || (t.type === 'income' && t.receivableAmount === 0)
          case 'income_receivable':
            return t.type === 'income' && t.receivableAmount > 0
          case 'expense':
            return t.type === 'expense'
          case 'salary':
            return t.type === 'salary'
          default:
            return true
        }
      })
    }

    // Apply payment status filter (only for income transactions)
    if (paymentStatus && paymentStatus !== 'all') {
      allTransactions = allTransactions.filter(t => {
        if (t.type !== 'income') return true // expenses and salaries are always 'paid'
        return t.paymentStatus === paymentStatus
      })
    }

    // Apply payment method filter (only for income transactions)
    if (paymentMethod && paymentMethod !== 'all') {
      allTransactions = allTransactions.filter(t => {
        if (t.type !== 'income') return true
        return t.paymentMethod?.toLowerCase() === paymentMethod.toLowerCase()
      })
    }

    // Apply search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase()
      allTransactions = allTransactions.filter(t => {
        const searchable = [
          t.tokenNo,
          t.patientName,
          t.patientMrn,
          t.patientPhone,
          t.description,
          t.paymentMethod,
          t.category
        ].filter(Boolean).join(' ').toLowerCase()
        return searchable.includes(searchLower)
      })
    }

    // Sort transactions
    allTransactions.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'amount':
          comparison = a.totalAmount - b.totalAmount
          break
        case 'patient':
          comparison = a.patientName.localeCompare(b.patientName)
          break
        case 'token':
          comparison = (a.tokenNo || '').localeCompare(b.tokenNo || '')
          break
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    // Calculate summary statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().slice(0, 10)

    // Today's stats
    const todayOrders = orderTransactions.filter(o => o.dateStr === todayStr)
    const todayTokens = todayOrders.length
    const todayIncome = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const todayReceived = todayOrders.reduce((sum, o) => sum + o.receivedAmount, 0)
    const todayReceivable = todayOrders.reduce((sum, o) => sum + o.receivableAmount, 0)

    // Overall stats for filtered data
    const incomeTransactions = allTransactions.filter(t => t.type === 'income')
    const totalTransactions = incomeTransactions.length
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.totalAmount, 0)
    const totalReceived = incomeTransactions.reduce((sum, t) => sum + t.receivedAmount, 0)
    const totalReceivable = incomeTransactions.reduce((sum, t) => sum + t.receivableAmount, 0)

    // Expenses and salaries
    const totalExpenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.totalAmount, 0)
    
    const totalSalaries = allTransactions
      .filter(t => t.type === 'salary')
      .reduce((sum, t) => sum + t.totalAmount, 0)

    // Receivable breakdown
    const pendingReceivables = incomeTransactions.filter(t => t.receivableAmount > 0)
    const pendingCount = pendingReceivables.length
    const pendingAmount = pendingReceivables.reduce((sum, t) => sum + t.receivableAmount, 0)

    // Profit/Loss calculation
    // Net Profit = Total Income Received - Total Expenses - Total Salaries
    // Or we can show both: Income (accrued) vs Expenses view and Received vs Expenses view
    const netProfitAccrued = totalIncome - totalExpenses - totalSalaries
    const netProfitCash = totalReceived - totalExpenses - totalSalaries

    // Payment method breakdown
    const paymentMethodBreakdown = {
      Cash: 0,
      Card: 0,
      Bank: 0,
      Online: 0
    }
    incomeTransactions.forEach(t => {
      const method = t.paymentMethod || 'Cash'
      if (method in paymentMethodBreakdown) {
        paymentMethodBreakdown[method as keyof typeof paymentMethodBreakdown] += t.receivedAmount
      }
    })

    // Payment status breakdown
    const paymentStatusBreakdown = {
      paid: incomeTransactions.filter(t => t.paymentStatus === 'paid').length,
      partial: incomeTransactions.filter(t => t.paymentStatus === 'partial').length,
      unpaid: incomeTransactions.filter(t => t.paymentStatus === 'unpaid').length
    }

    // Paginate results
    const totalItems = allTransactions.length
    const totalPages = Math.max(1, Math.ceil(totalItems / limitNum))
    const paginatedTransactions = allTransactions.slice(skip, skip + limitNum)

    res.json({
      summary: {
        // Today's snapshot
        todayTokens,
        todayIncome: Number(todayIncome.toFixed(2)),
        todayReceived: Number(todayReceived.toFixed(2)),
        todayReceivable: Number(todayReceivable.toFixed(2)),
        
        // Overall financials
        totalTransactions,
        totalIncome: Number(totalIncome.toFixed(2)),
        totalReceived: Number(totalReceived.toFixed(2)),
        totalReceivable: Number(totalReceivable.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        totalSalaries: Number(totalSalaries.toFixed(2)),
        
        // Net profit/loss (two views)
        netProfitAccrued: Number(netProfitAccrued.toFixed(2)),
        netProfitCash: Number(netProfitCash.toFixed(2)),
        
        // Breakdowns
        paymentMethodBreakdown: {
          Cash: Number(paymentMethodBreakdown.Cash.toFixed(2)),
          Card: Number(paymentMethodBreakdown.Card.toFixed(2)),
          Bank: Number(paymentMethodBreakdown.Bank.toFixed(2)),
          Online: Number(paymentMethodBreakdown.Online.toFixed(2))
        },
        paymentStatusBreakdown,
        
        // Receivables summary
        pendingReceivables: {
          count: pendingCount,
          amount: Number(pendingAmount.toFixed(2))
        }
      },
      transactions: paginatedTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      filters: {
        from,
        to,
        transactionType,
        paymentStatus,
        paymentMethod,
        search
      }
    })
  } catch (error) {
    console.error('Income Ledger API Error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch income ledger data',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Export individual transaction type APIs for potential separate use
export async function incomeSummary(req: Request, res: Response) {
  try {
    const { from, to } = req.query as any
    
    const orderFilter = buildOrderDateFilter(from, to)
    const orders = await LabOrder.find(orderFilter).lean()
    
    const totalIncome = orders.reduce((sum, o) => sum + Number(o.net || 0), 0)
    const totalReceived = orders.reduce((sum, o) => sum + Number(o.receivedAmount || 0), 0)
    const totalReceivable = orders.reduce((sum, o) => sum + Number(o.receivableAmount || 0), 0)
    
    res.json({
      totalIncome: Number(totalIncome.toFixed(2)),
      totalReceived: Number(totalReceived.toFixed(2)),
      totalReceivable: Number(totalReceivable.toFixed(2)),
      transactionCount: orders.length
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch income summary' })
  }
}

export async function receivableSummary(req: Request, res: Response) {
  try {
    const orders = await LabOrder.find({ 
      receivableAmount: { $gt: 0 },
      status: { $ne: 'returned' }
    }).sort({ createdAt: -1 }).lean()
    
    const totalReceivable = orders.reduce((sum, o) => sum + Number(o.receivableAmount || 0), 0)
    
    // Group by patient for summary
    const byPatient: Record<string, { name: string; phone: string; amount: number; count: number }> = {}
    orders.forEach(o => {
      const key = o.patientId || o.patient?.mrn || 'unknown'
      if (!byPatient[key]) {
        byPatient[key] = {
          name: o.patient?.fullName || '-',
          phone: o.patient?.phone || '-',
          amount: 0,
          count: 0
        }
      }
      byPatient[key].amount += Number(o.receivableAmount || 0)
      byPatient[key].count++
    })
    
    res.json({
      totalReceivable: Number(totalReceivable.toFixed(2)),
      pendingCount: orders.length,
      byPatient: Object.values(byPatient).sort((a, b) => b.amount - a.amount)
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receivable summary' })
  }
}
