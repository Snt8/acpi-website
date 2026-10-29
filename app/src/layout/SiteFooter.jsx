import { BRAND_LOGO } from '../core/content/media.content.js'
import { BRAND, FOOTER } from '../core/content/site.content.js'
import { Container } from '../shared/ui/index.js'

/** Pie del boceto: "@ACPI ~ ETITC ~ Edy S. Ávila". */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-raised">
      <Container className="flex flex-col items-center gap-4 py-10 text-center">
        {/* El nombre ya lo anuncia la línea final; aquí el logo es decorativo. */}
        <img
          src={BRAND_LOGO.src}
          width={BRAND_LOGO.width}
          height={BRAND_LOGO.height}
          alt=""
          loading="lazy"
          decoding="async"
          className="mb-2 h-14 w-auto"
        />
        <p className="max-w-2xl text-sm leading-relaxed text-ink-faint">
          {FOOTER.note}
        </p>
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-medium text-ink-soft">
          {FOOTER.credits.map((credit, index) => (
            <span key={credit} className="flex items-center gap-3">
              {index > 0 ? (
                <span aria-hidden="true" className="text-line-strong">
                  ~
                </span>
              ) : null}
              {credit}
            </span>
          ))}
        </p>
        <p className="text-xs text-ink-faint">{BRAND.fullName}</p>
      </Container>
    </footer>
  )
}
