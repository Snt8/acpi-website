import { useEffect } from 'react'
import { useMatches } from 'react-router-dom'
import { BRAND } from '../core/content/site.content.js'

/**
 * Sincroniza el título del documento con la ruta activa.
 * Lo lee de `handle.title` en la tabla de rutas, así que añadir una página
 * no obliga a tocar este archivo.
 */
export function usePageTitle() {
  const matches = useMatches()
  const title = matches.findLast((match) => match.handle?.title)?.handle.title

  useEffect(() => {
    document.title = title ? `${BRAND.name} — ${title}` : BRAND.name
  }, [title])
}
