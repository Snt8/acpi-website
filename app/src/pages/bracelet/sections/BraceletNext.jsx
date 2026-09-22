import { BRACELET_NEXT } from '../../../core/content/bracelet.content.js'
import { SYSTEM_COMPONENTS } from '../../../core/content/site.content.js'
import { PATHS } from '../../../core/routing/paths.js'
import { stagger } from '../../../shared/lib/stagger.js'
import {
  LinkCard,
  Reveal,
  Section,
  SectionHeading,
} from '../../../shared/ui/index.js'

const others = SYSTEM_COMPONENTS.filter((component) => component.to !== PATHS.bracelet)

/** Enlaces a las demás piezas del sistema, para no cerrar la página en seco. */
export function BraceletNext() {
  const { eyebrow, title, description } = BRACELET_NEXT

  return (
    <Section labelledBy="siguiente-titulo" className="border-t border-line">
      <Reveal>
        <SectionHeading
          id="siguiente-titulo"
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
      </Reveal>

      <ul className="mt-12 grid gap-6 sm:mt-16 md:grid-cols-2">
        {others.map((component, index) => (
          <Reveal as="li" key={component.id} delay={stagger(index)} className="flex">
            <LinkCard {...component} />
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}
