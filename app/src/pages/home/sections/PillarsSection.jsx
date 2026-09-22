import { HOME_PILLARS } from '../../../core/content/home.content.js'
import { stagger } from '../../../shared/lib/stagger.js'
import {
  LinkCard,
  Reveal,
  Section,
  SectionHeading,
} from '../../../shared/ui/index.js'

/** Los tres componentes del sistema, como las tarjetas del boceto. */
export function PillarsSection() {
  const { eyebrow, title, description, items } = HOME_PILLARS

  return (
    <Section labelledBy="pilares-titulo" className="border-t border-line">
      <Reveal>
        <SectionHeading
          id="pilares-titulo"
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
      </Reveal>

      <ul className="mt-12 grid gap-6 sm:mt-16 md:grid-cols-3">
        {items.map((component, index) => (
          <Reveal as="li" key={component.id} delay={stagger(index)} className="flex">
            <LinkCard {...component} />
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}
