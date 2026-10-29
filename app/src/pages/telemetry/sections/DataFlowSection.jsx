import { TELEMETRY_FLOW } from '../../../core/content/telemetry.content.js'
import { stagger } from '../../../shared/lib/stagger.js'
import { ArrowIcon, Reveal, Section, SectionHeading } from '../../../shared/ui/index.js'
import { FlowIcon } from '../components/FlowIcon.jsx'

/**
 * Recorrido de un dato de la esquina al panel. Es una lista ordenada y no
 * una imagen: se lee igual con lector de pantalla y se apila en móvil.
 */
export function DataFlowSection() {
  const { eyebrow, title, description, steps } = TELEMETRY_FLOW

  return (
    <Section labelledBy="flujo-titulo" className="border-t border-line">
      <Reveal>
        <SectionHeading
          id="flujo-titulo"
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
      </Reveal>

      <ol className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <Reveal
            as="li"
            key={step.id}
            delay={stagger(index, 120)}
            className="relative flex flex-col rounded-card border border-line bg-paper-raised p-6"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-soft text-signal">
              <FlowIcon name={step.id} className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-lg">
              <span className="sr-only">Paso {index + 1}: </span>
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            {step.link ? (
              <p className="mt-auto flex items-center gap-2 pt-5 text-xs font-semibold uppercase tracking-[0.12em] text-amber">
                <ArrowIcon className="h-3.5 w-3.5 shrink-0" />
                {step.link}
              </p>
            ) : null}
          </Reveal>
        ))}
      </ol>
    </Section>
  )
}
