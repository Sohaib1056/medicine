// EMBEDDED URDU FONT - No network requests needed!
// This font is embedded as base64 so it works offline and without CORS issues
// Font: Noto Nastaliq Urdu from Google Fonts
// To update: Run downloadUrduFont.mjs script

import { NOTO_NASTALIQ_URDU_BASE64 } from './urduFontBase64'

export async function ensureUrduNastaleeq(doc: any) {
  const fontName = 'NotoNastaliqUrdu'

  try {
    // Check if already registered - getFontList returns an object, not an array
    const fonts = doc.getFontList?.() || {}
    if (fonts[fontName]) {
      return
    }

    // Register the embedded font
    
    // Add to VFS and register with both weights
    doc.addFileToVFS(`${fontName}.ttf`, NOTO_NASTALIQ_URDU_BASE64)
    doc.addFont(`${fontName}.ttf`, fontName, 'normal')
    doc.addFont(`${fontName}.ttf`, fontName, 'bold')
    
    // Verify registration
    const fontsAfter = doc.getFontList?.() || {}
    
    if (!fontsAfter[fontName]) {
      return
    }
    
    // Test the font
    doc.setFont(fontName, 'normal')
    
  } catch (error) {
    // silent
  }
}
