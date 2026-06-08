import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'public', 'favicon.svg')
const iconsDir = join(root, 'public', 'icons')

await mkdir(iconsDir, { recursive: true })

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  await sharp(svgPath)
    .resize(size, size, { fit: 'contain', background: { r: 253, g: 249, b: 239, alpha: 1 } })
    .png()
    .toFile(join(iconsDir, name))
  console.log(`Generated ${name}`)
}
