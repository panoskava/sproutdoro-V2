import sharp from 'sharp'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'public', 'favicon.svg')
const outPath = join(root, 'public', 'og-image.png')

const width = 1200
const height = 630

const iconSize = 200
const iconBuffer = await sharp(svgPath)
  .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fdf9ef"/>
      <stop offset="100%" style="stop-color:#e8f0d8"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="200" cy="150" r="120" fill="#516233" opacity="0.08"/>
  <circle cx="1000" cy="500" r="150" fill="#934a29" opacity="0.06"/>
  <text x="600" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#516233">Sproutdoro</text>
  <text x="600" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#76786c">Grow a garden while you focus</text>
  <text x="600" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="48">🌱 🌻 🌿</text>
</svg>
`

const base = await sharp(Buffer.from(svg)).png().toBuffer()

await sharp(base)
  .composite([{ input: iconBuffer, left: 80, top: 215 }])
  .png()
  .toFile(outPath)

console.log('Generated og-image.png')
