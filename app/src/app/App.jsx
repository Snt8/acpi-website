import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routes } from './routes.jsx'

const router = createBrowserRouter(routes)

/** Raíz de composición: conecta la tabla de rutas con el árbol de React. */
export default function App() {
  return <RouterProvider router={router} />
}
