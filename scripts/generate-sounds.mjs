/**
 * Generates minimal placeholder MP3 files using ffmpeg (if available).
 * AudioManager also has Web Audio API fallbacks when files are missing.
 */
import { execSync, spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const soundsDir = join(__dirname, '..', 'public', 'sounds')

const sounds = [
  { name: 'break.mp3', freq: 440, duration: 1 },
  { name: 'completion.mp3', freq: 523, duration: 1.5 },
  { name: 'wind-chimes.mp3', freq: 660, duration: 3 },
  { name: 'birdsong.mp3', freq: 2000, duration: 2 },
  { name: 'rain.mp3', freq: 200, duration: 5 },
]

function hasFfmpeg() {
  const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' })
  return result.status === 0
}

await mkdir(soundsDir, { recursive: true })

if (hasFfmpeg()) {
  for (const { name, freq, duration } of sounds) {
    const out = join(soundsDir, name)
    execSync(
      `ffmpeg -y -f lavfi -i "sine=frequency=${freq}:duration=${duration}" -q:a 9 "${out}"`,
      { stdio: 'ignore' }
    )
    console.log(`Generated ${name}`)
  }
} else {
  // Minimal valid silent MP3 frame (ID3 + single silent frame) — browsers accept short files
  const silentMp3 = Buffer.from(
    'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAAGkAAAAAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'base64'
  )
  for (const { name } of sounds) {
    await writeFile(join(soundsDir, name), silentMp3)
    console.log(`Wrote placeholder ${name}`)
  }
  console.log('ffmpeg not found — wrote minimal placeholder MP3s. Install ffmpeg for better audio.')
}
