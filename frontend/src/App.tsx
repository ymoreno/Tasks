import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, Container } from '@mui/material'

// Importar componentes principales
import Header from './components/common/Header'
import Navigation from './components/common/Navigation'
import LoadingSpinner from './components/common/LoadingSpinner'
import NetworkInfo from './components/common/NetworkInfo'
import OfflineStatus from './components/common/OfflineStatus'

// Importar páginas (lazy loading para mejor performance)
const WeeklyPage = React.lazy(() => import('./pages/WeeklyPage'))
const PaymentsPage = React.lazy(() => import('./pages/PaymentsPage'))
const StatsPage = React.lazy(() => import('./pages/StatsPage'))

// Importar contextos
import { WeeklyProvider } from './contexts/WeeklyContext'
import { PaymentProvider } from './contexts/PaymentContext'

function App() {
  return (
    <WeeklyProvider>
      <PaymentProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Header principal */}
          <Header />
          
          {/* Navegación */}
          <Navigation />
          
          {/* Contenido principal */}
          <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
            <React.Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<WeeklyPage />} />
                <Route path="/weekly" element={<WeeklyPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="*" element={
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <h2>Página no encontrada</h2>
                    <p>La página que buscas no existe.</p>
                  </Box>
                } />
              </Routes>
            </React.Suspense>
          </Container>
          
          {/* Información de red */}
          <NetworkInfo />
          
          {/* Estado offline */}
          <OfflineStatus />
        </Box>
      </PaymentProvider>
    </WeeklyProvider>
  )
}

export default App