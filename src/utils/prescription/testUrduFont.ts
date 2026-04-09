// Quick test to verify Urdu font works
import jsPDF from 'jspdf'
import { NOTO_NASTALIQ_URDU_BASE64 } from './urduFontBase64'

export async function testUrduFont() {
  const pdf = new jsPDF()
  const fontName = 'NotoNastaliqUrdu'
  
  try {
    // Register font
    pdf.addFileToVFS(`${fontName}.ttf`, NOTO_NASTALIQ_URDU_BASE64)
    pdf.addFont(`${fontName}.ttf`, fontName, 'normal')
    pdf.addFont(`${fontName}.ttf`, fontName, 'bold')
    
    // Test 1: Check font list
    const fonts = pdf.getFontList()
    console.log('[testUrduFont] Available fonts:', fonts)
    
    // Test 2: Set font and render
    pdf.setFont(fontName, 'normal')
    pdf.setFontSize(20)
    pdf.text('Test', 10, 20)
    
    // Test 3: Render Urdu
    const urduText = 'صبح + شام'
    pdf.text(urduText, 10, 40)
    
    console.log('[testUrduFont] PDF generated successfully')
    
    // Download test PDF
    pdf.save('urdu-font-test.pdf')
    
    return true
  } catch (error) {
    console.error('[testUrduFont] Font test failed:', error)
    return false
  }
}
