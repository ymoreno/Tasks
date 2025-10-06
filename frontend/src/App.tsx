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
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'))
const UnfinishedCoursesPage = React.lazy(() => import('./pages/UnfinishedCoursesPage'))
const FinancesPage = React.lazy(() => import('./pages/FinancesPage'))

// Importar contextos
import { WeeklyProvider } from './contexts/WeeklyContext'
import { PaymentProvider } from './contexts/PaymentContext'
import { FinanceProvider } from './contexts/FinanceContext'

function App() {
  return (
    <WeeklyProvider>
      <PaymentProvider>
        <FinanceProvider>
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
                <Route path="/finances" element={<FinancesPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/unfinished-courses" element={<UnfinishedCoursesPage />} />
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
        </FinanceProvider>
      </PaymentProvider>
    </WeeklyProvider>
  )
}

export default App