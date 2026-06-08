export interface PageMetaOptions {
  title: string
  description: string
  path?: string
}

const SITE_NAME = 'Sproutdoro'
const DEFAULT_OG_IMAGE = 'og-image.png'

export function setPageMeta(options: PageMetaOptions): void {
  const { title, description, path } = options
  document.title = `${title} — ${SITE_NAME}`

  const base = import.meta.env.BASE_URL
  const pageUrl = path
    ? new URL(path.replace(/^\//, ''), window.location.origin + base).href
    : window.location.href
  const ogImage = new URL(DEFAULT_OG_IMAGE, window.location.origin + base).href

  setMetaTag('name', 'description', description)
  setMetaTag('property', 'og:title', `${title} — ${SITE_NAME}`)
  setMetaTag('property', 'og:description', description)
  setMetaTag('property', 'og:image', ogImage)
  setMetaTag('property', 'og:url', pageUrl)
  setMetaTag('property', 'og:type', 'website')
  setMetaTag('name', 'twitter:card', 'summary_large_image')
  setMetaTag('name', 'twitter:title', `${title} — ${SITE_NAME}`)
  setMetaTag('name', 'twitter:description', description)
  setMetaTag('name', 'twitter:image', ogImage)
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}
