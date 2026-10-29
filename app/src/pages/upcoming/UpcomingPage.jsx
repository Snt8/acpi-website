import { PATHS } from '../../core/routing/paths.js'
import { stagger } from '../../shared/lib/stagger.js'
import { Button, Card, Container, Figure, Reveal, Section } from '../../shared/ui/index.js'

/**
 * Página de una sección anunciada en el nav cuyo diseño todavía no existe.
 * Mantiene el contenido y la estructura del sitio para que la navegación
 * nunca lleve a un vacío; la ilustración y los puntos clave, si los hay,
 * la acompañan mientras llega el boceto.
 */
export default function UpcomingPage({ title, lead, body, image, highlights }) {
  return (
    <>
      <section aria-labelledby="proximamente-titulo" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid-paper opacity-60 mask-fade-edges"
        />
        <Container className="relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:py-28">
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                Próximamente
              </p>
              <h1 id="proximamente-titulo" className="mt-3 text-4xl sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{lead}</p>
            </Reveal>

            <Reveal delay={120}>
              <Card className="mt-10">
                <p className="text-base leading-relaxed text-ink-soft">{body}</p>
                <p className="mt-6 text-sm text-ink-faint">
                  Esta sección está a la espera de su boceto de diseño.
                </p>
              </Card>
            </Reveal>

            <div className="mt-10">
              <Button variant="secondary" to={PATHS.home}>
                Volver al inicio
              </Button>
            </div>
          </div>

          {image ? (
            <Figure
              src={image.src}
              alt={image.alt}
              priority
              delay={200}
              ratio={image.ratio}
              imageClassName="p-6 sm:p-8"
              className="mx-auto w-full max-w-md"
            />
          ) : null}
        </Container>
      </section>

      {highlights ? (
        <Section labelledBy="puntos-clave-titulo" className="border-t border-line bg-paper-raised">
          <Reveal as="h2" id="puntos-clave-titulo" className="text-3xl sm:text-4xl">
            {highlights.title}
          </Reveal>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.items.map((item, index) => (
              <Reveal
                as="li"
                key={item.id}
                delay={stagger(index, 100)}
                className="border-l-2 border-signal-soft pl-4"
              >
                <h3 className="text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </Reveal>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  )
}
