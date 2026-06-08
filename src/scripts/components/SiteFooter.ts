const REPO_URL = 'https://github.com/panoskava/sproutdoro-V2'

export function createSiteFooter(): HTMLElement {
  const footer = document.createElement('footer')
  footer.className =
    'flex flex-col sm:flex-row items-center justify-center gap-3 py-6 mt-8 border-t border-outline-variant/20 text-center'

  const links = [
    { label: 'Privacy', href: './privacy.html' },
    { label: 'Terms', href: './terms.html' },
    { label: 'GitHub', href: REPO_URL, external: true },
  ]

  for (const link of links) {
    const a = document.createElement('a')
    a.className = 'font-label text-xs text-on-surface/50 hover:text-primary transition-colors'
    a.textContent = link.label
    a.href = link.href
    if (link.external) {
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
    }
    footer.appendChild(a)
  }

  const copy = document.createElement('span')
  copy.className = 'font-label text-xs text-on-surface/40'
  copy.textContent = `© ${new Date().getFullYear()} Sproutdoro`
  footer.appendChild(copy)

  return footer
}

export function injectSiteFooter(): void {
  const existing = document.getElementById('site-footer')
  if (existing) {
    existing.appendChild(createSiteFooter())
  }
}
