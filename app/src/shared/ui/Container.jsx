import { cx } from '../lib/cx.js'

/** Ancho máximo y márgenes laterales comunes a todas las secciones. */
export function Container({ as: Tag = 'div', className, children }) {
  return (
    <Tag className={cx('mx-auto w-full max-w-6xl px-5 sm:px-8', className)}>
      {children}
    </Tag>
  )
}
