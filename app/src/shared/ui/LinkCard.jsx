import { Link } from 'react-router-dom'
import { ArrowIcon } from './ArrowIcon.jsx'
import { Card } from './Card.jsx'

/**
 * Tarjeta que presenta una sección y enlaza a ella.
 * El enlace se extiende sobre toda la tarjeta con un pseudoelemento, de modo
 * que cualquier punto es zona de clic sin multiplicar los destinos de foco
 * del teclado.
 */
export function LinkCard({ title, summary, to }) {
  return (
    <Card className="group relative flex h-full w-full flex-col transition-[border-color,box-shadow,translate] duration-300 ease-out hover:border-signal hover:shadow-lg hover:shadow-ink/5 motion-safe:hover:-translate-y-1">
      <h3 className="text-xl">{title}</h3>
      <p className="mt-3 flex-1 text-base leading-relaxed text-ink-soft">{summary}</p>
      <Link
        to={to}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-signal after:absolute after:inset-0 after:content-['']"
      >
        Saber más
        <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        <span className="sr-only">sobre {title}</span>
      </Link>
    </Card>
  )
}
