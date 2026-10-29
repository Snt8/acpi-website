import { useState } from 'react'
import {
  REPORT_FORM,
  REPORT_ISSUE_LABELS,
} from '../../../core/content/telemetry.content.js'
import {
  REPORT_ISSUES,
  REPORT_LIMITS,
  createReport,
} from '../../../core/telemetry/reports.js'
import { Button, Card, Field, fieldControlClasses } from '../../../shared/ui/index.js'
import {
  EMPTY_POSITION_INPUT,
  parsePositionInput,
  toPositionInput,
} from '../lib/positionInput.js'

/** Orden en que se enfoca el primer campo con error. */
const FIELD_ORDER = Object.freeze(['name', 'issue', 'note', 'position'])
const CONTROL_FOR = Object.freeze({ position: 'lat' })
const POSITION_ERROR_ID = 'reporte-posicion-error'

const canGeolocate = () => typeof navigator !== 'undefined' && 'geolocation' in navigator

const errorMessage = (errors, field) =>
  errors[field] ? REPORT_FORM.errors[field][errors[field]] : undefined

/**
 * Formulario de reporte. Las coordenadas son controladas por la sección,
 * porque también las escribe el mapa; el resto de campos se leen al enviar.
 * Elegir un punto en el mapa nunca es imprescindible: se puede escribir o
 * pedir la ubicación del dispositivo, que es lo que necesita quien no ve.
 */
export function ReportForm({ position, onPositionChange, onSubmit }) {
  const [errors, setErrors] = useState({})
  const [announcement, setAnnouncement] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const { fields } = REPORT_FORM
  const positionError = errorMessage(errors, 'position')

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    const result = createReport({
      name: String(data.get('name') ?? ''),
      issue: String(data.get('issue') ?? ''),
      note: String(data.get('note') ?? ''),
      position: parsePositionInput(position) ?? undefined,
    })

    if (!result.ok) {
      setErrors(result.errors)
      setAnnouncement('')
      const firstInvalid = FIELD_ORDER.find((field) => result.errors[field])
      form.elements.namedItem(CONTROL_FOR[firstInvalid] ?? firstInvalid)?.focus()
      return
    }

    onSubmit(result.report)
    form.reset()
    onPositionChange(EMPTY_POSITION_INPUT)
    setErrors({})
    setAnnouncement(REPORT_FORM.saved)
  }

  const handleLocate = () => {
    setIsLocating(true)
    setAnnouncement(REPORT_FORM.locating)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false)
        setAnnouncement('')
        onPositionChange(toPositionInput({ lat: coords.latitude, lng: coords.longitude }))
      },
      () => {
        setIsLocating(false)
        setAnnouncement(REPORT_FORM.locationDenied)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const setCoordinate = (axis) => (event) =>
    onPositionChange({ ...position, [axis]: event.target.value })

  return (
    <Card as="section" aria-labelledby="reporte-form-titulo">
      <h3 id="reporte-form-titulo" className="text-xl">
        {REPORT_FORM.title}
      </h3>

      <form noValidate onSubmit={handleSubmit} className="mt-6 grid gap-5">
        <Field id="reporte-nombre" label={fields.name.label} error={errorMessage(errors, 'name')}>
          {(control) => (
            <input
              {...control}
              name="name"
              type="text"
              required
              maxLength={REPORT_LIMITS.name}
              autoComplete="off"
              placeholder={fields.name.placeholder}
              className={fieldControlClasses}
            />
          )}
        </Field>

        <Field id="reporte-problema" label={fields.issue.label} error={errorMessage(errors, 'issue')}>
          {(control) => (
            <select {...control} name="issue" required defaultValue="" className={fieldControlClasses}>
              <option value="" disabled>
                {fields.issue.placeholder}
              </option>
              {REPORT_ISSUES.map((issue) => (
                <option key={issue} value={issue}>
                  {REPORT_ISSUE_LABELS[issue]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field id="reporte-detalle" label={fields.note.label} error={errorMessage(errors, 'note')}>
          {(control) => (
            <textarea
              {...control}
              name="note"
              rows={3}
              maxLength={REPORT_LIMITS.note}
              placeholder={fields.note.placeholder}
              className={fieldControlClasses}
            />
          )}
        </Field>

        <fieldset className="grid gap-3">
          <legend className="sr-only">Coordenadas del cruce</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {['lat', 'lng'].map((axis) => (
              <Field key={axis} id={`reporte-${axis}`} label={fields[axis].label}>
                {(control) => (
                  <input
                    {...control}
                    // El error es de la pareja: se muestra una vez, bajo ambas.
                    aria-invalid={positionError ? true : undefined}
                    aria-describedby={positionError ? POSITION_ERROR_ID : undefined}
                    name={axis}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={position[axis]}
                    onChange={setCoordinate(axis)}
                    className={fieldControlClasses}
                  />
                )}
              </Field>
            ))}
          </div>
          {positionError ? (
            <p id={POSITION_ERROR_ID} className="text-sm text-amber">
              {positionError}
            </p>
          ) : null}
          {canGeolocate() ? (
            <button
              type="button"
              onClick={handleLocate}
              disabled={isLocating}
              className="justify-self-start text-sm font-semibold text-signal underline-offset-4 hover:underline disabled:text-ink-faint"
            >
              {isLocating ? REPORT_FORM.locating : REPORT_FORM.useLocation}
            </button>
          ) : null}
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit">{REPORT_FORM.submit}</Button>
          <p role="status" className="text-sm text-signal">
            {announcement}
          </p>
        </div>
      </form>
    </Card>
  )
}
