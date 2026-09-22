import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const GITHUB_PAGES_BASE = '/acpi-website/'

/**
 * GitHub Pages publica este repositorio bajo /acpi-website/, mientras que el
 * servidor de desarrollo trabaja en la raíz.
 *
 * `isPreview` es necesario además de `command`: en `vite preview` el comando
 * sigue siendo "serve", así que sin él la vista previa serviría desde / un
 * `dist` compilado para /acpi-website/ y no encontraría ni un solo recurso.
 *
 * El router lee esta misma ruta a través de `import.meta.env.BASE_URL`, de
 * modo que el prefijo está escrito en un único sitio.
 */
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? GITHUB_PAGES_BASE : '/',
  plugins: [react(), tailwindcss()],
}))
