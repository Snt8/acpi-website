import { useCallback, useEffect, useState } from 'react'

const supportsObserver = () => typeof IntersectionObserver !== 'undefined'

/** ¿El elemento ya ocupa parte del área visible? Medición síncrona. */
const isWithinViewport = (element) => {
  const { top, bottom } = element.getBoundingClientRect()
  return top < window.innerHeight && bottom > 0
}

/**
 * Avisa la primera vez que un elemento entra en el área visible.
 *
 * Lo que ya está en pantalla al montar se resuelve de inmediato, midiendo su
 * posición en la propia *callback ref*: así el contenido de la portada nunca
 * depende de que el observador llegue a ejecutarse, que es lo que lo dejaría
 * invisible si la primera pintura se retrasa. El observador se reserva para
 * lo que todavía está por debajo del pliegue, y se desconecta tras el primer
 * cruce porque la animación es de entrada, una sola vez.
 *
 * @param {{ threshold?: number, rootMargin?: string }} [options]
 * @returns {[(node: Element | null) => void, boolean]} ref y si ya es visible
 */
export function useInView({ threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = {}) {
  const [node, setNode] = useState(null)
  const [isInView, setIsInView] = useState(false)

  const ref = useCallback((element) => {
    setNode(element)
    if (!element) return
    // Sin soporte del navegador se muestra todo sin animar.
    if (!supportsObserver() || isWithinViewport(element)) setIsInView(true)
  }, [])

  useEffect(() => {
    if (!node || isInView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setIsInView(true)
        observer.disconnect()
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [node, isInView, threshold, rootMargin])

  return [ref, isInView]
}
