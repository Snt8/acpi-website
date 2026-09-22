import { HeroSection } from './sections/HeroSection.jsx'
import { PillarsSection } from './sections/PillarsSection.jsx'
import { ProblemSection } from './sections/ProblemSection.jsx'
import { ResponseSection } from './sections/ResponseSection.jsx'

/**
 * Página de inicio. Cada parte del discurso ocupa su propia sección:
 * portada, problema, respuesta y componentes del sistema.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <ResponseSection />
      <PillarsSection />
    </>
  )
}
