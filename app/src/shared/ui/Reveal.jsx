import { cx } from '../lib/cx.js'
import { useInView } from '../lib/useInView.js'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion.js'

/**
 * Aparición del contenido al entrar en pantalla: sube unos píxeles mientras
 * pasa de transparente a opaco.
 *
 * `delay` permite escalonar los elementos de una lista. Si la persona pidió
 * reducir el movimiento, el componente se aparta por completo y renderiza el
 * contenido tal cual, sin clases de transición.
 */
export function Reveal({ as: Tag = 'div', delay = 0, className, children, ...rest }) {
  const [ref, isInView] = useInView()
  const prefersReducedMotion = usePrefersReducedMotion()

  if (prefersReducedMotion) {
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    )
  }

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cx(
        'transition-[opacity,translate] duration-1000 ease-out',
        isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
