import {
  BRACELET_CALLOUTS,
  BRACELET_HERO,
} from '../../../core/content/bracelet.content.js'
import { stagger } from '../../../shared/lib/stagger.js'
import { Container, Reveal, SpinViewer } from '../../../shared/ui/index.js'
import { Callout } from '../components/Callout.jsx'

const bySide = (side) => BRACELET_CALLOUTS.filter((callout) => callout.side === side)

/**
 * Portada de la página: "ACPI V3.0 · Ya está aquí", el brazalete girable en el
 * centro y los comentarios flotantes repartidos a ambos lados, como en el
 * boceto.
 */
export function BraceletHero() {
  const { title, subtitle, lead, frames, spin } = BRACELET_HERO

  return (
    <section aria-labelledby="brazalete-titulo" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-paper opacity-60 mask-fade-edges"
      />
      <Container className="relative py-16 text-center sm:py-24 lg:py-28">
        <Reveal
          as="h1"
          id="brazalete-titulo"
          className="text-5xl sm:text-6xl lg:text-7xl"
        >
          {title}
        </Reveal>
        <Reveal as="p" delay={160} className="mt-4 text-xl text-ink-soft sm:text-2xl">
          {subtitle}
        </Reveal>
        <Reveal
          as="p"
          delay={300}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg"
        >
          {lead}
        </Reveal>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,24rem)_1fr] lg:gap-12">
          <ul className="order-2 grid gap-6 text-left lg:order-1 lg:gap-14">
            {bySide('left').map((callout, index) => (
              <Callout key={callout.id} delay={stagger(index, 160)} {...callout} />
            ))}
          </ul>

          <Reveal delay={200} className="order-1 mx-auto w-full max-w-md lg:order-2">
            <SpinViewer frames={frames} label={spin.label} hint={spin.hint} />
          </Reveal>

          <ul className="order-3 grid gap-6 text-left lg:gap-14">
            {bySide('right').map((callout, index) => (
              <Callout key={callout.id} delay={stagger(index, 160)} {...callout} />
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
