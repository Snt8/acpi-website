import { BRACELET_FRAMES, SENSOR_IMAGES } from './media.content.js'

export const BRACELET_HERO = Object.freeze({
  title: 'ACPI V3.0',
  subtitle: 'Ya está aquí',
  lead: 'Una versión más pequeña y liviana, con la electrónica reorganizada para que el brazalete se lleve cómodamente durante todo el día.',
  frames: BRACELET_FRAMES,
  spin: {
    label: 'Brazalete ACPI V3.0: vista giratoria',
    hint: 'Desliza el puntero sobre el brazalete para girarlo, o usa las flechas del teclado.',
  },
})

/**
 * Comentarios flotantes alrededor del brazalete.
 * Describen únicamente lo que el prototipo hace hoy: orientación por brújula,
 * compensación con el acelerómetro, respuesta háptica y el rediseño de la V3.
 * `side` posiciona la llamada en escritorio; en móvil se apilan como lista,
 * que es la lectura correcta para un lector de pantalla.
 */
export const BRACELET_CALLOUTS = Object.freeze([
  {
    id: 'compass',
    side: 'left',
    title: 'Brújula: la orientación',
    body: 'El magnetómetro establece hacia dónde apunta la muñeca respecto al norte. Esa lectura se compara con la dirección que anuncia la baliza del cruce, y de esa comparación sale todo lo demás.',
  },
  {
    id: 'accelerometer',
    side: 'left',
    title: 'Acelerómetro: la corrección',
    body: 'Una brújula se equivoca cuando se inclina, y una muñeca nunca está horizontal. El acelerómetro mide el ángulo del brazo y corrige la lectura magnética con ese dato.',
  },
  {
    id: 'haptics',
    side: 'right',
    title: 'Vibración háptica',
    body: 'Dos motores, uno a cada lado. El lado que vibra es el lado hacia el que hay que girar, y dos pulsos cortos confirman que el cruce quedó al frente.',
  },
  {
    id: 'design',
    side: 'right',
    title: 'Diseño optimizado',
    body: 'La V3.0 reduce el tamaño y el peso respecto a las versiones anteriores, con un reparto interno que acerca los motores a los costados de la muñeca.',
  },
])

export const BRACELET_HARDWARE = Object.freeze({
  title: 'ACPI V3.0',
  headline: 'Con el poder del ESP32-C3 y el MPU-9250',
  body: 'Un microcontrolador con radio integrada y una unidad de medición inercial de nueve ejes. Entre los dos resuelven hacia dónde mira la muñeca y si esa dirección coincide con la del cruce, y lo repiten dos veces por segundo mientras el brazalete está activo.',
  parts: [
    { id: 'esp32c3', label: 'ESP32-C3', image: SENSOR_IMAGES.esp32c3 },
    { id: 'mpu9250', label: 'MPU-9250', image: SENSOR_IMAGES.mpu9250 },
  ],
})

export const BRACELET_OVERVIEW = Object.freeze({
  title: 'Breve información del brazalete',
  body: 'El brazalete escucha lo que la baliza del semáforo anuncia al aire —dirección del cruce, estado de la luz y segundos restantes— y lo compara con su propia orientación. Si ambas direcciones coinciden, dos pulsos cortos confirman que el paso quedó al frente; si no, vibra el lado hacia el que hay que girar. Ese cálculo ocurre dentro del propio dispositivo, sin consultar a ningún servidor.',
})

export const BRACELET_EXTRAS = Object.freeze({
  title: 'Otras dotes del brazalete',
  items: [
    {
      id: 'on-device',
      title: 'Decide en el propio dispositivo',
      body: 'La comparación entre la dirección del cruce y la de la muñeca se resuelve dentro del brazalete. Un sistema de seguridad no puede depender de que haya señal.',
    },
    {
      id: 'direct-radio',
      title: 'Radio directa con la baliza',
      body: 'El poste y el brazalete se hablan de aparato a aparato, sin wifi, sin red celular y sin nube de por medio. El mensaje tarda milisegundos.',
    },
    {
      id: 'no-account',
      title: 'Sin cuenta ni registro',
      body: 'El brazalete no se conecta a nada: solo escucha lo que la baliza anuncia al aire. Tampoco lleva GPS, así que no puede seguir un recorrido.',
    },
    {
      id: 'two-per-second',
      title: 'Dos lecturas por segundo',
      body: 'Suficiente para reaccionar a un giro del cuerpo durante el cruce, y lo bastante pausado para no consumir energía de más.',
    },
  ],
})

/**
 * Cierre de la página. El boceto anuncia cuatro secciones hermanas en la
 * barra superior, así que la del brazalete no debería terminar sin salida.
 */
export const BRACELET_NEXT = Object.freeze({
  eyebrow: 'Sigue el recorrido',
  title: 'El brazalete no trabaja solo',
  description:
    'Lo esencial ocurre entre la baliza del semáforo y la muñeca, pero el resto del sistema es el que convierte cada cruce en información útil para la ciudad.',
})
