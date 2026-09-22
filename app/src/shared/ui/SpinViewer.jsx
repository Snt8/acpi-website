import { useCallback, useState } from 'react'
import { cx } from '../lib/cx.js'

const wrap = (value, length) => ((value % length) + length) % length

/**
 * Visor que deja girar una pieza deslizando el puntero por encima.
 *
 * La posición horizontal dentro del marco elige el fotograma, así que basta
 * con mover el ratón —sin arrastrar ni hacer clic— y el mismo gesto funciona
 * con el dedo. Las flechas del teclado avanzan y retroceden un fotograma,
 * para que girar la pieza no dependa de tener un puntero.
 *
 * Todos los fotogramas se montan a la vez y solo cambia cuál es opaco: así el
 * giro no parpadea esperando descargas a mitad del gesto. El relevo entre uno
 * y otro es muy corto a propósito: con seis vistas los ángulos distan bastante
 * entre sí, y un fundido largo se vería como una imagen doble.
 */
export function SpinViewer({ frames, label, hint, className }) {
  const [index, setIndex] = useState(0)

  const pickFromPointer = useCallback(
    (event) => {
      const { left, width } = event.currentTarget.getBoundingClientRect()
      if (!width) return
      const position = (event.clientX - left) / width
      const frame = Math.floor(position * frames.length)
      setIndex(Math.min(frames.length - 1, Math.max(0, frame)))
    },
    [frames.length],
  )

  const step = useCallback(
    (direction) => setIndex((current) => wrap(current + direction, frames.length)),
    [frames.length],
  )

  const handleKeyDown = (event) => {
    const direction = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
    if (!direction) return
    event.preventDefault()
    step(direction)
  }

  return (
    <div className={className}>
      <div
        role="group"
        aria-label={label}
        tabIndex={0}
        onPointerMove={pickFromPointer}
        onKeyDown={handleKeyDown}
        className="relative aspect-square cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-card border border-line bg-paper-raised"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-grid-paper opacity-50 mask-fade-edges"
        />

        {frames.map((frame, position) => {
          const isActive = position === index
          return (
            <img
              key={frame.src}
              src={frame.src}
              alt={isActive ? frame.alt : ''}
              aria-hidden={!isActive}
              draggable={false}
              decoding="async"
              fetchPriority={position === 0 ? 'high' : 'low'}
              className={cx(
                'absolute inset-0 h-full w-full object-contain p-6 transition-opacity duration-75 sm:p-10',
                isActive ? 'opacity-100' : 'opacity-0',
              )}
            />
          )
        })}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2.5">
        <ol className="flex items-center gap-2" aria-hidden="true">
          {frames.map((frame, position) => (
            <li
              key={frame.src}
              className={cx(
                'h-1.5 rounded-full transition-all duration-200',
                position === index ? 'w-6 bg-signal' : 'w-1.5 bg-line-strong',
              )}
            />
          ))}
        </ol>
        {hint ? <p className="text-sm text-ink-faint">{hint}</p> : null}
      </div>
    </div>
  )
}
