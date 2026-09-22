import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const subscribe = (onStoreChange) => {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches

/**
 * Indica si la persona pidió al sistema operativo reducir el movimiento.
 * En ese caso las animaciones no se aplican en absoluto: no basta con
 * acortarlas, porque el desplazamiento sigue siendo el estímulo molesto.
 *
 * @returns {boolean}
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true)
}
