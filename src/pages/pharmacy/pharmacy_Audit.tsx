import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pharmacyApi } from '../../utils/api'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  Calendar,
  Search,
  Download,
  Printer,
  ArrowUpRight,
  Activity,
  BarChart3,
  Wallet,
  X,
  FileText,
  History
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

export default function Pharmacy_Audit() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases' | 'inventory'>('sales')
  const [summary, setSummary] = useState({
    sales: 0,
    purchases: 0,
    expenses: 0,
    profit: 0,
    inventoryValue: 0,
    inventorySaleValue: 0,
    inventoryPurchaseValue: 0
  })

  const [data, setData] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const todayStr = new Date().toISOString().slice(0, 10)
  const startMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const [from, setFrom] = useState(startMonthStr)
  const [to, setTo] = useState(todayStr)
  const [fromTime, setFromTime] = useState('00:00')
  const [toTime, setToTime] = useState('23:59')
  const [tick, setTick] = useState(0)
  const [comparison, setComparison] = useState<Array<{ label: string; value: number; color?: string }>>([])
  const [weeklySales, setWeeklySales] = useState<Array<{ week: string; value: number }>>([])
  
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailModalTitle, setDetailModalTitle] = useState('')
  const [detailModalContent, setDetailModalContent] = useState<any>(null)
  const [detailModalLoading, setDetailModalLoading] = useState(false)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tick])

  function fmt(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function weekStart(date: Date) {
    const d = new Date(date)
    const day = d.getDay() // 0 Sun ... 6 Sat
    const diff = (day === 0 ? -6 : 1 - day) // Monday as start
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const setRangeToday = () => {
    setFrom(todayStr)
    setTo(todayStr)
    setFromTime('00:00')
    setToTime('23:59')
  }

  const setRangeThisWeek = () => {
    const d = new Date()
    setFrom(fmt(weekStart(d)))
    setTo(todayStr)
    setFromTime('00:00')
    setToTime('23:59')
  }

  const setRangeThisMonth = () => {
    const d = new Date()
    setFrom(fmt(new Date(d.getFullYear(), d.getMonth(), 1)))
    setTo(todayStr)
    setFromTime('00:00')
    setToTime('23:59')
  }

  const setRangeThisYear = () => {
    const d = new Date()
    setFrom(fmt(new Date(d.getFullYear(), 0, 1)))
    setTo(todayStr)
    setFromTime('00:00')
    setToTime('23:59')
  }

  const apply = () => setTick(t => t + 1)

  const loadData = async () => {
    setLoading(true)
    try {
      const fromStr = `${from}T${fromTime || '00:00'}`
      const toStr = `${to}T${toTime || '23:59'}`

      // Fetch comprehensive analytics from backend
      const [analyticsData, tabData] = await Promise.all([
        pharmacyApi.getAuditAnalytics({ from: fromStr, to: toStr }),
        (async () => {
          if (activeTab === 'sales') {
            const res = await pharmacyApi.listSales({ from: fromStr, to: toStr, limit: 200 })
            return res?.items || []
          } else if (activeTab === 'purchases') {
            // Use date-only format for purchases (backend expects YYYY-MM-DD)
            let res = await pharmacyApi.listPurchases({ from, to, limit: 200 })
            // Fallback: if no results for current range, fetch all purchases
            if (!res?.items?.length) {
              res = await pharmacyApi.listPurchases({ limit: 200 })
            }
            return res?.items || []
          } else {
            const res = await pharmacyApi.listInventory({ search: searchTerm || undefined, limit: 200 })
            return res?.items || []
          }
        })()
      ])

      // Update state from analytics
      setSummary({
        sales: analyticsData?.summary?.sales?.total || 0,
        purchases: analyticsData?.summary?.purchases?.total || 0,
        expenses: analyticsData?.summary?.expenses?.total || 0,
        profit: analyticsData?.summary?.netProfit || 0,
        inventoryValue: analyticsData?.summary?.inventory?.stockSaleValue || 0,
        inventorySaleValue: analyticsData?.summary?.inventory?.stockSaleValue || 0,
        inventoryPurchaseValue: analyticsData?.summary?.inventory?.stockPurchaseValue || 0
      })

      // Set comparison data from backend
      setComparison(analyticsData?.comparison || [])

      // Set weekly sales from backend
      setWeeklySales(analyticsData?.weeklySales || [])

      // Set tab-specific data
      setData(tabData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    const s = searchTerm.toLowerCase()
    const base = data.filter((item: any) => {
      if (!s) return true
      if (activeTab === 'inventory') return item.name?.toLowerCase().includes(s) || item.genericName?.toLowerCase().includes(s)
      if (activeTab === 'sales') return item.billNumber?.toLowerCase().includes(s) || item.billNo?.toLowerCase().includes(s) || item.customerName?.toLowerCase().includes(s) || item.customer?.toLowerCase().includes(s)
      if (activeTab === 'purchases') return item.invoiceNumber?.toLowerCase().includes(s) || item.invoice?.toLowerCase().includes(s) || item.supplierName?.toLowerCase().includes(s)
      return true
    })
    if (activeTab === 'inventory') {
      return [...base].sort((a: any, b: any) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return tb - ta
      })
    }
    return base
  }, [activeTab, data, searchTerm])

  useEffect(() => {
    const onRefresh = () => loadData()
    const onExport = () => exportCsv()
    const onPrint = () => printAuditReport()

    window.addEventListener('pharmacy:audit:refresh', onRefresh)
    window.addEventListener('pharmacy:audit:export', onExport)
    window.addEventListener('pharmacy:audit:print', onPrint)

    return () => {
      window.removeEventListener('pharmacy:audit:refresh', onRefresh)
      window.removeEventListener('pharmacy:audit:export', onExport)
      window.removeEventListener('pharmacy:audit:print', onPrint)
    }
  }, [summary, filteredData])

  const handleAuditClick = async (item: any) => {
    setDetailModalOpen(true)
    setDetailModalLoading(true)
    try {
      if (activeTab === 'sales') {
        setDetailModalTitle(`Sale Audit - ${item.billNumber || item.billNo}`)
        const detail = await pharmacyApi.getAuditSaleDetail(item._id)
        setDetailModalContent(detail)
      } else if (activeTab === 'purchases') {
        setDetailModalTitle(`Purchase Audit - ${item.invoiceNumber || item.invoice}`)
        const detail = await pharmacyApi.getAuditPurchaseDetail(item._id)
        setDetailModalContent(detail)
      } else {
        setDetailModalTitle(`Inventory Audit - ${item.name}`)
        const detail = await pharmacyApi.getAuditInventoryDetail(item._id)
        setDetailModalContent(detail)
      }
    } catch (e) {
      console.error('Failed to fetch audit detail:', e)
      setDetailModalContent({ error: 'Failed to load audit details' })
    } finally {
      setDetailModalLoading(false)
    }
  }

  const closeDetailModal = () => {
    setDetailModalOpen(false)
    setDetailModalContent(null)
    setDetailModalTitle('')
  }

  const exportCsv = async () => {
    const escape = (v: any) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    const rows: string[][] = []
    if (activeTab === 'sales') {
      rows.push(['Bill No', 'Date/Time', 'Customer', 'Total', 'Profit'])
      for (const it of filteredData) {
        rows.push([
          it.billNumber ?? it.billNo ?? '',
          it.datetime ? new Date(it.datetime).toLocaleString() : '',
          it.customerName ?? it.customer ?? 'Walk-in',
          Number(it.total || 0).toFixed(2),
          Number(it.profit || 0).toFixed(2),
        ])
      }
    } else if (activeTab === 'purchases') {
      rows.push(['Invoice', 'Date', 'Supplier', 'Amount'])
      for (const it of filteredData) {
        rows.push([
          it.invoiceNumber ?? it.invoice ?? '',
          it.date ? String(it.date) : (it.datetime ? new Date(it.datetime).toLocaleDateString() : ''),
          it.supplierName ?? '',
          Number(it.totalAmount || it?.totals?.net || 0).toFixed(2),
        ])
      }
    } else {
      rows.push(['Item', 'Generic', 'Stock', 'Buy Price', 'Sale Price'])
      for (const it of filteredData) {
        rows.push([
          it.name ?? '',
          it.genericName ?? '',
          String(it.stock ?? it.onHand ?? 0),
          String(it.buyPrice ?? it.lastBuyPerUnit ?? ''),
          String(it.salePrice ?? it.unitPrice ?? it.lastSalePerUnit ?? ''),
        ])
      }
    }
    const csv = rows.map(r => r.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_${activeTab}_${from}_to_${to}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const printAuditReport = () => {
    const period = `${from} ${fromTime} → ${to} ${toTime}`
    const tabTitle = activeTab === 'sales' ? 'Sales Audit' : activeTab === 'purchases' ? 'Purchase Audit' : 'Inventory Audit'
    const tableRows = filteredData.slice(0, 60).map((it: any) => {
      if (activeTab === 'sales') {
        return `<tr>
          <td>${String(it.billNumber ?? it.billNo ?? '')}</td>
          <td>${it.datetime ? new Date(it.datetime).toLocaleString() : ''}</td>
          <td>${String(it.customerName ?? it.customer ?? 'Walk-in')}</td>
          <td class="num">PKR ${Number(it.total || 0).toLocaleString()}</td>
          <td class="num">PKR ${Number(it.profit || 0).toLocaleString()}</td>
        </tr>`
      }
      if (activeTab === 'purchases') {
        return `<tr>
          <td>${String(it.invoiceNumber ?? it.invoice ?? '')}</td>
          <td>${String(it.date || (it.datetime ? new Date(it.datetime).toLocaleDateString() : ''))}</td>
          <td>${String(it.supplierName ?? '')}</td>
          <td class="num">PKR ${Number(it.totalAmount || it?.totals?.net || 0).toLocaleString()}</td>
        </tr>`
      }
      return `<tr>
        <td>${String(it.name ?? '')}</td>
        <td>${String(it.genericName ?? '')}</td>
        <td class="num">${String(it.stock ?? it.onHand ?? 0)}</td>
        <td class="num">${String(it.buyPrice ?? it.lastBuyPerUnit ?? '')}</td>
        <td class="num">${String(it.salePrice ?? it.unitPrice ?? it.lastSalePerUnit ?? '')}</td>
      </tr>`
    }).join('')

    const th = activeTab === 'sales'
      ? '<th>Bill #</th><th>Date/Time</th><th>Customer</th><th class="num">Total</th><th class="num">Profit</th>'
      : activeTab === 'purchases'
        ? '<th>Invoice #</th><th>Date</th><th>Supplier</th><th class="num">Amount</th>'
        : '<th>Item</th><th>Generic</th><th class="num">Stock</th><th class="num">Buy</th><th class="num">Sale</th>'

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset='utf-8' />
          <title>Audit Report</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafc; padding:32px; }
            .card { max-width: 980px; margin: 0 auto; background:white; border-radius:18px; overflow:hidden; box-shadow: 0 12px 30px rgba(2,6,23,0.08); }
            .hdr { padding:28px 28px; color:white; background: linear-gradient(135deg,#0ea5e9 0%, #6366f1 60%, #0f172a 140%); }
            .hdrTop { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
            .brand { font-weight:900; font-size:22px; letter-spacing:-0.3px; }
            .sub { opacity:0.92; font-weight:600; margin-top:4px; }
            .pill { display:inline-block; margin-top:12px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.22); padding:8px 12px; border-radius:999px; font-weight:700; font-size:12px; }
            .content { padding:22px 28px 28px; }
            .grid { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; margin-top:-22px; padding:0 28px; }
            .kpi { background: rgba(255,255,255,0.92); border: 1px solid #e2e8f0; border-radius:16px; padding:14px 14px; box-shadow: 0 10px 22px rgba(15,23,42,0.06); }
            .k { font-size:11px; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:0.8px; }
            .v { margin-top:6px; font-size:18px; font-weight:900; color:#0f172a; }
            .tblWrap { margin-top:18px; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; }
            table { width:100%; border-collapse:collapse; font-size:12px; }
            thead th { background:#f1f5f9; color:#475569; text-transform:uppercase; font-size:11px; letter-spacing:0.6px; padding:10px 12px; text-align:left; }
            tbody td { padding:10px 12px; border-top:1px solid #e2e8f0; color:#0f172a; }
            tbody tr:nth-child(even){ background:#fbfdff; }
            .num { text-align:right; font-variant-numeric: tabular-nums; }
            .foot { padding:14px 28px; border-top:1px solid #e2e8f0; color:#64748b; font-size:11px; display:flex; justify-content:space-between; }
            @media print { body { padding:0; background:white; } .card { box-shadow:none; border-radius:0; } .grid { padding: 0 18px; } .content { padding: 18px; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="hdr">
              <div class="hdrTop">
                <div>
                  <div class="brand">HealthSpire · Audit Report</div>
                  <div class="sub">${tabTitle}</div>
                  <div class="pill">Period: ${period}</div>
                </div>
                <div style="text-align:right; font-weight:800; opacity:0.95; font-size:12px;">
                  Generated: ${new Date().toLocaleString()}
                </div>
              </div>
            </div>
            <div class="grid">
              <div class="kpi"><div class="k">Sales</div><div class="v">PKR ${Number(summary.sales || 0).toLocaleString()}</div></div>
              <div class="kpi"><div class="k">Purchases</div><div class="v">PKR ${Number(summary.purchases || 0).toLocaleString()}</div></div>
              <div class="kpi"><div class="k">Expenses</div><div class="v">PKR ${Number(summary.expenses || 0).toLocaleString()}</div></div>
              <div class="kpi"><div class="k">Net Profit</div><div class="v">PKR ${Number(summary.profit || 0).toLocaleString()}</div></div>
            </div>
            <div class="content">
              <div class="tblWrap">
                <table>
                  <thead><tr>${th}</tr></thead>
                  <tbody>${tableRows || ''}</tbody>
                </table>
              </div>
              <div style="margin-top:10px; color:#64748b; font-size:11px;">Showing first ${Math.min(60, filteredData.length)} rows. Export CSV for full data.</div>
            </div>
            <div class="foot">
              <div>HealthSpire Pharmacy Management System</div>
              <div>Audit</div>
            </div>
          </div>
        </body>
      </html>
    `

    const frame = document.createElement('iframe')
    frame.style.position = 'fixed'
    frame.style.right = '0'
    frame.style.bottom = '0'
    frame.style.width = '0'
    frame.style.height = '0'
    frame.style.border = '0'
    document.body.appendChild(frame)

    const doc = frame.contentWindow?.document
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()
    frame.onload = () => {
      try {
        frame.contentWindow?.focus()
        frame.contentWindow?.print()
      } finally {
        setTimeout(() => {
          try { document.body.removeChild(frame) } catch {}
        }, 200)
      }
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-sm ">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Audit & Analytics</h1>
              <p className="text-sm font-medium text-slate-600">Sales, purchases, inventory value and profit — with custom range analysis</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                <Calendar className="h-3.5 w-3.5" />
                {from} {fromTime} → {to} {toTime}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">From</div>
                <div className="flex gap-2">
                  <div className="w-full">
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  <input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} className="h-9 w-[110px] rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500 ">To</div>
                <div className="flex gap-2">
                  <div className="w-full">
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  <input type="time" value={toTime} onChange={e => setToTime(e.target.value)} className="h-9 w-[110px] rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={setRangeToday} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 ">Today</button>
              <button type="button" onClick={setRangeThisWeek} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 ">This Week</button>
              <button type="button" onClick={setRangeThisMonth} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 ">This Month</button>
              <button type="button" onClick={setRangeThisYear} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 ">This Year</button>
              <button type="button" onClick={apply} className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-sky-200/40 hover:from-sky-700 hover:to-indigo-700">Apply</button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 ">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <button type="button" onClick={printAuditReport} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800 ">
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AuditCard 
          title="Total Sales" 
          value={summary.sales} 
          icon={<ShoppingCart className="h-5 w-5 text-emerald-600" />} 
          color="emerald" 
        />
        <AuditCard 
          title="Total Purchases" 
          value={summary.purchases} 
          icon={<ClipboardList className="h-5 w-5 text-sky-600" />} 
          color="sky" 
        />
        <AuditCard 
          title="Total Expenses" 
          value={summary.expenses} 
          icon={<Wallet className="h-5 w-5 text-rose-600" />} 
          color="rose" 
        />
        <AuditCard 
          title="Net Profit" 
          value={summary.profit} 
          icon={summary.profit >= 0 ? <TrendingUp className="h-5 w-5 text-indigo-600" /> : <TrendingDown className="h-5 w-5 text-rose-600" />} 
          color={summary.profit >= 0 ? "indigo" : "rose"} 
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AuditCard 
          title="Stock Value (Purchase)" 
          value={summary.inventoryPurchaseValue} 
          icon={<Package className="h-5 w-5 text-amber-600" />} 
          color="amber" 
        />
        <AuditCard 
          title="Stock Value (Sale)" 
          value={summary.inventorySaleValue} 
          icon={<Package className="h-5 w-5 text-indigo-600" />} 
          color="indigo" 
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <BarChart3 className="h-4 w-4 text-sky-600" />
              Weekly Sales
            </div>
            <div className="text-xs font-semibold text-slate-500">PKR</div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm" style={{ height: 224, minHeight: 224 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklySales.map(d => ({
                  week: `Wk ${new Date(d.week).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}`,
                  value: d.value,
                }))}
                margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="weeklySalesFillAudit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                    <stop offset="60%" stopColor="#0ea5e9" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(2,132,199,0.08)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const val = Number(payload[0].value || 0)
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
                        <div className="font-semibold text-slate-800">{label}</div>
                        <div className="mt-1 text-slate-600">Sales: <span className="font-bold text-sky-700">PKR {val.toLocaleString()}</span></div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="value" fill="url(#weeklySalesFillAudit)" radius={[12, 12, 8, 8]} stroke="#0ea5e9" strokeOpacity={0.25} isAnimationActive animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Package className="h-4 w-4 text-indigo-600" />
              Comparison
            </div>
            <div className="text-xs font-semibold text-slate-500">Sales vs Purchases vs Expenses</div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm" style={{ height: 224, minHeight: 224 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="cmpSalesAudit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="cmpPurchasesAudit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.35} />
                  </linearGradient>
                  <linearGradient id="cmpExpensesAudit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(15,23,42,0.06)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const val = Number(payload[0].value || 0)
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur ">
                        <div className="font-semibold text-slate-800 ">{label}</div>
                        <div className="mt-1 text-slate-600">Amount: <span className="font-bold">PKR {val.toLocaleString()}</span></div>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[12, 12, 8, 8]}
                  isAnimationActive
                  animationDuration={900}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props
                    const id = String(payload?.label || '')
                    const fill = id === 'Sales' ? 'url(#cmpSalesAudit)' : id === 'Purchases' ? 'url(#cmpPurchasesAudit)' : 'url(#cmpExpensesAudit)'
                    return <rect x={x} y={y} width={width} height={height} rx={12} ry={12} fill={fill} />
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm ">
        <div className="border-b border-slate-200 px-4 ">
          <div className="flex overflow-x-auto py-1">
            <TabButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} label="Sales" />
            <TabButton active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')} label="Purchases" />
            <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} label="Inventory" />
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500 "
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'sales') navigate('/pharmacy/sales-history')
                  else if (activeTab === 'purchases') navigate('/pharmacy/purchase-history')
                  else navigate('/pharmacy/inventory')
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open Full Page
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button 
                type="button"
                onClick={loadData}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                <Calendar className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 ">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                {activeTab === 'sales' && (
                  <tr>
                    <th className="px-4 py-3">Bill #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Profit</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                )}
                {activeTab === 'purchases' && (
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                )}
                {activeTab === 'inventory' && (
                  <tr>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3">Generic</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-right">Buy Price</th>
                    <th className="px-4 py-3 text-right">Sale Price</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400">Loading audit data...</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400">No records found</td></tr>
                ) : filteredData.map((item, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/80">
                    {activeTab === 'sales' && (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.billNo || item.billNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(item.datetime).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-500">{item.customerName || 'Walk-in'}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{Number(item.total).toFixed(0)}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">+{Number(item.profit).toFixed(0)}</td>
                      </>
                    )}
                    {activeTab === 'purchases' && (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.invoice || item.invoiceNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{item.date ? new Date(item.date).toLocaleDateString() : item.datetime ? new Date(item.datetime).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{item.supplierName || item.supplier}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{Number(item.totalAmount || item.total || item.totals?.net || 0).toFixed(0)}</td>
                      </>
                    )}
                    {activeTab === 'inventory' && (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-900 ">{item.name}</td>
                        <td className="px-4 py-3 text-slate-500">{item.genericName || '-'}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{item.onHand ?? item.stock ?? 0}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{Number(item.lastBuyPerUnit ?? item.buyPrice ?? 0).toFixed(0)}</td>
                        <td className="px-4 py-3 text-right font-bold text-navy-600">{Number(item.lastSalePerUnit ?? item.salePrice ?? 0).toFixed(0)}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => handleAuditClick(item)}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">{detailModalTitle}</h3>
              </div>
              <button 
                onClick={closeDetailModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {detailModalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
                </div>
              ) : detailModalContent?.error ? (
                <div className="rounded-xl bg-rose-50 p-4 text-rose-600 dark:bg-rose-900/20">
                  {detailModalContent.error}
                </div>
              ) : activeTab === 'sales' && detailModalContent ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase text-slate-500">Total</div>
                      <div className="mt-1 text-xl font-bold text-slate-900">PKR {Number(detailModalContent.total || 0).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-4">
                      <div className="text-xs font-bold uppercase text-emerald-600">Profit</div>
                      <div className="mt-1 text-xl font-bold text-emerald-600">PKR {Number(detailModalContent.metrics?.totalProfit || 0).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl bg-sky-50 p-4">
                      <div className="text-xs font-bold uppercase text-sky-600">Margin</div>
                      <div className="mt-1 text-xl font-bold text-sky-600">{detailModalContent.metrics?.margin || 0}%</div>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900">Line Items</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Item</th>
                          <th className="px-4 py-2 text-right">Qty</th>
                          <th className="px-4 py-2 text-right">Price</th>
                          <th className="px-4 py-2 text-right">Cost</th>
                          <th className="px-4 py-2 text-right">Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(detailModalContent.lineDetails || []).map((line: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">{line.name}</td>
                            <td className="px-4 py-2 text-right">{line.qty}</td>
                            <td className="px-4 py-2 text-right">{Number(line.unitPrice || 0).toFixed(0)}</td>
                            <td className="px-4 py-2 text-right">{Number(line.costPerUnit || 0).toFixed(0)}</td>
                            <td className="px-4 py-2 text-right font-bold text-emerald-600">+{Number(line.profit || 0).toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeTab === 'purchases' && detailModalContent ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase text-slate-500">Total Amount</div>
                      <div className="mt-1 text-xl font-bold text-slate-900 ">PKR {Number(detailModalContent.metrics?.totalAmount || 0).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl bg-sky-50 p-4">
                      <div className="text-xs font-bold uppercase text-sky-600">Received (Units)</div>
                      <div className="mt-1 text-xl font-bold text-sky-600">{detailModalContent.metrics?.totalReceivedUnits ?? detailModalContent.metrics?.totalItems ?? 0}</div>
                    </div>
                    <div className="rounded-xl bg-indigo-50 p-4">
                      <div className="text-xs font-bold uppercase text-indigo-600">Potential Revenue</div>
                      <div className="mt-1 text-xl font-bold text-indigo-600">PKR {Number(detailModalContent.metrics?.potentialRevenue || 0).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-4 sm:col-span-3">
                      <div className="text-xs font-bold uppercase text-amber-600">Ordered vs Received</div>
                      <div className="mt-1 text-sm text-slate-700">
                        Ordered: <span className="font-bold">{detailModalContent.metrics?.totalOrderedUnits || 0}</span> ·
                        Received: <span className="font-bold">{detailModalContent.metrics?.totalReceivedUnits || 0}</span> ·
                        Shortage: <span className="font-bold text-rose-600">{detailModalContent.metrics?.totalShortageUnits || 0}</span>
                      </div>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900">Line Items</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 ">
                        <tr>
                          <th className="px-4 py-2 text-left">Item</th>
                          <th className="px-4 py-2 text-right">Ordered (Pks)</th>
                          <th className="px-4 py-2 text-right">Received (Pks)</th>
                          <th className="px-4 py-2 text-right">Shortage (Pks)</th>
                          <th className="px-4 py-2 text-right">Ordered (Units)</th>
                          <th className="px-4 py-2 text-right">Received (Units)</th>
                          <th className="px-4 py-2 text-right">Shortage (Units)</th>
                          <th className="px-4 py-2 text-right">Buy/Unit</th>
                          <th className="px-4 py-2 text-right">Buy/Pack</th>
                          <th className="px-4 py-2 text-right">Line Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(detailModalContent.lineDetails || []).map((line: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">{line.name}</td>
                            <td className="px-4 py-2 text-right">{Number(line.orderedPacks || 0)}</td>
                            <td className="px-4 py-2 text-right">{Number(line.receivedPacks || 0)}</td>
                            <td className={`px-4 py-2 text-right ${Number(line.shortagePacks || 0) > 0 ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>{Number(line.shortagePacks || 0)}</td>
                            <td className="px-4 py-2 text-right">{Number(line.orderedUnits || 0)}</td>
                            <td className="px-4 py-2 text-right">{Number(line.totalItems || 0)}</td>
                            <td className={`px-4 py-2 text-right ${Number(line.shortageUnits || 0) > 0 ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>{Number(line.shortageUnits || 0)}</td>
                            <td className="px-4 py-2 text-right">{Number(line.buyPerUnit || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{Number(line.buyPerPack || 0).toFixed(0)}</td>
                            <td className="px-4 py-2 text-right font-bold">{Number(line.lineCost || line.total || 0).toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={async()=>{
                        const { jsPDF } = await import('jspdf')
                        const autoTable = (await import('jspdf-autotable')).default
                        const doc = new jsPDF()
                        doc.setFontSize(16)
                        doc.text('Delivery Discrepancy Report', 14, 16)
                        doc.setFontSize(11)
                        doc.text(`Invoice: ${detailModalContent.invoice || '-'}  Supplier: ${detailModalContent.supplierName || '-'}`, 14, 24)
                        autoTable(doc, {
                          startY: 30,
                          head: [['Item', 'Ordered (Pks)', 'Received (Pks)', 'Shortage (Pks)', 'Ordered (Units)', 'Received (Units)', 'Shortage (Units)', 'Buy/Unit', 'Line Cost']],
                          body: (detailModalContent.lineDetails || []).map((l: any)=>[
                            l.name,
                            String(l.orderedPacks || 0),
                            String(l.receivedPacks || 0),
                            String(l.shortagePacks || 0),
                            String(l.orderedUnits || 0),
                            String(l.totalItems || 0),
                            String(l.shortageUnits || 0),
                            Number(l.buyPerUnit || 0).toFixed(2),
                            Number(l.lineCost || l.total || 0).toFixed(2),
                          ])
                        })
                        doc.save(`discrepancy-${detailModalContent.invoice || 'purchase'}.pdf`)
                      }}
                      className="btn-outline-navy"
                    >
                      Download Discrepancy PDF
                    </button>
                  </div>
                </div>
              ) : activeTab === 'inventory' && detailModalContent ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4 ">
                      <div className="text-xs font-bold uppercase text-slate-500">Current Stock</div>
                      <div className="mt-1 text-xl font-bold text-slate-900">{detailModalContent.item?.onHand || 0}</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-4">
                      <div className="text-xs font-bold uppercase text-amber-600">Stock Value (Cost)</div>
                      <div className="mt-1 text-xl font-bold text-amber-600">PKR {Number(detailModalContent.valuation?.stockValueAtCost || 0).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-4 ">
                      <div className="text-xs font-bold uppercase text-emerald-600">Potential Profit</div>
                      <div className="mt-1 text-xl font-bold text-emerald-600">PKR {Number(detailModalContent.valuation?.potentialProfit || 0).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-4 sm:col-span-3">
                      <div className="text-xs font-bold uppercase text-rose-600">Loss (Adjustments @ Cost)</div>
                      <div className="mt-1 text-xl font-bold text-rose-600">PKR {Number(detailModalContent.metrics?.adjustmentsLossCost || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <History className="h-4 w-4" />
                    <span>Recent Activity</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 ">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 ">
                        <tr>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Reference</th>
                          <th className="px-4 py-2 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 ">
                        {(detailModalContent.history || []).slice(0, 10).map((h: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${h.type === 'sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                                {h.type === 'sale' ? 'Sale' : 'Purchase'}
                              </span>
                            </td>
                            <td className="px-4 py-2">{new Date(h.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{h.reference}</td>
                            <td className="px-4 py-2 text-right">{h.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <History className="h-4 w-4" />
                    <span>Adjustments</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 ">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 ">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Reason</th>
                          <th className="px-4 py-2 text-right">Δ</th>
                          <th className="px-4 py-2 text-right">Old → New</th>
                          <th className="px-4 py-2 text-right">Loss (Cost)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 ">
                        {(detailModalContent.adjustments || []).map((a: any, idx: number) => {
                          const unitCost = Number(detailModalContent.item?.lastBuyPerUnit || 0)
                          const lossCost = Number((Math.max(0, -(Number(a?.delta || 0))) * unitCost).toFixed(2))
                          return (
                            <tr key={idx}>
                              <td className="px-4 py-2">{new Date(a.date).toLocaleString()}</td>
                              <td className="px-4 py-2">
                                <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">{a.reason || '-'}</span>
                              </td>
                              <td className={`px-4 py-2 text-right ${Number(a?.delta || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{Number(a?.delta || 0)}</td>
                              <td className="px-4 py-2 text-right">{a?.old ?? '-'} → {a?.next ?? '-'}</td>
                              <td className="px-4 py-2 text-right font-bold text-rose-600">{lossCost ? `PKR ${lossCost.toLocaleString()}` : '-'}</td>
                            </tr>
                          )
                        })}
                        {(detailModalContent.adjustments || []).length === 0 && (
                          <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No adjustments</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AuditCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const bgMap: any = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/10',
    sky: 'bg-sky-50 dark:bg-sky-900/10',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/10',
    amber: 'bg-amber-50 dark:bg-amber-900/10',
    rose: 'bg-rose-50 dark:bg-rose-900/10'
  }
  
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgMap[color]}`}>
          {icon}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Period</div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-black text-slate-900">PKR {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div className="text-xs font-medium text-slate-500 mt-1">{title}</div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-3 text-sm font-bold transition-all ${
        active 
          ? 'text-navy-600 dark:text-sky-400' 
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-navy-600 " />
      )}
    </button>
  )
}
