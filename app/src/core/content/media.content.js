import bracelet1 from '../../assets/acpi-pulsera1.png'
import bracelet2 from '../../assets/acpi-pulsera2.png'
import bracelet3 from '../../assets/acpi-pulsera3.png'
import bracelet4 from '../../assets/acpi-pulsera4.png'
import bracelet5 from '../../assets/acpi-pulsera5.png'
import bracelet6 from '../../assets/acpi-pulsera6.png'
import esp32c3 from '../../assets/esp32c3-picture.png'
import mpu9250 from '../../assets/mpu9250-picture.png'
import logo from '../../assets/brand/acpi-logo.webp'
import appPhone from '../../assets/illustrations/app-phone.svg'
import storyCrossing from '../../assets/illustrations/story-crossing.svg'
import telemetryCity from '../../assets/illustrations/telemetry-city.svg'

/**
 * Catálogo de imágenes del sitio.
 * Centralizar aquí los `import` deja a las páginas sin rutas de archivo y
 * permite que Vite siga resolviendo y versionando cada asset en la compilación.
 */

/**
 * Logo V3.5 del repositorio ACPI (`assets/ACPI-V3.5-Logo-updated.pdf`),
 * recortado y con fondo transparente. Mide 120 px de alto, tres veces lo que
 * ocupa en la cabecera; `width`/`height` fijan la proporción para que el
 * navegador reserve el hueco antes de que la imagen cargue.
 */
export const BRAND_LOGO = Object.freeze({
  src: logo,
  width: 230,
  height: 120,
  alt: 'ACPI',
})

/** Vista principal del brazalete, la del boceto de la portada. */
export const BRACELET_SHOWCASE = Object.freeze({
  src: bracelet1,
  alt: 'Brazalete ACPI visto desde arriba: carcasa impresa en gris claro con el borde superior rojo y correa negra de tela.',
})

/**
 * Secuencia de vistas para girar el brazalete.
 * El orden es el del giro: cada fotograma continúa el ángulo del anterior.
 */
export const BRACELET_FRAMES = Object.freeze([
  { src: bracelet1, alt: 'Brazalete ACPI visto desde arriba, con la tapa gris al frente.' },
  { src: bracelet2, alt: 'Brazalete ACPI girado, con la carcasa de perfil y la correa a la derecha.' },
  { src: bracelet3, alt: 'Brazalete ACPI de tres cuartos, mostrando el canto de la carcasa.' },
  { src: bracelet4, alt: 'Brazalete ACPI de frente, con el marco rojo y la correa colgando.' },
  { src: bracelet5, alt: 'Brazalete ACPI desde el lado opuesto, con la correa extendida.' },
  { src: bracelet6, alt: 'Brazalete ACPI completando el giro, de vuelta hacia la vista superior.' },
])

export const SENSOR_IMAGES = Object.freeze({
  esp32c3: {
    src: esp32c3,
    alt: 'Placa ESP32-C3: microcontrolador con antena de radio integrada.',
  },
  mpu9250: {
    src: mpu9250,
    alt: 'Módulo MPU-9250: unidad de medición inercial de nueve ejes.',
  },
})

/**
 * Ilustraciones propias del sitio, dibujadas con la paleta de los tokens de
 * diseño. El semáforo usa los colores del logo. `ratio` es la proporción del
 * marco que mejor encaja con cada dibujo.
 */
export const ILLUSTRATIONS = Object.freeze({
  telemetryCity: {
    src: telemetryCity,
    ratio: 'aspect-[19/15]',
    alt: 'Mapa ilustrado de varias manzanas vistas desde arriba: zonas sombreadas en verde sobre las esquinas con más cruces, pines ámbar en los semáforos reportados y una tarjeta con barras de cifras.',
  },
  appPhone: {
    src: appPhone,
    ratio: 'aspect-[4/5]',
    alt: 'Pantalla ilustrada de la app ACPIGPS conectada al brazalete: un mapa con el cruce marcado, la indicación «Gira a la derecha» y una cuenta regresiva de 12 segundos para cruzar.',
  },
  storyCrossing: {
    src: storyCrossing,
    ratio: 'aspect-[4/3]',
    alt: 'Cruce peatonal ilustrado desde arriba: la baliza del semáforo emite su señal hacia una persona con el brazalete en la muñeca, que sigue el rumbo del paso de cebra mientras un vehículo espera.',
  },
})
