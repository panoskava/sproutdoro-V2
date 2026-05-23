import { NAV_ITEMS } from './nav-config'

export function createMobileNav(currentPage: string): HTMLElement {
  const nav = document.createElement('nav')
  nav.className =
    'flex md:hidden fixed bottom-0 left-0 right-0 glass-sage z-50 pb-safe'

  const list = document.createElement('ul')
  list.className = 'flex items-center justify-around w-full py-2 px-4'

  for (const item of NAV_ITEMS) {
    const itemId = item.label.toLowerCase()
    const isActive = currentPage === itemId
    const isGarden = itemId === 'garden'
    const li = document.createElement('li')
    li.className = 'flex-1 flex flex-col items-center'

    const a = document.createElement('a')
    a.href = item.href
    a.className = `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${
      isActive ? 'text-primary' : 'text-on-surface/50'
    }`

    // FAB for Garden page
    if (isGarden && currentPage === 'garden') {
      a.href = './index.html'
      a.className =
        'relative -top-5 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 transition-all duration-200 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1'
      a.innerHTML = `
        <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1, 'wght' 600;">add</span>
      `
      a.title = 'New Sprout'
      li.appendChild(a)
    } else {
      a.innerHTML = `
        <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' ${isActive ? 1 : 0}, 'wght' ${isActive ? 600 : 400};">${item.icon}</span>
        <span class="font-label text-[10px] ${isActive ? 'font-semibold' : ''}">${item.label}</span>
      `
      li.appendChild(a)
    }

    list.appendChild(li)
  }

  nav.appendChild(list)
  return nav
}
