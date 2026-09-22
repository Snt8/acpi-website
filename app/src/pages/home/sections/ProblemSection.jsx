import { HOME_PROBLEM } from '../../../core/content/home.content.js'
import { stagger } from '../../../shared/lib/stagger.js'
import { Reveal, Section, SectionHeading } from '../../../shared/ui/index.js'

/** Sección "¿Por qué ACPI?": las tres preguntas que un cruce deja sin responder. */
export function ProblemSection() {
  const { id, eyebrow, title, intro, questions } = HOME_PROBLEM

  return (
    <Section id={id} labelledBy="problema-titulo" className="border-t border-line">
      <Reveal>
        <SectionHeading
          id="problema-titulo"
          eyebrow={eyebrow}
          title={title}
          description={intro}
        />
      </Reveal>

      <ul className="mt-12 grid gap-x-10 gap-y-10 sm:mt-14 sm:grid-cols-3">
        {questions.map((item, index) => (
          <Reveal
            as="li"
            key={item.id}
            delay={stagger(index)}
            className="border-t-2 border-signal-soft pt-5"
          >
            <h3 className="text-xl">{item.question}</h3>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              {item.answer}
            </p>
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}
