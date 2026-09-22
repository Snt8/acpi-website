import { Link } from 'react-router-dom'
import { cx } from '../lib/cx.js'

// El botón crece al pasar por encima o al recibir el foco, y cede al pulsar.
// El crecimiento va tras `motion-safe`, no tras una anulación con
// `motion-reduce`: en Tailwind 4 `scale-*` escribe la propiedad `scale`, que
// `transform-none` no cancela, así que la única forma fiable de respetar la
// preferencia es no emitir la regla.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-[color,background-color,border-color,scale,box-shadow] duration-200 ease-out motion-safe:hover:scale-105 motion-safe:focus-visible:scale-105 motion-safe:active:scale-100'

const VARIANTS = Object.freeze({
  primary: 'bg-signal text-white hover:bg-signal-strong hover:shadow-lg hover:shadow-signal/20',
  secondary:
    'border border-line-strong bg-paper-raised text-ink hover:border-signal hover:text-signal hover:shadow-md hover:shadow-ink/5',
})

/**
 * Acción visual única para todo el sitio.
 * El elemento renderizado se decide por la prop recibida —`to` para
 * navegación interna, `href` para anclas y enlaces externos, nada para un
 * botón— de modo que la semántica HTML siempre sea la correcta.
 */
export function Button({ variant = 'primary', to, href, className, children, ...rest }) {
  const classes = cx(BASE, VARIANTS[variant] ?? VARIANTS.primary, className)

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}
