// Run this script ONCE to download and embed the Urdu font
// Then commit the generated file to your repository

const https = require('https')
const fs = require('fs')
const path = require('path')

const FONT_URL = 'https://fonts.gstatic.com/s/notonastaliqurdu/v19/La2cUi-9p-k6_Zf2a80qgDWjwgZbSA2xcj2G7dc-s-Y.ttf'
const OUTPUT_FILE = path.join(__dirname, 'urduFontBase64.ts')

console.log('Downloading Urdu font...')

https.get(FONT_URL, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download: HTTP ${res.statusCode}`)
    return
  }

  const chunks = []
  res.on('data', chunk => chunks.push(chunk))
  res.on('end', () => {
    const buffer = Buffer.concat(chunks)
    const base64 = buffer.toString('base64')
    
    const fileContent = `// Auto-generated Urdu font base64 - DO NOT EDIT MANUALLY
// Generated from: ${FONT_URL}
// Size: ${base64.length} characters

export const NOTO_NASTALIQ_URDU_BASE64 = '${base64}'
`
    fs.writeFileSync(OUTPUT_FILE, fileContent)
    console.log(`✅ Font saved to: ${OUTPUT_FILE}`)
    console.log(`Size: ${(buffer.length / 1024).toFixed(2)} KB`)
  })
}).on('error', (err) => {
  console.error('Download failed:', err.message)
})
