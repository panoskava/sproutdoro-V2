import { setupModal } from '../utils/modal'

const ONBOARDING_KEY = 'sproutdoro_onboarding_complete'

const STEPS = [
  {
    emoji: '🌱',
    title: 'Grow a garden while you focus',
    body: 'Sproutdoro turns your Pomodoro sessions into a thriving garden. Every minute of focus helps your plants grow.',
    cta: 'Next',
  },
  {
    emoji: '🪴',
    title: 'Plant a seed in your Garden, then start a timer',
    body: 'Visit the Garden to choose a plant, then head to Focus and start your session. Your plant grows with every completed session.',
    cta: 'Next',
  },
  {
    emoji: '🏆',
    title: 'Complete sessions to level up plants and unlock achievements',
    body: 'Track streaks, earn achievements, and watch rare plants bloom as you build a consistent focus habit.',
    cta: 'Plant my first seed',
  },
]

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1'
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, '1')
}

export function showWelcomeModal(): void {
  if (isOnboardingComplete()) return

  const existing = document.getElementById('welcome-modal')
  if (existing) existing.remove()

  let step = 0

  const overlay = document.createElement('div')
  overlay.id = 'welcome-modal'
  overlay.className =
    'fixed inset-0 z-[70] flex items-center justify-center bg-background/90 backdrop-blur-md'

  const card = document.createElement('div')
  card.className = 'stat-card-glass rounded-3xl p-8 max-w-md w-full mx-4 flex flex-col gap-5 text-center'

  const skipLink = document.createElement('button')
  skipLink.className =
    'absolute top-4 right-4 font-label text-xs text-on-surface/50 hover:text-on-surface transition-colors'
  skipLink.textContent = 'Skip'
  skipLink.addEventListener('click', () => {
    markOnboardingComplete()
    cleanup()
    overlay.remove()
  })

  const emoji = document.createElement('div')
  emoji.className = 'text-5xl'
  emoji.setAttribute('aria-hidden', 'true')

  const title = document.createElement('h2')
  title.className = 'font-headline text-xl font-bold text-on-surface'

  const body = document.createElement('p')
  body.className = 'font-body text-sm text-on-surface/70 leading-relaxed'

  const dots = document.createElement('div')
  dots.className = 'flex items-center justify-center gap-2'

  const ctaBtn = document.createElement('button')
  ctaBtn.className =
    'px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-label text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition-all'

  function renderStep() {
    const s = STEPS[step]
    emoji.textContent = s.emoji
    title.textContent = s.title
    body.textContent = s.body
    ctaBtn.textContent = s.cta

    dots.innerHTML = ''
    for (let i = 0; i < STEPS.length; i++) {
      const dot = document.createElement('span')
      dot.className = `w-2 h-2 rounded-full ${i === step ? 'bg-primary' : 'bg-outline-variant/40'}`
      dots.appendChild(dot)
    }
  }

  ctaBtn.addEventListener('click', () => {
    if (step < STEPS.length - 1) {
      step++
      renderStep()
    } else {
      markOnboardingComplete()
      cleanup()
      overlay.remove()
      window.location.href = './garden.html'
    }
  })

  card.style.position = 'relative'
  card.appendChild(skipLink)
  card.appendChild(emoji)
  card.appendChild(title)
  card.appendChild(body)
  card.appendChild(dots)
  card.appendChild(ctaBtn)
  overlay.appendChild(card)
  document.body.appendChild(overlay)

  renderStep()

  const cleanup = setupModal(overlay, card, {
    onEscape: () => {
      markOnboardingComplete()
      overlay.remove()
    },
    initialFocus: ctaBtn,
  })
}
