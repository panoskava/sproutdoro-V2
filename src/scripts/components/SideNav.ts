import { NAV_ITEMS } from './nav-config'

export function createSideNav(currentPage: string): HTMLElement {
  const nav = document.createElement('nav')
  nav.setAttribute('aria-label', 'Main navigation')
  nav.className =
    'hidden md:flex flex-col sticky left-0 top-0 h-screen w-72 glass-sage rounded-r-[2.5rem] py-8 px-6 z-50'

  // Logo
  const logo = document.createElement('div')
  logo.className = 'flex items-center gap-3 mb-12 px-2'
  logo.innerHTML = `
    <span class="material-symbols-outlined text-3xl text-primary" style="font-variation-settings: 'FILL' 1, 'wght' 600;">psychiatry</span>
    <span class="font-headline text-2xl font-bold text-on-surface">Sproutdoro</span>
  `
  nav.appendChild(logo)

  const list = document.createElement('ul')
  list.className = 'flex flex-col gap-2 flex-1'

  for (const item of NAV_ITEMS) {
    const itemId = item.label.toLowerCase()
    const isActive = currentPage === itemId
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = item.href
    if (isActive) {
      a.setAttribute('aria-current', 'page')
    }
    a.className = `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
      isActive
        ? 'bg-primary-container/20 text-primary font-label font-semibold'
        : 'text-on-surface/60 hover:text-on-surface hover:bg-surface-container-high/50'
    }`
    a.innerHTML = `
      <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' ${isActive ? 1 : 0}, 'wght' ${isActive ? 600 : 400};">${item.icon}</span>
      <span class="font-label text-sm">${item.label}</span>
    `
    li.appendChild(a)
    list.appendChild(li)
  }

  nav.appendChild(list)

  // Start Session button
  const btn = document.createElement('button')
  btn.setAttribute('aria-label', 'Start a focus session')
  btn.className =
    'mt-auto w-full py-3.5 px-6 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2'
  btn.innerHTML = `
    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1, 'wght' 600;">play_arrow</span>
    Start Session
  `
  btn.addEventListener('click', () => {
    window.location.href = './index.html'
  })
  nav.appendChild(btn)

  return nav
}
