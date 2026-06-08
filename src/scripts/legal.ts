import '../styles/main.css'
import { createSideNav } from './components/SideNav'
import { createMobileNav } from './components/MobileNav'
import { injectSiteFooter } from './components/SiteFooter'
import { setPageMeta } from './meta'
import { bootstrapPage } from './init'
import { applyTheme } from './theme'

async function initLegalPage() {
  const isPrivacy = window.location.pathname.includes('privacy')
  setPageMeta({
    title: isPrivacy ? 'Privacy Policy' : 'Terms of Use',
    description: isPrivacy
      ? 'How Sproutdoro handles your data — everything stays on your device.'
      : 'Terms of use for the Sproutdoro focus timer app.',
    path: isPrivacy ? 'privacy.html' : 'terms.html',
  })

  applyTheme()

  const sideNavContainer = document.getElementById('side-nav')
  if (sideNavContainer) {
    sideNavContainer.appendChild(createSideNav('focus'))
  }

  const mobileNavContainer = document.getElementById('mobile-nav')
  if (mobileNavContainer) {
    mobileNavContainer.appendChild(createMobileNav('focus'))
  }

  injectSiteFooter()
}

bootstrapPage(initLegalPage).catch(console.error)
