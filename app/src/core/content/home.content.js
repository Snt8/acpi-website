import { PATHS } from '../routing/paths.js'
import { BRACELET_SHOWCASE } from './media.content.js'
import { SYSTEM_COMPONENTS } from './site.content.js'

export const HOME_HERO = Object.freeze({
  title: 'Asistencia Inteligente para Cruces Seguros',
  lead: 'ACPI traduce a vibración la información de un cruce peatonal: hacia dónde queda el paso y cuándo se puede pasar. Se lleva en la muñeca, no ocupa el oído y no exige sacar el teléfono.',
  actions: [
    { id: 'bracelet', label: 'Conocer el brazalete', to: PATHS.bracelet, variant: 'primary' },
    { id: 'why', label: '¿Por qué ACPI?', href: '#por-que', variant: 'secondary' },
  ],
  image: BRACELET_SHOWCASE,
})

/**
 * El problema está en cómo la calle entrega su información, no en quien la
 * recorre. La redacción de esta sección parte de ahí.
 */
export const HOME_PROBLEM = Object.freeze({
  id: 'por-que',
  eyebrow: 'El problema',
  title: '¿Por qué ACPI?',
  intro:
    'Un cruce peatonal comunica casi todo por vía visual: la dirección del paso, el estado de la luz y el tiempo restante. Cuando esa información no está disponible en otro formato, quedan tres preguntas sin respuesta.',
  questions: [
    {
      id: 'orientation',
      question: '¿Hacia dónde va el cruce?',
      answer:
        'Unos pocos grados de desviación al bajar del andén bastan para terminar caminando en diagonal hacia el centro de la intersección, y la calzada no ofrece ninguna referencia para corregir a tiempo.',
    },
    {
      id: 'timing',
      question: '¿Ya se puede pasar?',
      answer:
        'No todos los semáforos tienen señal sonora. Los que la tienen a veces están dañados, apagados de noche o tapados por el ruido del tráfico.',
    },
    {
      id: 'remaining',
      question: '¿Cuánto tiempo queda?',
      answer:
        'Saber que la luz cambió no es lo mismo que saber cuántos segundos quedan para completar el cruce con holgura.',
    },
  ],
})

/** Qué hace ACPI con esas tres preguntas y bajo qué criterios. */
export const HOME_RESPONSE = Object.freeze({
  id: 'la-respuesta',
  eyebrow: 'La respuesta',
  title: 'La información del cruce, en la muñeca',
  lead: 'Hoy esas respuestas dependen de la señalización que tenga cada esquina. ACPI las entrega directamente, en el momento en que hacen falta, para que la decisión de cruzar sea de quien cruza.',
  principles: [
    {
      id: 'haptic-first',
      title: 'Vibración antes que sonido',
      body: 'El oído es la principal herramienta para leer el tráfico. Ocuparlo con pitidos o audífonos restaría seguridad, así que la información va a la muñeca.',
    },
    {
      id: 'on-device',
      title: 'Decide el propio brazalete',
      body: 'El cálculo de la orientación ocurre dentro del dispositivo. Ni internet, ni servidor, ni celular participan en esa decisión.',
    },
    {
      id: 'phone-optional',
      title: 'El teléfono es opcional',
      body: 'Las funciones esenciales se usan sin sacar el celular del bolsillo. La app agrega comodidad y registro, no permiso para funcionar.',
    },
  ],
})

/** Los tres componentes del boceto. */
export const HOME_PILLARS = Object.freeze({
  eyebrow: 'El sistema',
  title: 'Tres piezas que se reparten el trabajo',
  description:
    'Lo esencial ocurre entre la baliza del semáforo y el brazalete. La app y el panel de datos acompañan.',
  items: SYSTEM_COMPONENTS,
})
