import { cx } from '../lib/cx.js'

/**
 * Tarjeta de contenido. Los bordes redondeados y el trazo fino son la
 * traducción de los recuadros a mano del boceto.
 */
export function Card({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        'rounded-card border border-line bg-paper-raised p-6 sm:p-8',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
