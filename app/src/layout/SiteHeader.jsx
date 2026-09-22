import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BRAND, NAV_LINKS } from '../core/content/site.content.js'
import { PATHS } from '../core/routing/paths.js'
import { cx } from '../shared/lib/cx.js'
import { Container } from '../shared/ui/index.js'

const linkClasses = ({ isActive }) =>
  cx(
    'text-sm font-medium transition-colors duration-200 hover:text-ink',
    isActive ? 'text-ink' : 'text-ink-soft',
  )

/**
 * Barra superior del boceto: marca a la izquierda y las cuatro secciones a
 * la derecha. En pantallas pequeñas las secciones pasan a un panel
 * desplegable con el patrón de divulgación accesible.
 */
export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { key: locationKey } = useLocation()
  const [lastLocationKey, setLastLocationKey] = useState(locationKey)

  // Cambiar de página cierra el menú: dejarlo abierto tapa el contenido nuevo.
  // Se ajusta durante el render en lugar de en un efecto para evitar un paso
  // intermedio en el que la página nueva se dibuje con el panel abierto.
  if (locationKey !== lastLocationKey) {
    setLastLocationKey(locationKey)
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          to={PATHS.home}
          className="font-display text-xl font-semibold tracking-tight text-ink"
        >
          {BRAND.name}
          <span className="sr-only"> — {BRAND.fullName}</span>
        </Link>

        <nav aria-label="Secciones del sitio" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <NavLink to={link.to} className={linkClasses}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="menu-principal"
          className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink md:hidden"
        >
          {isMenuOpen ? 'Cerrar' : 'Menú'}
        </button>
      </Container>

      <div
        id="menu-principal"
        hidden={!isMenuOpen}
        className="border-t border-line bg-paper-raised md:hidden"
      >
        <nav aria-label="Secciones del sitio">
          <Container as="ul" className="flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cx(
                      'block border-b border-line py-3 text-base font-medium last:border-b-0',
                      isActive ? 'text-signal' : 'text-ink-soft',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </Container>
        </nav>
      </div>
    </header>
  )
}
