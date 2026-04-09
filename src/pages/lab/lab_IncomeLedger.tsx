import { useEffect, useMemo, useState } from 'react'
import { labApi } from '../../utils/api'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import {
  Download,
  RefreshCw,
  CheckCircle,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  Filter,
  Search,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Receipt,
  ShoppingCart,
  Users,
  BarChart3,
  Banknote,
  MinusCircle,
  FileDown
} from 'lucide-react'

type TransactionType = 'income' | 'expense' | 'salary'
type PaymentStatus = 'paid' | 'partial' | 'unpaid'
type PaymentMethod = 'Cash' | 'Card' | 'Bank' | 'Online'

interface Transaction {
  _id: string
  type: TransactionType
  subType: string
  date: string
  dateStr: string
  timeStr: string
  tokenNo: string
  patientName: string
  patientPhone: string
  patientMrn: string
  description: string
  category: string
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  totalAmount: number
  receivedAmount: number
  receivableAmount: number
  status?: string
  corporateId?: string
  discount?: number
  urgentCharges?: number
  referringConsultant?: string
  createdBy?: string
  rate?: number
  base?: number
}

interface IncomeLedgerSummary {
  todayTokens: number
  todayIncome: number
  todayReceived: number
  todayReceivable: number
  totalTransactions: number
  totalIncome: number
  totalReceived: number
  totalReceivable: number
  totalExpenses: number
  totalSalaries: number
  netProfitAccrued: number
  netProfitCash: number
  paymentMethodBreakdown: {
    Cash: number
    Card: number
    Bank: number
    Online: number
  }
  paymentStatusBreakdown: {
    paid: number
    partial: number
    unpaid: number
  }
  pendingReceivables: {
    count: number
    amount: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface IncomeLedgerResponse {
  summary: IncomeLedgerSummary
  transactions: Transaction[]
  pagination: PaginationInfo
  filters: {
    from?: string
    to?: string
    transactionType?: string
    paymentStatus?: string
    paymentMethod?: string
    search?: string
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getPaymentStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3.5 h-3.5" />
          Paid
        </span>
      )
    case 'partial':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5" />
          Partial
        </span>
      )
    case 'unpaid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
          <XCircle className="w-3.5 h-3.5" />
          Unpaid
        </span>
      )
  }
}

const getTransactionTypeBadge = (type: TransactionType, subType: string) => {
  switch (type) {
    case 'income':
      if (subType === 'income_receivable') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Receipt className="w-3.5 h-3.5" />
            Receivable
          </span>
        )
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <DollarSign className="w-3.5 h-3.5" />
          Income
        </span>
      )
    case 'expense':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <ShoppingCart className="w-3.5 h-3.5" />
          Expense
        </span>
      )
    case 'salary':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Users className="w-3.5 h-3.5" />
          Salary
        </span>
      )
  }
}

