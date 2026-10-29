/** Trazos de cada pieza del sistema, en una retícula de 24 × 24. */
const PATHS = Object.freeze({
  beacon: (
    <>
      <rect x="7" y="2" width="8" height="14" rx="2.5" />
      <circle cx="11" cy="6" r="1" />
      <circle cx="11" cy="9" r="1" />
      <circle cx="11" cy="12" r="1" />
      <path d="M11 16v6M18 6.5a4 4 0 0 1 0 5M20.5 4.5a7.5 7.5 0 0 1 0 9" />
    </>
  ),
  bracelet: (
    <>
      <rect x="6" y="7" width="12" height="10" rx="3" />
      <path d="M9 7V3h6v4M9 17v4h6v-4M2.5 10v4M21.5 10v4" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M10.5 18.5h3M12 13.5c-1.5-2-3-3-3-4.5a3 3 0 0 1 6 0c0 1.5-1.5 2.5-3 4.5Z" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 14v-3M12 14V8M16 14v-5M9 21h6M12 18v3" />
    </>
  ),
})

/** Icono decorativo de una pieza del sistema; el texto vecino la nombra. */
export function FlowIcon({ name, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  )
}
