import { cx } from '../lib/cx.js'

/** Estilo común de `input`, `select` y `textarea`. */
export const fieldControlClasses =
  'block w-full rounded-xl border border-line-strong bg-paper-raised px-4 py-2.5 text-base text-ink placeholder:text-ink-faint transition-colors duration-200 hover:border-ink-faint aria-[invalid=true]:border-amber'

/**
 * Campo de formulario: etiqueta, control y mensaje de error enlazados.
 * El control lo pone quien lo usa, a través de `children(controlProps)`, de
 * modo que el mismo campo sirve para cualquier tipo de entrada sin perder la
 * relación accesible entre etiqueta, valor y error.
 *
 * @param {{
 *   id: string,
 *   label: string,
 *   error?: string,
 *   className?: string,
 *   children: (controlProps: object) => import('react').ReactNode,
 * }} props
 */
export function Field({ id, label, error, className, children }) {
  const errorId = `${id}-error`

  return (
    <div className={cx('grid gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error ? (
        <p id={errorId} className="text-sm text-amber">
          {error}
        </p>
      ) : null}
    </div>
  )
}
