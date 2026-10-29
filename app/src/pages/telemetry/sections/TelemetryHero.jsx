import { TELEMETRY_HERO } from '../../../core/content/telemetry.content.js'
import { Container, Figure, Reveal } from '../../../shared/ui/index.js'

/** Portada de la página: qué es el panel y para quién trabaja. */
export function TelemetryHero() {
  const { eyebrow, title, lead, image } = TELEMETRY_HERO

  return (
    <section aria-labelledby="telemetria-titulo" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-paper opacity-60 mask-fade-edges"
      />
      <Container className="relative grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <Reveal
            as="p"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-signal"
          >
            {eyebrow}
          </Reveal>
          <Reveal
            as="h1"
            id="telemetria-titulo"
            delay={120}
            className="mt-3 text-5xl sm:text-6xl"
          >
            {title}
          </Reveal>
          <Reveal
            as="p"
            delay={240}
            className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg"
          >
            {lead}
          </Reveal>
        </div>

        <Figure
          src={image.src}
          alt={image.alt}
          priority
          delay={200}
          ratio={image.ratio}
          imageClassName="p-4 sm:p-6"
          className="mx-auto w-full max-w-xl"
        />
      </Container>
    </section>
  )
}
