import { PHARMACY_SHORTCUTS } from '../../utils/pharmacy_shortcuts'
import { Download } from 'lucide-react'

export default function Pharmacy_Guidelines() {
  const sections = ['Navigation', 'POS', 'Inventory', 'Customers', 'Suppliers', 'Sales History', 'Dashboard', 'Reports', 'Settings', 'Purchase Orders', 'Audit', 'Supplier Returns'] as const

  const downloadPDF = () => {
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset='utf-8' />
          <title>Pharmacy Guidelines & Shortcuts</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; }
            .section { margin-bottom: 25px; break-inside: avoid; }
            .section-title { font-size: 18px; font-weight: 600; margin-bottom: 10px; color: #334155; background: #f8fafc; padding: 8px 12px; border-radius: 6px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .label { color: #475569; }
            .keys { font-weight: 600; text-align: right; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Pharmacy Guidelines & Shortcuts</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Generated on ${new Date().toLocaleString()}</div>
          </div>
          ${sections.map(section => {
            const shortcuts = (PHARMACY_SHORTCUTS || []).filter(s => s.section === section)
            if (!shortcuts.length) return ''
            return `
              <div class="section">
                <div class="section-title">${section} Shortcuts</div>
                <table>
                  <tbody>
                    ${shortcuts.map(s => `
                      <tr>
                        <td class="label">${s.label}</td>
                        <td class="keys">${s.keys}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `
          }).join('')}
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
          try { document.body.removeChild(frame) } catch { }
        }, 200)
      }
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-slate-800">Guidelines & Shortcuts</div>
        <button
          onClick={downloadPDF}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      {sections.map(section => {
        const shortcuts = (PHARMACY_SHORTCUTS || []).filter(s => s.section === section)
        if (!shortcuts.length) return null
        return (
          <div key={section} className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3 font-medium text-slate-800">{section} Shortcuts</div>
            <div className="p-4">
              <table className="min-w-full text-left text-sm">
                <tbody className="divide-y divide-slate-200">
                  {shortcuts.map(s => (
                    <tr key={s.id}>
                      <td className="px-4 py-2 text-slate-700">{s.label}</td>
                      <td className="px-4 py-2 font-medium text-slate-900">{s.keys}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
