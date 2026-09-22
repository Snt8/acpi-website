/**
 * Retardo escalonado para animar los elementos de una lista uno tras otro.
 *
 * @param {number} index posición del elemento
 * @param {number} [step] milisegundos entre elementos
 * @returns {number} retardo en milisegundos
 */
export const stagger = (index, step = 140) => index * step
