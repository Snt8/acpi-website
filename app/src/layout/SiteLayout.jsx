import { Outlet } from 'react-router-dom'
import { ScrollToTop } from './ScrollToTop.jsx'
import { SiteFooter } from './SiteFooter.jsx'
import { SiteHeader } from './SiteHeader.jsx'
import { usePageTitle } from './usePageTitle.js'

/** Estructura compartida por todas las páginas: cabecera, contenido y pie. */
export function SiteLayout() {
  usePageTitle()

  return (
    <div className="flex min-h-svh flex-col">
      <ScrollToTop />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-signal focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
