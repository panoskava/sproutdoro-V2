# Sound Files

Place the following MP3 files in this directory:

- `break.mp3` — Sound played when a break session starts
- `completion.mp3` — Sound played when a work session completes
- `wind-chimes.mp3` — Ambient wind chimes loop
- `birdsong.mp3` — Ambient birdsong loop
- `rain.mp3` — Ambient rain loop

Run `npm run generate:assets` from the project root to regenerate icons, OG image, and these sounds. Install [ffmpeg](https://ffmpeg.org/) for synthesized tone placeholders; without ffmpeg, minimal silent MP3s are written instead.

The app falls back to Web Audio API synthesized sounds when files are unavailable or silent.
