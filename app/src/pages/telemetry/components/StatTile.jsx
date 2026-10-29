/**
 * Cifra destacada con su etiqueta. Va dentro de un `<dl>`, de modo que el
 * lector de pantalla anuncia cada valor junto a lo que mide.
 */
export function StatTile({ label, value }) {
  return (
    // La cifra se ancla abajo: así todas comparten línea aunque la etiqueta
    // de alguna ocupe dos renglones.
    <div className="flex flex-col rounded-card border border-line bg-paper p-5">
      <dt className="text-sm leading-snug text-ink-soft">{label}</dt>
      <dd className="mt-auto pt-2 font-display text-3xl font-semibold tracking-tight text-ink">
        {value}
      </dd>
    </div>
  )
}