const getPaymentMethodBadge = (method: PaymentMethod) => {
  const styles = {
    Cash: 'bg-slate-100 text-slate-700',
    Card: 'bg-purple-100 text-purple-700',
    Bank: 'bg-blue-100 text-blue-700',
    Online: 'bg-cyan-100 text-cyan-700'
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[method] || styles.Cash}`}>
      {method}
    </span>
  )
}

export default function IncomeLedger() {
  // State
  const [data, setData] = useState<IncomeLedgerResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [transactionType, setTransactionType] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await labApi.incomeLedger({
        from: fromDate,
        to: toDate,
        transactionType: transactionType as any,
        paymentStatus: paymentStatus as any,
        paymentMethod: paymentMethod as any,
        search: search || undefined,
        page,
        limit,
        sortBy,
        sortOrder
      })
      setData(response as IncomeLedgerResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch income ledger data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fromDate, toDate, transactionType, paymentStatus, paymentMethod, page, limit, sortBy, sortOrder])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (data?.filters?.search || '')) {
        setPage(1)
        fetchData()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // Handlers
  const handleApplyFilters = () => {
    setPage(1)
    fetchData()
  }

  const handleResetFilters = () => {
    setFromDate(today)
    setToDate(today)
    setTransactionType('all')
    setPaymentStatus('all')
    setPaymentMethod('all')
    setSearch('')
    setPage(1)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const exportToCSV = () => {
    if (!data?.transactions?.length) return
    
    const headers = ['Date', 'Time', 'Token/Ref', 'Patient/Staff', 'Description', 'Type', 'Status', 'Method', 'Total', 'Received', 'Receivable']
    const rows = data.transactions.map(t => [
      t.dateStr,
      t.timeStr,
      t.tokenNo,
      t.patientName,
      t.description,
      t.type,
      t.paymentStatus,
      t.paymentMethod,
      t.totalAmount,
      t.receivedAmount,
      t.receivableAmount
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `income-ledger-${fromDate}-to-${toDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    if (!data?.transactions?.length) return
    
    const doc = new jsPDF({ orientation: 'landscape' })
    
    // Title
    doc.setFontSize(16)
    doc.text('Income Ledger Report', 14, 20)
    
    // Date range
    doc.setFontSize(10)
    doc.text(`Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`, 14, 28)
    
    // Summary
    if (summary) {
      doc.setFontSize(10)
      doc.text(`Total Income: ${formatCurrency(summary.totalIncome)}`, 14, 36)
      doc.text(`Total Expenses: ${formatCurrency(summary.totalExpenses + summary.totalSalaries)}`, 80, 36)
      doc.text(`Net Profit: ${formatCurrency(summary.netProfitCash)}`, 150, 36)
    }
    
    // Table data
    const tableData = data.transactions.map(t => [
      t.dateStr,
      t.timeStr,
      t.tokenNo,
      t.patientName,
      t.description,
      t.type,
      t.paymentStatus,
      t.paymentMethod,
      formatCurrency(t.totalAmount),
      formatCurrency(t.receivedAmount),
      formatCurrency(t.receivableAmount)
    ])
    
    ;(doc as any).autoTable({
      head: [['Date', 'Time', 'Token/Ref', 'Patient/Staff', 'Description', 'Type', 'Status', 'Method', 'Total', 'Received', 'Receivable']],
      body: tableData,
      startY: summary ? 42 : 32,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    })
    
    doc.save(`income-ledger-${fromDate}-to-${toDate}.pdf`)
  }

  const summary = data?.summary

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-7 h-7 text-emerald-600" />
                Income Ledger
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Complete financial overview of lab operations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                disabled={!data?.transactions?.length}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                disabled={!data?.transactions?.length}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full py-6">
        {/* Filters Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Transaction Type</label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">All Types</option>
                  <option value="income_received">Income Received</option>
                  <option value="income_receivable">Income Receivable</option>
                  <option value="expense">Expenses</option>
                  <option value="salary">Salaries</option>
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Token, patient, reference..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Reset Filters
              </button>
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Receivable Summary Alert */}
        {summary && summary.pendingReceivables.count > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900">Pending Receivables</h3>
                <p className="text-sm text-amber-800 mt-1">
                  You have <span className="font-semibold">{summary.pendingReceivables.count}</span> pending transactions with a total receivable amount of <span className="font-semibold">{formatCurrency(summary.pendingReceivables.amount)}</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profit/Loss Summary */}
        {summary && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              Profit & Loss Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-700 font-medium">Total Income</p>
                <p className="text-2xl font-bold text-emerald-800">{formatCurrency(summary.totalIncome)}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium">Amount Received</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(summary.totalReceived)}</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700 font-medium">Receivable Amount</p>
                <p className="text-2xl font-bold text-amber-800">{formatCurrency(summary.totalReceivable)}</p>
              </div>
              <div className="text-center p-4 bg-rose-50 rounded-lg">
                <p className="text-sm text-rose-700 font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-rose-800">{formatCurrency(summary.totalExpenses + summary.totalSalaries)}</p>
                <p className="text-xs text-rose-600 mt-1">
                  Expenses: {formatCurrency(summary.totalExpenses)} + Salaries: {formatCurrency(summary.totalSalaries)}
                </p>
              </div>
              <div className={`text-center p-4 rounded-lg ${summary.netProfitCash >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                <p className={`text-sm font-medium ${summary.netProfitCash >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                  Net {summary.netProfitCash >= 0 ? 'Profit' : 'Loss'}
                </p>
                <p className={`text-2xl font-bold ${summary.netProfitCash >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {formatCurrency(Math.abs(summary.netProfitCash))}
                </p>
                <p className="text-xs text-slate-500 mt-1">Based on cash received</p>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Payment Method Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    Cash
                  </span>
                  <span className="font-semibold text-slate-900">{formatCurrency(summary.paymentMethodBreakdown.Cash)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-purple-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Card
                  </span>
                  <span className="font-semibold text-purple-900">{formatCurrency(summary.paymentMethodBreakdown.Card)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Bank
                  </span>
                  <span className="font-semibold text-blue-900">{formatCurrency(summary.paymentMethodBreakdown.Bank)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                  <span className="text-sm text-cyan-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    Online
                  </span>
                  <span className="font-semibold text-cyan-900">{formatCurrency(summary.paymentMethodBreakdown.Online)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-rose-800">
              <XCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Transactions ({data?.pagination?.totalItems || 0})
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Items per page:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-2 py-1 border border-slate-300 rounded text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th 
                    onClick={() => handleSort('date')}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-1">
                      Date & Time
                      {sortBy === 'date' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      )}
                      {sortBy !== 'date' && <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('token')}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-1">
                      Token/Ref
                      {sortBy === 'token' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      )}
                      {sortBy !== 'token' && <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('patient')}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-1">
                      Patient/Staff
                      {sortBy === 'patient' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      )}
                      {sortBy !== 'patient' && <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Method</th>
                  <th 
                    onClick={() => handleSort('amount')}
                    className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total
                      {sortBy === 'amount' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      )}
                      {sortBy !== 'amount' && <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Received</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Receivable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
                      <p className="text-slate-500">Loading transactions...</p>
                    </td>
                  </tr>
                ) : data?.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <MinusCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No transactions found</p>
                      <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  data?.transactions?.map((transaction) => (
                    <tr 
                      key={transaction._id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        transaction.receivableAmount > 0 ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{formatDate(transaction.dateStr)}</div>
                        <div className="text-xs text-slate-500">{transaction.timeStr}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-900">{transaction.tokenNo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-900">{transaction.patientName}</div>
                        <div className="text-xs text-slate-500">{transaction.patientPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-700 max-w-xs truncate" title={transaction.description}>
                          {transaction.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getTransactionTypeBadge(transaction.type, transaction.subType)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {transaction.type === 'income' ? getPaymentStatusBadge(transaction.paymentStatus) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getPaymentMethodBadge(transaction.paymentMethod)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-slate-900">
                          {formatCurrency(transaction.totalAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-emerald-700">
                          {formatCurrency(transaction.receivedAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {transaction.receivableAmount > 0 ? (
                          <span className="text-sm font-medium text-amber-700">
                            {formatCurrency(transaction.receivableAmount)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to {Math.min(data.pagination.page * data.pagination.limit, data.pagination.totalItems)} of {data.pagination.totalItems} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!data.pagination.hasPrev}
                  className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!data.pagination.hasNext}
                  className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Income Ledger • Lab Management System</p>
        </div>
      </div>
    </div>
  )
}
