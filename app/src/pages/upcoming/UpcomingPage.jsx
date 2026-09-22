import { PATHS } from '../../core/routing/paths.js'
import { Button, Card, Reveal, Section } from '../../shared/ui/index.js'

/**
 * Página de una sección anunciada en el nav cuyo diseño todavía no existe.
 * Mantiene el contenido y la estructura del sitio para que la navegación
 * nunca lleve a un vacío.
 */
export default function UpcomingPage({ title, lead, body }) {
  return (
    <Section labelledBy="proximamente-titulo">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
          Próximamente
        </p>
        <h1 id="proximamente-titulo" className="mt-3 text-4xl sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{lead}</p>
      </Reveal>

      <Card className="mt-10 max-w-3xl">
        <p className="text-base leading-relaxed text-ink-soft">{body}</p>
        <p className="mt-6 text-sm text-ink-faint">
          Esta sección está a la espera de su boceto de diseño.
        </p>
      </Card>

      <div className="mt-10">
        <Button variant="secondary" to={PATHS.home}>
          Volver al inicio
        </Button>
      </div>
    </Section>
  )
}
