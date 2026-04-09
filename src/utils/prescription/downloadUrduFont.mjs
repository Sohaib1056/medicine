// Run this script ONCE to download and embed the Urdu font
// Usage: node downloadUrduFont.mjs

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FONT_URL = 'https://fonts.gstatic.com/s/notonastaliqurdu/v23/LhWNMUPbN-oZdNFcBy1-DJYsEoTq5pudQ9L940pGPkB3Qt_-DK0.ttf'
const OUTPUT_FILE = path.join(__dirname, 'urduFontBase64.ts')

console.log('Downloading Urdu font...')

https.get(FONT_URL, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download: HTTP ${res.statusCode}`)
    process.exit(1)
  }

  const chunks = []
  res.on('data', chunk => chunks.push(chunk))
  res.on('end', () => {
    const buffer = Buffer.concat(chunks)
    const base64 = buffer.toString('base64')
    
    const fileContent = `// Auto-generated Urdu font base64 - DO NOT EDIT MANUALLY
// Generated from: ${FONT_URL}
// Size: ${base64.length} characters (~${(buffer.length / 1024).toFixed(1)}KB)

export const NOTO_NASTALIQ_URDU_BASE64 = '${base64}'
`
    fs.writeFileSync(OUTPUT_FILE, fileContent)
    console.log(`✅ Font saved to: urduFontBase64.ts`)
    console.log(`Size: ${(buffer.length / 1024).toFixed(2)} KB (${base64.length} base64 chars)`)
    console.log(`\nNext steps:`)
    console.log(`1. The font is now embedded in urduFontBase64.ts`)
    console.log(`2. Commit this file to your repository`)
    console.log(`3. No network requests needed anymore!`)
  })
}).on('error', (err) => {
  console.error('Download failed:', err.message)
  process.exit(1)
})
