import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routes } from './routes.jsx'

// En desarrollo BASE_URL es "/" y en producción "/acpi-website/". Quitar la
// barra final deja el prefijo que espera React Router en ambos casos.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

const router = createBrowserRouter(routes, { basename })

/** Raíz de composición: conecta la tabla de rutas con el árbol de React. */
export default function App() {
  return <RouterProvider router={router} />
}
