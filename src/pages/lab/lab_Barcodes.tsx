import { useEffect, useMemo, useState } from 'react'
import { Search, Calendar, Printer, Eye, Barcode, Download } from 'lucide-react'
import { labApi } from '../../utils/api'
import { printLabTokenSlip } from '../../utils/printLabToken'

type LabTest = { id: string; name: string; price?: number }

type Order = {
  id: string
  createdAt: string
  barcode?: string
  patient: {
    fullName: string
    phone: string
    mrn?: string
    cnic?: string
    guardianName?: string
    guardianRelation?: string
    age?: string
    gender?: string
    address?: string
  }
  tests: string[]
  status: 'received'|'completed'|'returned'
  returnedTests?: string[]
  tokenNo?: string
  sampleTime?: string
  subtotal?: number
  discount?: number
  urgentCharges?: number
  priority?: 'normal'|'urgent'
  net?: number
  receivedAmount?: number
  receivableAmount?: number
  referringConsultant?: string
}

function formatDateTime(iso: string) {
  const d = new Date(iso); return d.toLocaleDateString() + ', ' + d.toLocaleTimeString()
}

function formatDateTimeParts(iso: string) {
  const d = new Date(iso)
  return { date: d.toLocaleDateString(), time: d.toLocaleTimeString() }
}

function makeDefaultBarcode(tokenNo: string) {
  const clean = String(tokenNo || '').replace(/[^a-z0-9]/gi, '').slice(-8)
  const year = new Date().getFullYear()
  return `BC-${year}-${clean || '00000000'}`
}

