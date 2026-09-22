import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Al cambiar de página el navegador conserva el desplazamiento anterior.
 * Este componente lo devuelve al inicio, salvo cuando la navegación apunta a
 * un ancla concreta.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}
