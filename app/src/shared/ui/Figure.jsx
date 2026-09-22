import { cx } from '../lib/cx.js'
import { Reveal } from './Reveal.jsx'

/**
 * Imagen enmarcada con la misma aparición que el resto del contenido.
 * El marco reproduce el papel cuadriculado del boceto por detrás de la pieza,
 * que llega recortada sobre fondo claro.
 */
export function Figure({
  src,
  alt,
  caption,
  delay = 0,
  priority = false,
  ratio = 'aspect-square',
  className,
  imageClassName,
}) {
  return (
    <Reveal delay={delay} className={className}>
      <figure className="relative">
        <div
          className={cx(
            'relative overflow-hidden rounded-card border border-line bg-paper-raised',
            ratio,
          )}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-grid-paper opacity-50 mask-fade-edges"
          />
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className={cx(
              'relative h-full w-full object-contain p-6 sm:p-10',
              imageClassName,
            )}
          />
        </div>
        {caption ? (
          <figcaption className="mt-4 text-center text-sm text-ink-faint">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </Reveal>
  )
}
