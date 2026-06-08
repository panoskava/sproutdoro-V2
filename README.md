# Sproutdoro

[![CI](https://github.com/panoskava/sproutdoro-V2/actions/workflows/ci.yml/badge.svg)](https://github.com/panoskava/sproutdoro-V2/actions/workflows/ci.yml)

A garden-themed Pomodoro timer that grows with your focus. Plant seeds, complete focus sessions, and watch your garden flourish — all in the browser.

**Live demo:** [https://panoskava.github.io/sproutdoro-V2/](https://panoskava.github.io/sproutdoro-V2/)

## Features

- Pomodoro timer with work, short break, and long break cycles
- Garden system — plant seeds, level up plants through focus sessions
- Insights dashboard with streaks, charts, and achievements
- Focus categories for organizing sessions
- PWA support — install for offline access
- Export / import your data as JSON backup
- Light and dark themes
- Ambient sounds and browser notifications

## Your data stays on your device

Sproutdoro stores everything locally in your browser (IndexedDB). No accounts, no servers, no analytics. Your garden is yours alone.

## Local development

```bash
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Other commands

```bash
npm run build    # Production build
npm run test     # Run tests
npm run lint     # Type-check
npm run generate:assets  # Regenerate icons, og-image, sounds

fmpeg is optional; without it, generate:assets writes minimal silent MP3 placeholders (the app uses Web Audio fallbacks at runtime).
```

## Tech stack

- TypeScript, Vite, Tailwind CSS
- IndexedDB via [idb](https://github.com/jakearchibald/idb)
- PWA via vite-plugin-pwa
- Deployed to GitHub Pages via GitHub Actions

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
