import { HOME_HERO } from '../../../core/content/home.content.js'
import { ArrowIcon, Button, Container, Figure, Reveal } from '../../../shared/ui/index.js'

/**
 * Portada: la fotografía del brazalete a la izquierda y, a la derecha, el
 * título, las dos acciones y la descripción breve del proyecto.
 * Ocupa casi toda la altura de la ventana para que la página pida un primer
 * desplazamiento antes de entrar en el contenido.
 */
export function HeroSection() {
  const { title, lead, actions, image } = HOME_HERO

  return (
    <section aria-labelledby="inicio-titulo" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-paper opacity-60 mask-fade-edges"
      />
      <Container className="relative grid min-h-[70svh] items-center gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
        <Figure
          src={image.src}
          alt={image.alt}
          priority
          delay={150}
          className="order-2 mx-auto w-full max-w-lg lg:order-1"
        />

        <div className="order-1 lg:order-2">
          <Reveal
            as="h1"
            id="inicio-titulo"
            className="text-4xl sm:text-5xl lg:text-6xl"
          >
            {title}
          </Reveal>

          <Reveal delay={200} className="mt-8 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                to={action.to}
                href={action.href}
              >
                {action.label}
                <ArrowIcon className="h-4 w-4" />
              </Button>
            ))}
          </Reveal>

          <Reveal
            as="p"
            delay={340}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft"
          >
            {lead}
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
