import { useEffect, useMemo, useState } from 'react'
import { pharmacyApi } from '../../utils/api'
type Line = { name: string; qty: number; price: number; discountRs?: number; lineTaxType?: 'percent' | 'fixed'; lineTaxValue?: number; packMode?: 'loose' | 'pack' }

type Props = {
  open: boolean
  onClose: () => void
  receiptNo: string
  method: 'cash' | 'credit'
  lines: Line[]
  discountPct?: number
  lineDiscountRs?: number
  lineGstSum?: number  // Pre-calculated line GST total
  customer?: string
  customerPhone?: string
  autoPrint?: boolean
  datetime?: string
  billGstType?: 'percent' | 'fixed'
  billGstValue?: number
  billGstAmount?: number  // Pre-calculated bill GST amount
  cashReceived?: number
  changeReturn?: number
}

export default function Pharmacy_POSReceiptDialog({ open, onClose, receiptNo, method, lines, discountPct = 0, lineDiscountRs = 0, lineGstSum: lineGstSumProp, customer, customerPhone, autoPrint, datetime, billGstType = 'percent', billGstValue = 0, billGstAmount: billGstAmountProp, cashReceived, changeReturn }: Props) {
  if (!open) return null

  const withLineDiscount = useMemo(() => {
    const normalized = (lines || []).map(l => ({
      ...l,
      discountRs: Math.max(0, Number((l as any).discountRs || 0)),
      lineTaxType: (l as any).lineTaxType || 'percent',
      lineTaxValue: Number((l as any).lineTaxValue || 0),
      packMode: (l as any).packMode || 'loose',
    }))
    const sum = lineDiscountRs || normalized.reduce((s, l) => s + Number(l.discountRs || 0), 0)
    // Calculate line GST total (or use pre-calculated if provided)
    const lineGstSumCalc = normalized.reduce((s, l) => {
      const lineTotal = l.price * l.qty - (l.discountRs || 0)
      if (l.lineTaxType === 'percent') {
        return s + (lineTotal * (l.lineTaxValue || 0) / 100)
      } else {
        return s + ((l.lineTaxValue || 0) * l.qty)
      }
    }, 0)
    return { lines: normalized, sum: Math.round(sum * 100) / 100, lineGstSum: lineGstSumProp || Math.round(lineGstSumCalc * 100) / 100 }
  }, [lines, lineDiscountRs, lineGstSumProp])

  const subtotal = withLineDiscount.lines.reduce((s, l) => s + l.price * l.qty, 0)
  // Bill discount applies on (subtotal - line discounts)
  const billDisc = Math.max(0, ((subtotal - withLineDiscount.sum) * (discountPct || 0)) / 100)
  // Bill GST applies on (subtotal - line discounts - bill discount)
  const billGstBase = Math.max(0, subtotal - withLineDiscount.sum - billDisc)
  let billGstCalc = 0
  if (billGstAmountProp != null) {
    // Use pre-calculated bill GST amount if provided
    billGstCalc = billGstAmountProp
  } else if (billGstType === 'percent') {
    billGstCalc = billGstBase * (billGstValue || 0) / 100
  } else {
    billGstCalc = billGstValue || 0
  }
  const total = subtotal - withLineDiscount.sum - billDisc + withLineDiscount.lineGstSum + billGstCalc
  const totalSaved = withLineDiscount.sum + billDisc
  const [info, setInfo] = useState<{ name: string; phone: string; address: string; footer: string; logo: string; license: string; email: string }>({
    name: 'PHARMACY',
    phone: '',
    address: '',
    footer: 'Thank you for your purchase!',
    logo: '',
    license: '',
    email: ''
  })

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const s = await pharmacyApi.getSettings()
          if (!mounted) return
          setInfo({
            name: s.pharmacyName || 'PHARMACY',
            phone: s.phone || '',
            address: s.address || '',
            footer: s.billingFooter || 'Thank you for your purchase!',
            logo: s.logoDataUrl || '',
            license: s.license || '',
            email: s.email || '',
          })
        } catch (e) { console.error(e) }
      })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault()
        onClose()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        window.print()
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    if (!autoPrint) return
    const t = setTimeout(() => {
      try { window.print() } catch { }
    }, 150)
    return () => clearTimeout(t)
  }, [open, autoPrint])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        #pharmacy-receipt { font-family: 'Poppins', Arial, sans-serif; color: #000; }
        .tabular-nums { font-variant-numeric: tabular-nums }
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; }
          body * { visibility: hidden !important; }
          #pharmacy-receipt, #pharmacy-receipt * { visibility: visible !important; }
          #pharmacy-receipt { 
            position: absolute !important; 
            left: 0; 
            top: 0; 
            width: 100% !important; 
            max-width: 100% !important;
            margin: 0 !important; 
            padding: 10px !important;
            box-sizing: border-box !important;
          }
          .no-print { display: none !important; }
        }
        #pharmacy-receipt .receipt-header { text-align: center; margin-bottom: 10px; display: flex; flex-direction: column; align-items: center; }
        #pharmacy-receipt .pharmacy-logo { max-height: 50px; margin-bottom: 8px; }
        #pharmacy-receipt .pharmacy-name { font-size: 1.25rem; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
        #pharmacy-receipt .pharmacy-address { font-size: 0.75rem; color: #333; margin-bottom: 2px; line-height: 1.2; }
        #pharmacy-receipt .pharmacy-contact { font-size: 0.75rem; color: #333; margin-bottom: 2px; }
        #pharmacy-receipt .license-no { font-size: 0.7rem; font-weight: 600; color: #000; margin-top: 4px; border: 1px solid #000; padding: 2px 6px; display: inline-block; border-radius: 4px; }
        #pharmacy-receipt .divider { border-top: 1px dashed #000; margin: 8px 0; }
        #pharmacy-receipt .retail-invoice-title { text-align: center; font-weight: 700; text-transform: uppercase; margin: 10px 0; font-size: 0.85rem; letter-spacing: 0.05em; }
        #pharmacy-receipt .info-grid { display: flex; flex-direction: column; font-size: 0.75rem; row-gap: 4px; margin-bottom: 10px; }
        #pharmacy-receipt .info-row { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; }
        #pharmacy-receipt .info-label { color: #000; flex: 0 0 80px; }
        #pharmacy-receipt .info-value { text-align: right; font-weight: 500; color: #000; flex: 1; }
        #pharmacy-receipt .items-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-top: 10px; }
        #pharmacy-receipt .items-table th { text-align: left; text-transform: uppercase; font-weight: 700; border-bottom: 1px dashed #000; border-top: 1px dashed #000; padding: 5px 0; }
        #pharmacy-receipt .items-table td { padding: 5px 0; vertical-align: top; border-bottom: 1px dotted #000; }
        #pharmacy-receipt .items-table tr:last-child td { border-bottom: none; }
        #pharmacy-receipt .items-table .text-right { text-align: right; }
        #pharmacy-receipt .items-table .text-center { text-align: center; }
        #pharmacy-receipt .totals-section { margin-top: 8px; font-size: 0.75rem; border-top: 1px dashed #000; padding-top: 8px; }
        #pharmacy-receipt .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        #pharmacy-receipt .total-row.grand-total { font-weight: 700; font-size: 0.85rem; margin-top: 5px; }
        #pharmacy-receipt .savings-box { 
          border: 1px dashed #000; 
          border-radius: 12px; 
          text-align: center; 
          padding: 8px; 
          margin: 15px 0; 
          font-weight: 700; 
          font-size: 0.8rem;
        }
        #pharmacy-receipt .footer { text-align: center; font-size: 0.75rem; color: #000; font-weight: 500; margin-top: 10px; }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-6 print:static print:p-0 print:bg-white" role="dialog" aria-modal="true">
        <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 print:shadow-none print:ring-0 print:rounded-none print:max-w-none print:bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 print:hidden no-print">
            <div className="font-medium text-slate-900">Receipt {receiptNo}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">Print (Ctrl+P)</button>
              <button onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">Close (Ctrl+Q)</button>
            </div>
          </div>

          <div className="max-h-[85vh] overflow-y-auto px-10 py-8 print:p-0 print:overflow-visible">
            <div id="pharmacy-receipt" className="mx-auto w-full">
              <div className="receipt-header">
                {info.logo && <img src={info.logo} alt="Logo" className="pharmacy-logo" />}
                <div className="pharmacy-name">{info.name}</div>
                {info.address && <div className="pharmacy-address">{info.address}</div>}
                <div className="pharmacy-contact">
                  {info.phone && <span>Tel: {info.phone}</span>}
                  {info.phone && info.email && <span className="mx-1">|</span>}
                  {info.email && <span>Email: {info.email}</span>}
                </div>
                {info.license && <div className="license-no">License: {info.license}</div>}
              </div>

              <div className="divider" />
              <div className="retail-invoice-title">Invoice</div>

              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Date</span>
                  <span className="info-value">{(datetime ? new Date(datetime) : new Date()).toLocaleString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }).replace(',', '')}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Customer</span>
                  <span className="info-value">{customer || 'Walk-in'}</span>
                </div>

                {customerPhone && (
                  <div className="info-row">
                    <span className="info-label">Phone</span>
                    <span className="info-value tabular-nums">{customerPhone}</span>
                  </div>
                )}

                <div className="info-row">
                  <span className="info-label">Bill No</span>
                  <span className="info-value">{receiptNo}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Payment</span>
                  <span className="info-value">{method.toUpperCase()}</span>
                </div>
              </div>

              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Medicine</th>
                    <th style={{ width: '15%' }} className="text-center">Qty</th>
                    <th style={{ width: '15%' }} className="text-right">Amount</th>
                    <th style={{ width: '15%' }} className="text-right">Disc</th>
                    <th style={{ width: '15%' }} className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {withLineDiscount.lines.map((l, idx) => {
                    const lineSubtotal = l.price * l.qty;
                    const lineTotal = lineSubtotal - (l.discountRs || 0);
                    return (
                      <tr key={idx}>
                        <td>{l.name}</td>
                        <td className="text-center tabular-nums">{l.qty}</td>
                        <td className="text-right tabular-nums">{lineSubtotal.toFixed(2)}</td>
                        <td className="text-right tabular-nums">{Number(l.discountRs || 0).toFixed(2)}</td>
                        <td className="text-right tabular-nums">{lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="divider" />

              <div className="totals-section">
                <div className="total-row">
                  <span>Total</span>
                  <span className="tabular-nums">Rs {subtotal.toFixed(2)}</span>
                </div>
                {(billDisc > 0) && (
                  <div className="total-row">
                    <span>Discount ({discountPct.toFixed(2)}%)</span>
                    <span className="tabular-nums">- Rs {billDisc.toFixed(2)}</span>
                  </div>
                )}
                {withLineDiscount.sum > 0 && billDisc === 0 && (
                  <div className="total-row">
                    <span>Discount</span>
                    <span className="tabular-nums">- Rs {withLineDiscount.sum.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row grand-total">
                  <span>TOTAL</span>
                  <span className="tabular-nums text-black">Rs {total.toFixed(2)}</span>
                </div>
              </div>

              {method === 'cash' && (cashReceived !== undefined) && (
                <div className="totals-section" style={{ borderTop: '1px dashed #000', marginTop: '4px', paddingTop: '4px' }}>
                  <div className="total-row" style={{ fontSize: '0.75rem' }}>
                    <span>Cash Rendered</span>
                    <span className="tabular-nums">Rs {Number(cashReceived).toFixed(2)}</span>
                  </div>
                  <div className="total-row" style={{ fontSize: '0.75rem' }}>
                    <span>Amount Charged</span>
                    <span className="tabular-nums">Rs {total.toFixed(2)}</span>
                  </div>
                  <div className="total-row" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <span>Change Return</span>
                    <span className="tabular-nums">Rs {Number(changeReturn || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {totalSaved > 0 && (
                <div className="savings-box">
                  You Saved Rs {totalSaved.toFixed(2)} Amount!
                </div>
              )}

              <div className="divider" />

              <div className="footer">
                {info.footer || 'Thank you for your purchase!'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
