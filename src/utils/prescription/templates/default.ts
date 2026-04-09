import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PrescriptionPdfData } from '../../prescriptionPdf'
import { ensurePoppins } from '../ensurePoppins'
import { ensureUrduNastaleeq } from '../ensureUrduNastaleeq'

export async function buildRxDefault(data: PrescriptionPdfData) {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  await Promise.all([ensurePoppins(pdf), ensureUrduNastaleeq(pdf)])

  const URDU_FREQ: Record<string, string> = {
    'OD': 'دن میں ایک بار',
    'BD': 'صبح + شام',
    'TDS': 'صبح + دوپہر + شام',
    'TID': 'صبح + دوپہر + شام',
    'QID': 'دن میں چار بار',
    'HS': 'رات سوتے وقت',
  }

  const translateFreq = (f?: string) => {
    const raw = String(f || '').trim()
    const s = raw.toUpperCase()
    const l = raw.toLowerCase()
    if (URDU_FREQ[s]) return URDU_FREQ[s]
    if (/once\s*a\s*day|daily/.test(l)) return 'دن میں ایک بار'
    if (/twice\s*a\s*day|two\s*times\s*(per\s*)?day|bid\b|bd\b/.test(l)) return 'صبح + شام'
    if (/three\s*times\s*(per\s*)?day|thrice\s*a\s*day|tid\b|tds\b/.test(l)) return 'صبح + دوپہر + شام'
    if (/four\s*times\s*(per\s*)?day|qid\b|qds\b/.test(l)) return 'دن میں چار بار'
    const hasMorning = /\bmorning\b/.test(l)
    const hasNoon = /\bnoon\b|\bafternoon\b/.test(l)
    const hasEvening = /\bevening\b/.test(l)
    const hasNight = /\bnight\b|\bhs\b/.test(l)
    const partsText = [hasMorning ? 'صبح' : '', hasNoon ? 'دوپہر' : '', hasEvening ? 'شام' : '', hasNight ? 'رات' : ''].filter(Boolean)
    if (partsText.length === 1) return partsText[0]
    if (partsText.length > 1) return partsText.join(' + ')
    if (s.includes('/')) {
      const parts = s.split('/').map(x => x.trim()).filter(Boolean)
      if (parts.length === 1) return 'دن میں ایک بار'
      if (parts.length === 2) return 'صبح + شام'
      if (parts.length === 3) return 'صبح + دوپہر + شام'
      if (parts.length >= 4) return 'دن میں چار بار'
    }
    return f || '-'
  }

  // Header Layout matching Image 2
  // Logo on left, Department title + Hospital name centered, QR on right
  let y = 10
  const margin = 10
  const headerH = 18
  const hideHeaderText = !!data.hideHeaderText

  // Left: Logo
  const logo = data.settings?.logoDataUrl
  if (logo && !hideHeaderText) {
    try {
      pdf.addImage(logo, 'JPEG', margin, y, headerH - 2, headerH - 2)
    } catch { }
  }

  // Center: Hospital name/address
  if (!hideHeaderText) {
    pdf.setTextColor(15, 23, 42)
    pdf.setFont('Poppins', 'bold')

    pdf.setFontSize(14)
    pdf.text(data.settings?.name || 'Tehsil Headquarter Hospital', pageWidth / 2, y + 8, { align: 'center' })
    pdf.setFontSize(12)
    pdf.text(data.settings?.address || 'Shah Kot, Nankana Sahib', pageWidth / 2, y + 13, { align: 'center' })
  }

  // Right: Removed QR placeholder
  
  y += hideHeaderText ? 6 : (headerH + 8)

  // Patient Info Grid (Image 2 Style)
  const drawGridRow = (startY: number, fields: { label: string, value: string, width: number }[]) => {
    let curX = margin
    const rowH = 7
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.2)
    fields.forEach(f => {
      pdf.rect(curX, startY, f.width, rowH)
      pdf.setFont('Poppins', 'bold'); pdf.setFontSize(8)
      pdf.text(`${f.label}:`, curX + 1, startY + 4.5)
      pdf.setFont('Poppins', 'normal'); pdf.setFontSize(8)
      const val = String(f.value || '-')
      pdf.text(val, curX + pdf.getTextWidth(`${f.label}: `) + 1, startY + 4.5)
      curX += f.width
    })
    return rowH
  }

  const dt = data.createdAt ? new Date(data.createdAt) : new Date()
  const colW = (pageWidth - 20) / 3

  y += drawGridRow(y, [
    { label: 'Print Date', value: dt.toLocaleString(), width: colW },
    { label: 'Doctor', value: `DR. ${data.doctor?.name || ''} (${data.doctor?.qualification || ''})`, width: colW },
    { label: 'Department', value: data.doctor?.departmentName || 'General Physician', width: colW }
  ])
  y += drawGridRow(y, [
    { label: 'Patient Name', value: data.patient?.name || '', width: colW },
    { label: 'Contact No', value: data.patient?.phone || '', width: colW },
    { label: 'Age', value: `${data.patient?.age || ''} ${data.patient?.gender === 'Male' ? 'M' : data.patient?.gender === 'Female' ? 'F' : ''}`, width: colW }
  ])
  y += drawGridRow(y, [
    { label: 'MR No', value: data.patient?.mrn || '', width: colW },
    { label: 'Created On', value: dt.toLocaleString(), width: colW * 2 }
  ])

  y += 2

  // Vitals Grid (Token style - always show all 6 fields, even if empty, matching reference image)
  const v = data.vitals
  // Always render the vitals row (token list style)
  {
    const vitW6 = (pageWidth - 20) / 3
    const vitalsRow1 = [
      { label: 'BP', value: (v?.bloodPressureSys || v?.bloodPressureDia) ? `${v!.bloodPressureSys ?? ''}/${v!.bloodPressureDia ?? ''}` : '/', unit: 'mmhg' },
      { label: 'Pulse', value: v?.pulse != null ? String(v.pulse) : '', unit: 'pulse/min' },
      { label: 'Temperature', value: v?.temperatureC != null ? String(v.temperatureC) : '', unit: 'F' },
    ]
    const vitalsRow2 = [
      { label: 'Height', value: v?.heightCm != null ? String(v.heightCm) : '', unit: 'cm' },
      { label: 'Weight', value: v?.weightKg != null ? String(v.weightKg) : '', unit: 'kg' },
      { label: 'RespRate', value: v?.respiratoryRate != null ? String(v.respiratoryRate) : '', unit: 'breaths/min' },
    ]
    pdf.setDrawColor(200)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 3
    // Row 1
    let curX = margin
    vitalsRow1.forEach(vit => {
      pdf.setFont('Poppins', 'bold'); pdf.setFontSize(8)
      pdf.text(`${vit.label}:`, curX, y + 4)
      pdf.setFont('Poppins', 'normal')
      pdf.text(` ${vit.value} (${vit.unit})`, curX + pdf.getTextWidth(`${vit.label}:`), y + 4)
      curX += vitW6
    })
    y += 7
    // Row 2
    curX = margin
    vitalsRow2.forEach(vit => {
      pdf.setFont('Poppins', 'bold'); pdf.setFontSize(8)
      pdf.text(`${vit.label}:`, curX, y + 4)
      pdf.setFont('Poppins', 'normal')
      pdf.text(` ${vit.value} (${vit.unit})`, curX + pdf.getTextWidth(`${vit.label}:`), y + 4)
      curX += vitW6
    })
    y += 7
    pdf.line(margin, y, pageWidth - margin, y)
    y += 4
  }

  // Main Content: Left Column (Lab + Complaints) and Right Column (Diagnosis + Pharmacy)
  const leftColW = (pageWidth - 25) * 0.35
  const rightColW = (pageWidth - 25) * 0.65
  const contentGap = 5
  const contentStartY = y

  // LEFT COLUMN
  let leftY = contentStartY
  
  // Hospital Laboratory Box
  pdf.setFont('Poppins', 'bold'); pdf.setFontSize(9)
  pdf.text('Test/Investigations:', margin, leftY + 4)
  leftY += 6
  pdf.setDrawColor(0)
  pdf.rect(margin, leftY, leftColW, 40)
  pdf.setFillColor(245, 245, 245)
  pdf.rect(margin, leftY, leftColW, 5, 'FD')
  pdf.setFontSize(8)
  pdf.text('Hospital Laboratory', margin + 2, leftY + 3.5)
  // Lab Tests Table (Manual draw with header)
  pdf.setFont('Poppins', 'bold'); pdf.setFontSize(7)
  let labY = leftY + 8
  // Header row: Sr# | Test Name
  pdf.text('Sr#', margin + 2, labY - 1)
  pdf.text('Test Name', margin + 8, labY - 1)
  pdf.setDrawColor(200)
  pdf.line(margin, labY, margin + leftColW, labY)
  pdf.setFont('Poppins', 'normal'); pdf.setFontSize(7)
  const labItems = data.labTests || []
  labItems.slice(0, 8).forEach((test, i) => {
    pdf.text(`${i + 1}`, margin + 2, labY)
    pdf.text(String(test), margin + 8, labY)
    pdf.setDrawColor(200)
    pdf.line(margin, labY + 1, margin + leftColW, labY + 1)
    labY += 4
  })
  leftY += 45

  // Complaints Box
  pdf.setFont('Poppins', 'bold'); pdf.setFontSize(9)
  pdf.text('Complaints', margin, leftY + 4)
  leftY += 6
  pdf.setDrawColor(0)
  pdf.rect(margin, leftY, leftColW, 25)
  pdf.setFont('Poppins', 'normal'); pdf.setFontSize(8)
  const complaintLines = pdf.splitTextToSize(String(data.primaryComplaint || ''), leftColW - 4)
  pdf.text(complaintLines, margin + 2, leftY + 5)
  
  // RIGHT COLUMN
  let rightY = contentStartY
  const rightX = margin + leftColW + contentGap
  
  // Diagnosis
  pdf.setFont('Poppins', 'bold'); pdf.setFontSize(9)
  pdf.text('Diagnosis:', rightX, rightY + 4)
  pdf.setFont('Poppins', 'normal')
  const diagnosisText = String(data.diagnosis || '-')
  const diagLines = pdf.splitTextToSize(diagnosisText, rightColW - 22)
  pdf.text(diagLines, rightX + 20, rightY + 4)
  rightY += Math.max(8, diagLines.length * 4)
  pdf.setDrawColor(200)
  pdf.line(rightX, rightY, margin + leftColW + contentGap + rightColW, rightY)
  rightY += 5

  // Hospital Pharmacy
  pdf.setFont('Poppins', 'bold'); pdf.setFontSize(10)
  pdf.text('Hospital Pharmacy:', rightX, rightY + 4)
  rightY += 10
  
  // Urdu Message
  pdf.setFont('NotoNastaliqUrdu', 'normal')
  
  pdf.setFontSize(8)
  const urduMsg = 'آپ کو ہسپتال کی فارمیسی سے درج ذیل ادویات تجویز کی گئی ہیں۔ آپ سے گزارش ہے کہ ہسپتال کی فارمیسی سے یہ ادویات مفت حاصل کریں۔'
  const urduLines = pdf.splitTextToSize(urduMsg, rightColW)
  pdf.text(urduLines, margin + leftColW + contentGap + rightColW, rightY, { align: 'right' })
  
  rightY += urduLines.length * 3.5 + 2

  // Medicine Table
  const bodyRows = (data.items || []).map((m: any, i: number) => {
    return [
      `${i + 1}. ${String(m.name || '-')}`,
      String(m.dose || '-') + ' ' + (m.doseUnit || 'گولی'),
      String(m.duration || '-'),
      translateFreq(m.frequency),
      String(m.qty || '-')
    ]
  })

  autoTable(pdf, {
    startY: rightY,
    margin: { left: rightX },
    tableWidth: rightColW,
    head: [['Medicine', 'Dose', 'Days', 'Instructions', 'Quantity']],
    body: bodyRows,
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 1, valign: 'middle', font: 'Poppins' as any },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0, font: 'Poppins' as any },
    columnStyles: {
      1: { halign: 'center' },
      3: { halign: 'right' },
    },
    didParseCell: (d) => {
      if (d.section === 'body' && (d.column.index === 1 || d.column.index === 3)) {
        (d.cell.styles as any).font = 'NotoNastaliqUrdu'
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'head') {
        pdf.setDrawColor(0)
        pdf.setLineWidth(0.2)
        pdf.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height)
      }
    }
  })

  y = Math.max(leftY + 25, (pdf as any).lastAutoTable.finalY) + 15

  // Help Line Message
  pdf.setFont('NotoNastaliqUrdu', 'bold')
  pdf.setFontSize(11)
  const helpLineMsg = 'کسی بھی رہنمائی کی صورت میں ہیلپ لائن 1033 پر رابطہ کریں۔ شکریہ۔'
  pdf.text(helpLineMsg, pageWidth / 2, y, { align: 'center' })

  // Footer Disclaimer (HISDU)
  pdf.setFont('Poppins', 'normal'); pdf.setFontSize(8)
  pdf.text('Powered & Developed by: Health Information & Service Delivery Unit (HISDU)', pageWidth / 2, pageHeight - 10, { align: 'center' })

  return pdf
}