function makeBarcodeDataUrl(code: string, opts?: { width?: number; height?: number }) {
  const val = String(code || '').trim()
  if (!val) return ''

  const widths: string[] = [
    '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'
  ]

  const toCode128B = (s: string) => {
    const safe = Array.from(String(s || '')).filter(ch => {
      const c = ch.charCodeAt(0)
      return c >= 32 && c <= 126
    }).join('')
    const dataCodes = Array.from(safe).map(ch => ch.charCodeAt(0) - 32)
    const start = 104
    let sum = start
    for (let i = 0; i < dataCodes.length; i++) sum += dataCodes[i] * (i + 1)
    const check = ((sum % 103) + 103) % 103
    return { text: safe || ' ', codes: [start, ...dataCodes, check, 106] }
  }

  const enc = toCode128B(val)
  const quiet = 10
  const modules = quiet * 2 + enc.codes.reduce((s, c) => {
    const w = widths[c] || ''
    return s + Array.from(w).reduce((a, d) => a + Number(d || 0), 0)
  }, 0)

  const widthPx = Math.max(360, Number(opts?.width || 560))
  const heightPx = Math.max(140, Number(opts?.height || 180))
  const canvas = document.createElement('canvas')
  canvas.width = widthPx
  canvas.height = heightPx
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, widthPx, heightPx)

  const fontPx = 12
  const textAreaH = fontPx + 18
  const topPad = 10
  const barsH = Math.max(60, heightPx - topPad - textAreaH)
  const mod = (widthPx - 2) / Math.max(1, modules)
  let x = 1 + quiet * mod
  let isBar = true
  ctx.fillStyle = '#0f172a'

  for (let i = 0; i < enc.codes.length; i++) {
    const pat = widths[enc.codes[i]]
    if (!pat) continue
    for (let j = 0; j < pat.length; j++) {
      const w = Number(pat[j]) || 0
      const wpx = w * mod
      if (isBar) ctx.fillRect(x, topPad, wpx, barsH)
      x += wpx
      isBar = !isBar
    }
  }

  ctx.fillStyle = '#0f172a'
  ctx.font = `${fontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(enc.text, widthPx / 2, topPad + barsH + (textAreaH / 2))

  return canvas.toDataURL('image/png')
}

export default function Lab_Barcodes() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tests, setTests] = useState<LabTest[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const testsMap = useMemo(() => Object.fromEntries(tests.map(t => [t.id, t.name])), [tests])
  const testsPriceMap = useMemo(() => Object.fromEntries(tests.map(t => [t.id, Number(t.price||0)])), [tests])

  // Filters
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState<'all' | 'received' | 'completed' | 'returned' | 'delayed'>('all')
  const [priority, setPriority] = useState<'all'|'normal'|'urgent'>('all')
  const [rows, setRows] = useState(20)
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState<{ text: string; kind: 'success'|'error' } | null>(null)

  useEffect(()=>{
    let mounted = true
    ;(async()=>{
      try {
        const statusParam = status === 'delayed' ? 'received' : (status === 'all' ? undefined : status)
        const [ordRes, tstRes] = await Promise.all([
          labApi.listOrders({ q: q || undefined, from: from || undefined, to: to || undefined, status: statusParam as any, page, limit: rows }),
          labApi.listTests({ limit: 1000 }),
        ])
        if (!mounted) return
        let items: Order[] = (ordRes.items||[]).map((x:any)=>({
          id: x._id,
          createdAt: x.createdAt || new Date().toISOString(),
          barcode: x.barcode || x.sampleBarcode || x.tokenBarcode,
          patient: x.patient || { fullName: '-', phone: '' },
          tests: x.tests || [],
          status: x.status || 'received',
          returnedTests: Array.isArray(x.returnedTests)? x.returnedTests : [],
          tokenNo: x.tokenNo,
          sampleTime: x.sampleTime,
          subtotal: Number(x.subtotal||0),
          discount: Number(x.discount||0),
          urgentCharges: Number(x.urgentCharges||0),
          priority: String(x.priority||'normal') === 'urgent' ? 'urgent' : 'normal',
          net: Number(x.net||0),
          receivedAmount: Number(x.receivedAmount||0),
          receivableAmount: Number(x.receivableAmount||0),
          referringConsultant: x.referringConsultant,
        }))

        // Apply priority filter client-side
        if (priority !== 'all') {
          items = items.filter((x: any) => String(x.priority || 'normal') === priority)
        }

        if (status === 'delayed') {
          const thresholdMs = 60 * 60 * 1000
          const now = Date.now()
          const delayed = items.filter(o => {
            const created = new Date(o.createdAt).getTime()
            const oldEnough = !isNaN(created) ? (now - created >= thresholdMs) : false
            return (o.status === 'received') && !String(o.sampleTime || '').trim() && oldEnough
          })
          setOrders(delayed)
          setTotal(delayed.length)
          setTotalPages(1)
        } else {
          setTotal(Number(ordRes.total||items.length||0))
          setTotalPages(Number(ordRes.totalPages||1))
        }

        setTests((tstRes.items||[]).map((t:any)=>({ id: t._id, name: t.name, price: Number(t.price||0) })))
      } catch(e){
        console.error(e)
        setOrders([])
        setTests([])
        setTotal(0)
        setTotalPages(1)
      }
    })()
    return ()=>{ mounted = false }
  }, [q, from, to, status, priority, page, rows])

  const pageCount = totalPages
  const curPage = Math.min(page, pageCount)
  const start = Math.min((curPage - 1) * rows + 1, total)
  const end = Math.min((curPage - 1) * rows + orders.length, total)
  const items = orders

  // View details dialog state
  const [viewOpen, setViewOpen] = useState(false)
  const [viewOrderId, setViewOrderId] = useState<string | null>(null)
  const viewOrder = viewOrderId ? orders.find(o => o.id === viewOrderId) : null
  const viewToken = viewOrder ? (viewOrder.tokenNo || genToken(viewOrder.createdAt, viewOrder.id)) : ''
  const viewTests = viewOrder ? Array.from(new Set((orders.filter(x => (x.tokenNo || genToken(x.createdAt, x.id)) === viewToken)).flatMap(x => x.tests))) : []

  const downloadRegister = () => {
    const win = window.open('', 'print', 'width=900,height=700')
    if (!win) return
    const rowsHtml = items.map(o => {
      const token = o.tokenNo || genToken(o.createdAt, o.id)
      return o.tests.map(tid => {
        const tname = testsMap[tid] || '-'
        return `<tr>
          <td>${formatDateTime(o.createdAt)}</td>
          <td>${escapeHtml(o.patient.fullName)}</td>
          <td>${token}</td>
          <td>${escapeHtml(tname)}</td>
          <td>${escapeHtml(o.patient.mrn || '-')}</td>
          <td>${escapeHtml(o.patient.phone || '-')}</td>
          <td>${o.sampleTime || '-'}</td>
          <td>${o.status}</td>
        </tr>`
      }).join('')
    }).join('')
    win.document.write(`<!doctype html><html><head><title>Daily Register</title>
      <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;padding:24px;color:#0f172a}
        h1{font-size:18px;margin:0 0 12px 0}
        .meta{font-size:12px;color:#475569;margin-bottom:12px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #e2e8f0;padding:6px;text-align:left}
        th{background:#f8fafc}
      </style>
    </head><body>`)
    win.document.write(`<h1>Lab Daily Register</h1>`)
    win.document.write(`<div class="meta">Generated: ${new Date().toLocaleString()}</div>`)
    win.document.write(`<div class="meta">Filters — Status: ${status}, From: ${from||'-'} To: ${to||'-'}; Search: ${q||'-'}; Page Count: ${total}</div>`)
    win.document.write(`<table><thead><tr>
      <th>Date</th><th>Patient</th><th>Token</th><th>Tests</th><th>MR No</th><th>Phone</th><th>Sample Time</th><th>Status</th>
    </tr></thead><tbody>${rowsHtml}</tbody></table>`)
    win.document.write('</body></html>')
    win.document.close(); win.focus(); win.print();
  }

  const setSampleTimeFor = async (id: string, t: string) => {
    try { await labApi.updateOrderTrack(id, { sampleTime: t }) } catch(e){ console.error(e) }
    setOrders(prev => prev.map(o => o.id===id ? { ...o, sampleTime: t } : o))
  }

  const printToken = async (id: string) => {
    const o = orders.find(x => x.id === id); if (!o) return
    const tokenNo = o.tokenNo || genToken(o.createdAt, id)
    const sameToken = orders.filter(x => (x.tokenNo || genToken(x.createdAt, x.id)) === tokenNo)
    const testIds = Array.from(new Set(sameToken.flatMap(x => x.tests)))
    const priceByTestId: Record<string, number> = {}
    sameToken.forEach(x => {
      const t = (x.tests||[])[0]
      if (t && priceByTestId[t] == null) priceByTestId[t] = Number(x.subtotal||0)
    })
    const rows = testIds.map(tid => ({ name: testsMap[tid] || tid, price: (priceByTestId[tid] != null) ? Number(priceByTestId[tid]) : Number(testsPriceMap[tid] || 0) }))
    const subtotal = rows.reduce((s,r)=> s + Number(r.price||0), 0)
    const discount = sameToken.reduce((s,x)=> s + Number(x.discount||0), 0)
    const urgentCharges = sameToken.reduce((s,x)=> s + (String((x as any).priority||'normal') === 'urgent' ? Number((x as any).urgentCharges||0) : 0), 0)
    const priority = urgentCharges > 0 ? 'urgent' : 'normal'
    const net = Math.max(0, subtotal - discount + urgentCharges)

    let age: string | undefined = (o as any)?.patient?.age ? String((o as any).patient.age) : undefined
    let gender: string | undefined = (o as any)?.patient?.gender ? String((o as any).patient.gender) : undefined
    try {
      if (!age || !gender){
        let p: any = null
        if (o.patient?.mrn){
          const r: any = await labApi.getPatientByMrn(o.patient.mrn).catch(()=>null)
          p = r?.patient || r
        } else if (o.patient?.phone){
          const r: any = await labApi.searchPatients({ phone: o.patient.phone, limit: 1 }).catch(()=>null)
          p = (r?.items?.[0]) || (Array.isArray(r)? r[0] : null)
        }
        if (p){
          if (!gender && p.gender) gender = String(p.gender)
          if (!age){
            if (p.age) age = String(p.age)
            else if (p.dateOfBirth || p.dob){
              const dob = String(p.dateOfBirth || p.dob)
              const d = new Date(dob); const now = new Date();
              if (!isNaN(d.getTime())){
                let years = now.getFullYear() - d.getFullYear();
                const m = now.getMonth() - d.getMonth();
                if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--
                age = String(years)
              }
            }
          }
        }
      }
    } catch {}

    let printedBy = ''
    try {
      const raw = localStorage.getItem('lab.session')
      if (raw){ const s = JSON.parse(raw||'{}'); printedBy = s?.username || s?.user?.username || '' }
      if (!printedBy){
        const d = localStorage.getItem('diagnostic.user'); if (d){ const u = JSON.parse(d||'{}'); printedBy = u?.username || u?.name || '' }
      }
      if (!printedBy){
        const h = localStorage.getItem('hospital.session'); if (h){ const u = JSON.parse(h||'{}'); printedBy = u?.username || '' }
      }
    } catch {}

    await printLabTokenSlip({ tokenNo, createdAt: o.createdAt, patient: { fullName: o.patient.fullName, mrn: o.patient.mrn, phone: o.patient.phone, gender, age }, tests: rows, subtotal, discount, urgentCharges, priority: priority as any, net, receivedAmount: Number(o.receivedAmount||0), receivableAmount: Number(o.receivableAmount||0), printedBy })
  }

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignOrderId, setAssignOrderId] = useState<string | null>(null)
  const assignOrder = assignOrderId ? orders.find(o => o.id === assignOrderId) : null
  const assignToken = assignOrder ? (assignOrder.tokenNo || genToken(assignOrder.createdAt, assignOrder.id)) : ''
  const isBarcodeAlreadyAssigned = !!String(assignOrder?.barcode || '').trim()
  const [assignBarcode, setAssignBarcode] = useState('')
  const [barcodePreviewUrl, setBarcodePreviewUrl] = useState<string>('')
  const [assignBusy, setAssignBusy] = useState(false)

  useEffect(() => {
    const code = String(assignBarcode || '').trim()
    if (!code) { setBarcodePreviewUrl(''); return }
    setBarcodePreviewUrl('')
    try {
      const url = makeBarcodeDataUrl(code, { width: 560, height: 180 })
      setBarcodePreviewUrl(String(url || ''))
    } catch {
      setBarcodePreviewUrl('')
    }
  }, [assignBarcode])

  const openAssign = (orderId: string) => {
    const o = orders.find(x => x.id === orderId)
    if (!o) return
    setAssignOrderId(orderId)
    const existing = String(o.barcode || '').trim()
    setAssignBarcode(existing || makeDefaultBarcode(o.tokenNo || genToken(o.createdAt, o.id)))
    setAssignOpen(true)
  }

  const closeAssign = () => {
    setAssignOpen(false)
    setAssignBusy(false)
    setAssignOrderId(null)
    setAssignBarcode('')
    setBarcodePreviewUrl('')
  }

  const saveAssign = async () => {
    if (!assignOrderId) return
    if (isBarcodeAlreadyAssigned) { setNotice({ kind: 'error', text: 'Barcode already assigned' }); return }
    const code = String(assignBarcode || '').trim()
    if (!code) { setNotice({ kind: 'error', text: 'Barcode is required' }); return }
    setAssignBusy(true)
    try {
      if (typeof (labApi as any).assignOrderBarcode === 'function') {
        await (labApi as any).assignOrderBarcode(assignOrderId, { barcode: code })
      } else {
        await (labApi as any).updateOrderTrack(assignOrderId, { barcode: code } as any)
      }
      setOrders(prev => prev.map(o => o.id === assignOrderId ? { ...o, barcode: code } : o))
      setNotice({ kind: 'success', text: 'Barcode assigned successfully' })
      closeAssign()
    } catch (e: any) {
      console.error(e)
      setNotice({ kind: 'error', text: e?.message || 'Failed to assign barcode' })
      setAssignBusy(false)
    }
  }

  const downloadPreview = () => {
    if (!barcodePreviewUrl) return
    const a = document.createElement('a')
    a.href = barcodePreviewUrl
    a.download = `${assignToken || 'barcode'}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const printPreview = () => {
    if (!barcodePreviewUrl) return
    const win = window.open('', 'print', 'width=800,height=600')
    if (!win) return
    const safeTitle = String(assignBarcode || assignToken || 'Barcode').replace(/[<>]/g, '')
    win.document.write(`<!doctype html><html><head><title>${safeTitle}</title>
      <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:0;padding:24px;color:#0f172a}
        .wrap{display:flex;flex-direction:column;align-items:center;gap:10px}
        img{max-width:100%;height:auto}
        @media print{ body{padding:0} }
      </style>
    </head><body>
      <div class="wrap">
        <img id="barcode-img" src="${barcodePreviewUrl}" alt="Barcode" />
      </div>
      <script>
        (function(){
          var img = document.getElementById('barcode-img');
          var done = false;
          function go(){
            if (done) return;
            done = true;
            try { window.focus(); } catch(e) {}
            try { window.print(); } catch(e) {}
          }
          if (!img) { go(); return; }
          if (img.complete) { setTimeout(go, 50); return; }
          img.onload = function(){ setTimeout(go, 50); };
          img.onerror = function(){ setTimeout(go, 50); };
          setTimeout(go, 1200);
        })();
      </script>
    </body></html>`)
    win.document.close()
  }

  return (
    <div className="space-y-4 p-3 md:p-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4">
        <div className="text-2xl font-bold text-slate-900">Barcodes</div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="min-w-0 w-full">
            <label className="mb-1 block text-xs text-slate-500">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={q} onChange={e=>{ setQ(e.target.value); setPage(1) }} placeholder="Search by sample ID, patient, or test..." className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" />
            </div>
          </div>

          <div className="min-w-0 w-full">
            <label className="mb-1 block text-xs text-slate-500">From</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="date" value={from} onChange={e=>{ setFrom(e.target.value); setPage(1) }} className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900" />
            </div>
          </div>

          <div className="min-w-0 w-full">
            <label className="mb-1 block text-xs text-slate-500">To</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="date" value={to} onChange={e=>{ setTo(e.target.value); setPage(1) }} className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900" />
            </div>
          </div>

          <div className="min-w-0 w-full">
            <label className="mb-1 block text-xs text-slate-500">Status</label>
            <select value={status} onChange={e=>{ setStatus(e.target.value as any); setPage(1) }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900">
              <option value="all">All</option>
              <option value="received">Received</option>
              <option value="completed">Completed</option>
              <option value="returned">Return</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>

          <div className="min-w-0 w-full">
            <label className="mb-1 block text-xs text-slate-500">Priority</label>
            <select value={priority} onChange={e=>{ setPriority(e.target.value as any); setPage(1) }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900">
              <option value="all">All</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="min-w-0 w-full">
            <label className="mb-1 block text-xs text-slate-500">Rows</label>
            <select value={rows} onChange={e=>{ setRows(Number(e.target.value)); setPage(1) }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={downloadRegister} className="w-full sm:w-auto rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Download Daily Register</button>
        </div>
        {notice && (
          <div className={`mt-3 rounded-md border px-3 py-2 text-sm ${notice.kind==='success'? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{notice.text}</div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm lg:min-w-0">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-2 py-1 md:py-2 lg:px-4 lg:py-2">Barcode</th>
              <th className="px-2 py-1 md:py-2 lg:px-4 lg:py-2">DateTime</th>
              <th className="px-2 py-1 md:py-2 lg:px-4 lg:py-2">Patient</th>
              <th className="px-2 py-1 md:py-2 lg:px-4 lg:py-2">Token No</th>
              <th className="px-2 py-1 md:py-2 lg:px-4 lg:py-2">Test(s)</th>
              <th className="px-2 py-1 md:py-2 lg:px-4 lg:py-2">Priority</th>
              <th className="hidden px-2 py-1 md:py-2 lg:px-4 lg:py-2 md:table-cell">MR No</th>
              <th className="hidden px-2 py-1 md:py-2 lg:px-4 lg:py-2 lg:table-cell">Phone</th>
              <th className="hidden px-2 py-1 md:py-2 lg:px-4 lg:py-2 sm:table-cell">Sample Time</th>
              <th className="px-2 py-1 md:py-2 lg:px-4 lg:py-2">Status</th>
              <th className="px-2 py-1 md:py-2 lg:px-4 lg:py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.reduce((acc: any[], o) => {
              const token = o.tokenNo || genToken(o.createdAt, o.id)
              const assigned = String(o.barcode || '').trim()
              o.tests.forEach((tid, idx) => {
                const tname = testsMap[tid] || '—'
                const isReturned = Array.isArray(o.returnedTests) ? o.returnedTests.map(String).includes(String(tid)) : false
                const rowStatus = isReturned ? 'returned' : o.status
                const dt = formatDateTimeParts(o.createdAt)
                acc.push(
                  <tr key={`${o.id}-${tid}-${idx}`} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/70">
                    <td className="px-2 py-1 md:py-2 lg:px-4 lg:py-2 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-700">{assigned || '-'}</span>
                    </td>
                    <td className="px-2 py-1 md:py-2 lg:px-4 lg:py-2 whitespace-nowrap">
                      <div className="leading-tight">
                        <div>{dt.date}</div>
                        <div className="text-xs text-slate-500">{dt.time}</div>
                      </div>
                    </td>
                    <td className="px-2 py-1 md:py-2 lg:px-4 lg:py-2 whitespace-nowrap">{o.patient.fullName}</td>
                    <td className="px-2 py-1 md:py-2 lg:px-4 lg:py-2 whitespace-nowrap">{token}</td>
                    <td className="px-2 py-1 md:py-2 lg:px-4 lg:py-2">{tname}</td>
                    <td className="px-2 py-1 md:py-2 lg:px-4 lg:py-2 whitespace-nowrap">{String((o as any).priority || 'normal') === 'urgent' ? 'Urgent' : 'Normal'}</td>
                    <td className="hidden px-2 py-1 md:py-2 lg:px-4 lg:py-2 whitespace-nowrap md:table-cell">{o.patient.mrn || '-'}</td>
                    <td className="hidden px-2 py-1 md:py-2 lg:px-4 lg:py-2 whitespace-nowrap lg:table-cell">{o.patient.phone || '-'}</td>
                    <td className="hidden px-2 py-1 md:py-2 lg:px-4 lg:py-2 whitespace-nowrap sm:table-cell">
                      <input type="time" value={o.sampleTime || ''} onChange={e=>setSampleTimeFor(o.id, e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-900" />
                    </td>
                    <td className="px-2 py-1 md:py-2 lg:px-4 lg:py-2 whitespace-nowrap">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${rowStatus==='completed'?'bg-emerald-100 text-emerald-700':(rowStatus==='returned'?'bg-rose-100 text-rose-700':'bg-slate-100 text-slate-700')}`}>{rowStatus}</span>
                    </td>
                    <td className="px-2 py-1 md:py-2 lg:px-4 lg:py-2 whitespace-nowrap">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={()=>{ setViewOrderId(o.id); setViewOpen(true) }}
                          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
                          aria-label="View"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-slate-700" />
                        </button>
                        <button
                          type="button"
                          onClick={()=>printToken(o.id)}
                          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
                          aria-label="Print Token"
                          title="Print Token"
                        >
                          <Printer className="h-4 w-4 text-slate-700" />
                        </button>
                        <button
                          type="button"
                          onClick={()=>openAssign(o.id)}
                          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
                          aria-label="Assign Barcode"
                          title={assigned ? 'View Barcode' : 'Assign Barcode'}
                        >
                          <Barcode className="h-4 w-4 text-slate-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
              return acc
            }, [] as any[])}
          </tbody>
          </table>
          {orders.length === 0 && (
            <div className="p-6 text-sm text-slate-500">No samples found</div>
          )}
        </div>
      </div>

      {assignOpen && assignOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-start justify-between px-5 pt-4">
              <div>
                <div className="text-base font-semibold text-slate-900">Assign Barcode</div>
                <div className="mt-0.5 text-xs text-slate-500">Generate and assign a barcode to this sample.</div>
              </div>
              <button type="button" onClick={closeAssign} className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100">×</button>
            </div>

            <div className="px-5 pb-4 pt-4 text-sm text-slate-700">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Sample ID</label>
                  <input value={assignToken} readOnly className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Patient Name</label>
                  <input value={assignOrder.patient.fullName || '-'} readOnly className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900" />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">Tests</label>
                <input value={(assignOrder.tests || []).map(tid => testsMap[tid] || tid).join(', ') || '-'} readOnly className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900" />
              </div>

              <div className="mt-4">
                <div className="mb-2 text-xs font-medium text-slate-500">Generated Barcode</div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Barcode</label>
                  <input
                    value={assignBarcode}
                    onChange={e=>setAssignBarcode(e.target.value)}
                    readOnly={isBarcodeAlreadyAssigned}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 read-only:bg-slate-50"
                    placeholder="Enter barcode"
                  />
                  <div className="mt-3 flex items-center justify-center rounded-md border border-slate-200 bg-white p-3">
                    {barcodePreviewUrl ? (
                      <img key={String(assignBarcode || '').trim()} src={barcodePreviewUrl} alt="Barcode" className="h-auto w-full max-w-[520px]" />
                    ) : (
                      <div className="text-xs text-slate-500">Enter a barcode to preview</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={downloadPreview} disabled={!barcodePreviewUrl} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button type="button" onClick={printPreview} disabled={!barcodePreviewUrl} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button type="button" onClick={closeAssign} disabled={assignBusy} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Close
                </button>
                <button type="button" onClick={saveAssign} disabled={assignBusy || isBarcodeAlreadyAssigned || !String(assignBarcode||'').trim()} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40">
                  {assignBusy ? 'Assigning...' : 'Assign Barcode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewOpen && viewOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div className="text-base font-semibold text-slate-800">Token Details</div>
              <button type="button" onClick={()=>{ setViewOpen(false); setViewOrderId(null) }} className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-slate-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-500">Token No</div>
                  <div className="mt-1 font-mono text-slate-900">{viewToken}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-500">Barcode</div>
                  <div className="mt-1 font-mono text-slate-900">{String((viewOrder as any)?.barcode || '-')}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-500">DateTime</div>
                  <div className="mt-1 text-slate-900">{formatDateTime(viewOrder.createdAt)}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-500">Patient</div>
                  <div className="mt-1 text-slate-900">{viewOrder.patient.fullName}</div>
                  <div className="mt-1 text-xs text-slate-600">MR No: {viewOrder.patient.mrn || '-'}</div>
                  <div className="text-xs text-slate-600">Phone: {viewOrder.patient.phone || '-'}</div>
                  <div className="text-xs text-slate-600">CNIC: {viewOrder.patient.cnic || '-'}</div>
                  <div className="text-xs text-slate-600">Father/Guardian: {viewOrder.patient.guardianName || '-'}</div>
                  <div className="text-xs text-slate-600">Age/Gender: {viewOrder.patient.age || '-'} / {viewOrder.patient.gender || '-'}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-500">Billing</div>
                  <div className="mt-1 text-slate-900">Subtotal: {Number(viewOrder.subtotal||0).toFixed(2)}</div>
                  <div className="text-slate-900">Discount: {Number(viewOrder.discount||0).toFixed(2)}</div>
                  <div className="text-slate-900">Net: {Number(viewOrder.net||0).toFixed(2)}</div>
                  <div className="mt-1 text-xs text-slate-600">Referring: {viewOrder.referringConsultant || '-'}</div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500">Tests</div>
                <div className="p-4">
                  {viewTests.length ? (
                    <div className="flex flex-wrap gap-2">
                      {viewTests.map(tid => (
                        <span key={tid} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">{testsMap[tid] || tid}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No tests</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button type="button" onClick={()=>{ setViewOpen(false); setViewOrderId(null) }} className="btn-outline-navy">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>{total === 0 ? '0' : `${start}-${end}`} of {total}</div>
        <div className="flex items-center gap-2">
          <span>Page</span>
          <span>{curPage} / {pageCount}</span>
        </div>
      </div>
    </div>
  )
}

function genToken(dateIso: string, id: string) {
  const d = new Date(dateIso)
  const part = `${d.getDate().toString().padStart(2,'0')}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getFullYear()}`
  return `D${part}_${id.slice(-3)}`
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
