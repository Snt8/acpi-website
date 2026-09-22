import { UPCOMING_PAGES } from '../core/content/upcoming.content.js'
import { PATHS } from '../core/routing/paths.js'
import { SiteLayout } from '../layout/SiteLayout.jsx'
import BraceletPage from '../pages/bracelet/BraceletPage.jsx'
import HomePage from '../pages/home/HomePage.jsx'
import NotFoundPage from '../pages/not-found/NotFoundPage.jsx'
import UpcomingPage from '../pages/upcoming/UpcomingPage.jsx'

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
        path: PATHS.telemetry,
        element: <UpcomingPage {...UPCOMING_PAGES.telemetry} />,
        handle: { title: UPCOMING_PAGES.telemetry.title },
      },
      {
        path: PATHS.mobileApp,
        element: <UpcomingPage {...UPCOMING_PAGES.mobileApp} />,
        handle: { title: UPCOMING_PAGES.mobileApp.title },
      },
      {
        path: PATHS.story,
        element: <UpcomingPage {...UPCOMING_PAGES.story} />,
        handle: { title: UPCOMING_PAGES.story.title },
      },
      {
        path: '*',
        element: <NotFoundPage />,
        handle: { title: 'Página no encontrada' },
      },
    ],
  },
]
