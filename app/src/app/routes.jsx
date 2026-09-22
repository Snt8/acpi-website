import { PATHS } from '../core/routing/paths.js'
import { SiteLayout } from '../layout/SiteLayout.jsx'
import BraceletPage from '../pages/bracelet/BraceletPage.jsx'
import HomePage from '../pages/home/HomePage.jsx'
import NotFoundPage from '../pages/not-found/NotFoundPage.jsx'

/**
 * Tabla de rutas del sitio.
 * `handle.title` lo consume `usePageTitle` para mantener el título del
 * documento sincronizado con la página activa.
 */
export const routes = [
  {
    path: PATHS.home,
    element: <SiteLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
        handle: { title: 'Asistencia Inteligente para Cruces Seguros' },
      },
      {
        path: PATHS.bracelet,
        element: <BraceletPage />,
        handle: { title: 'Brazalete ACPI V3.0' },
      },
      {
        path: '*',
        element: <NotFoundPage />,
        handle: { title: 'Página no encontrada' },
      },
    ],
  },
]
