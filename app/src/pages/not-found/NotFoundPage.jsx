import { PATHS } from '../../core/routing/paths.js'
import { Button, Section } from '../../shared/ui/index.js'

/** Ruta inexistente. */
export default function NotFoundPage() {
  return (
    <Section labelledBy="no-encontrado-titulo">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
        Error 404
      </p>
      <h1 id="no-encontrado-titulo" className="mt-3 text-4xl sm:text-5xl">
        Esta página no existe
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
        El enlace que seguiste no lleva a ninguna sección del sitio.
      </p>
      <div className="mt-10">
        <Button to={PATHS.home}>Volver al inicio</Button>
      </div>
    </Section>
  )
}
