import { HOME_RESPONSE } from '../../../core/content/home.content.js'
import { stagger } from '../../../shared/lib/stagger.js'
import { Reveal, Section, SectionHeading } from '../../../shared/ui/index.js'

/** Sección "La respuesta": qué hace ACPI y bajo qué criterios de diseño. */
export function ResponseSection() {
  const { id, eyebrow, title, lead, principles } = HOME_RESPONSE

  return (
    <Section
      id={id}
      labelledBy="respuesta-titulo"
      className="border-t border-line bg-paper-raised"
    >
      <Reveal>
        <SectionHeading
          id="respuesta-titulo"
          eyebrow={eyebrow}
          title={title}
          description={lead}
        />
      </Reveal>

      <ul className="mt-12 grid gap-x-10 gap-y-10 sm:mt-14 sm:grid-cols-3">
        {principles.map((principle, index) => (
          <Reveal
            as="li"
            key={principle.id}
            delay={stagger(index)}
            className="border-l-2 border-signal pl-6"
          >
            <h3 className="text-lg">{principle.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              {principle.body}
            </p>
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}
