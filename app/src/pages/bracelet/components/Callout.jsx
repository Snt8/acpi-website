import { cx } from '../../../shared/lib/cx.js'
import { Reveal } from '../../../shared/ui/index.js'

/**
 * Comentario flotante que señala una pieza del brazalete.
 * En escritorio se alinea hacia el render —el trazo corto apunta al centro—
 * y en móvil se comporta como una tarjeta normal apilada.
 */
export function Callout({ title, body, side, delay }) {
  const isLeft = side === 'left'

  return (
    <Reveal
      as="li"
      delay={delay}
      className={cx(
        'relative rounded-card border border-line bg-paper-raised/80 p-5 backdrop-blur-sm',
        'lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none',
        isLeft ? 'lg:text-right' : 'lg:text-left',
      )}
    >
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
      <span
        aria-hidden="true"
        className={cx(
          'mt-4 hidden h-px w-12 bg-line-strong lg:block',
          isLeft && 'lg:ml-auto',
        )}
      />
    </Reveal>
  )
}
