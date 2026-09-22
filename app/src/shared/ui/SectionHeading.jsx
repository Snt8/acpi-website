import { cx } from '../lib/cx.js'

/** Título de sección con antetítulo y bajada opcionales. */
export function SectionHeading({ id, eyebrow, title, description, className }) {
  return (
    <header className={cx('max-w-3xl', className)}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-signal">
          {eyebrow}
        </p>
      ) : null}
      <h2 id={id} className="text-3xl sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">
          {description}
        </p>
      ) : null}
    </header>
  )
}
