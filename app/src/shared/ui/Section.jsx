import { cx } from '../lib/cx.js'
import { Container } from './Container.jsx'

/**
 * Bloque vertical de página. Encapsula el ritmo vertical para que ninguna
 * página tenga que recordar el espaciado correcto.
 */
export function Section({ id, className, containerClassName, children, labelledBy }) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx('py-16 sm:py-24 lg:py-28', className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}
