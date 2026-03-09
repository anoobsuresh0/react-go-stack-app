import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Layout } from '@/components/layout/Layout'
import { Counter } from '@/features/counter/Counter'
import { Provider } from 'react-redux' // {{REDUX_ONLY}}
import { store } from '@/app/store' // {{REDUX_ONLY}}
import { AuthProvider } from '@/features/auth/AuthProvider' // {{AUTH_ONLY}}
import { ProtectedRoute } from '@/features/auth/ProtectedRoute' // {{AUTH_ONLY}}
import { LoginPage } from '@/features/auth/LoginPage' // {{AUTH_ONLY}}
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage' // {{AUTH_ONLY}}

function AppRoutes() {
  return (
    <Routes>
      {/* {{AUTH_BLOCK_START}} */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Counter />} />
      </Route>
      {/* {{AUTH_BLOCK_END}} */}
      {/* {{NOAUTH_BLOCK_START}} */}
      <Route element={<Layout />}>
        <Route path="/" element={<Counter />} />
      </Route>
      {/* {{NOAUTH_BLOCK_END}} */}
    </Routes>
  )
}

function AppShell() {
  return (
    <>
      {/* {{AUTH_BLOCK_START}} */}
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
      {/* {{AUTH_BLOCK_END}} */}
      {/* {{NOAUTH_BLOCK_START}} */}
      <AppRoutes />
      <Toaster />
      {/* {{NOAUTH_BLOCK_END}} */}
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      {/* {{REDUX_BLOCK_START}} */}
      <Provider store={store}>
        <AppShell />
      </Provider>
      {/* {{REDUX_BLOCK_END}} */}
      {/* {{NOREDUX_BLOCK_START}} */}
      <AppShell />
      {/* {{NOREDUX_BLOCK_END}} */}
    </ErrorBoundary>
  )
}
