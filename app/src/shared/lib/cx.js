/**
 * Concatena clases ignorando valores falsos.
 * Evita dependernos de una librería para algo de tres líneas.
 *
 * @param {...(string|false|null|undefined)} classNames
 * @returns {string}
 */
export function cx(...classNames) {
  return classNames.filter(Boolean).join(' ')
}
