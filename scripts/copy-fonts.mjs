import { copyFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const fontsDir = join(root, 'public', 'fonts')

await mkdir(fontsDir, { recursive: true })

try {
  const src = join(root, 'node_modules', '@material-symbols', 'font-400', 'material-symbols-outlined.woff2')
  const dest = join(fontsDir, 'material-symbols.woff2')
  await copyFile(src, dest)
  console.log('Copied material-symbols.woff2')
} catch {
  console.warn('Material Symbols font not yet installed — run npm ci first')
}
