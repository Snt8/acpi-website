import bracelet1 from '../../assets/acpi-pulsera1.png'
import bracelet2 from '../../assets/acpi-pulsera2.png'
import bracelet3 from '../../assets/acpi-pulsera3.png'
import bracelet4 from '../../assets/acpi-pulsera4.png'
import bracelet5 from '../../assets/acpi-pulsera5.png'
import bracelet6 from '../../assets/acpi-pulsera6.png'
import esp32c3 from '../../assets/esp32c3-picture.png'
import mpu9250 from '../../assets/mpu9250-picture.png'

/**
 * Catálogo de imágenes del sitio.
 * Centralizar aquí los `import` deja a las páginas sin rutas de archivo y
 * permite que Vite siga resolviendo y versionando cada asset en la compilación.
 */

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
