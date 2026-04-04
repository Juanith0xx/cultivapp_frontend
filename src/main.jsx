import "mapbox-gl/dist/mapbox-gl.css"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

// 1. Importamos las herramientas de TanStack Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 2. Creamos una instancia del cliente
// Esto gestionará el caché de tus fotos y datos de empresas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Evita que recargue fotos cada vez que cambias de pestaña
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 3. Envolvemos con el Provider de Query */}
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)