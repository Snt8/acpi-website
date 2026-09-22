import {
  BRACELET_EXTRAS,
  BRACELET_HARDWARE,
  BRACELET_OVERVIEW,
} from '../../../core/content/bracelet.content.js'
import { stagger } from '../../../shared/lib/stagger.js'
import { Card, Figure, Reveal, Section } from '../../../shared/ui/index.js'

/**
 * Bloque inferior del boceto: a la izquierda el hardware que mueve la
 * pulsera, a la derecha la información breve y las demás capacidades.
 */
export function BraceletDetails() {
  return (
    <Section
      labelledBy="detalle-titulo"
      className="border-t border-line bg-paper-raised"
      containerClassName="grid gap-6 lg:grid-cols-2 lg:items-start"
    >
      <Reveal>
        <h2 id="detalle-titulo" className="text-3xl sm:text-4xl">
          {BRACELET_HARDWARE.title}
        </h2>

        <Card className="mt-6 bg-paper">
          <h3 className="text-xl">{BRACELET_HARDWARE.headline}</h3>
          <p className="mt-3 text-base leading-relaxed text-ink-soft">
            {BRACELET_HARDWARE.body}
          </p>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {BRACELET_HARDWARE.parts.map((part, index) => (
              <li key={part.id}>
                <Figure
                  src={part.image.src}
                  alt={part.image.alt}
                  caption={part.label}
                  delay={stagger(index, 160)}
                  ratio="aspect-[5/4]"
                  imageClassName="p-3 sm:p-4"
                />
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>

      <div className="grid gap-6">
        <Reveal as="article" delay={120}>
          <Card className="bg-paper">
            <h3 className="text-xl">{BRACELET_OVERVIEW.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              {BRACELET_OVERVIEW.body}
            </p>
          </Card>
        </Reveal>

        <Reveal as="article" delay={220}>
          <Card className="bg-paper">
            <h3 className="text-xl">{BRACELET_EXTRAS.title}</h3>
            <ul className="mt-5 grid gap-4">
              {BRACELET_EXTRAS.items.map((item, index) => (
                <Reveal
                  as="li"
                  key={item.id}
                  delay={stagger(index, 80)}
                  className="border-l-2 border-signal-soft pl-4"
                >
                  <h4 className="text-base font-semibold text-ink">{item.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                </Reveal>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>
    </Section>
  )
}
