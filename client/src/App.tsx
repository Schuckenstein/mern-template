// client/src/App.tsx

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { Helmet } from 'react-helmet-async'

import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicRoute } from '@/components/PublicRoute'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'

// Lazy load pages
const HomePage = React.lazy(() => import('@/pages/Home'))
const LoginPage = React.lazy(() => import('@/pages/auth/Login'))
const RegisterPage = React.lazy(() => import('@/pages/auth/Register'))
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPasswordPage = React.lazy(() => import('@/pages/auth/ResetPassword'))
const VerifyEmailPage = React.lazy(() => import('@/pages/auth/VerifyEmail'))
const OAuthCallbackPage = React.lazy(() => import('@/pages/auth/OAuthCallback'))
const DashboardPage = React.lazy(() => import('@/pages/Dashboard'))
const ProfilePage = React.lazy(() => import('@/pages/Profile'))
const SettingsPage = React.lazy(() => import('@/pages/Settings'))
const FilesPage = React.lazy(() => import('@/pages/Files'))
const NotFoundPage = React.lazy(() => import('@/pages/NotFound'))

function App() {
  const { isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <>
      <Helmet>
        <title>MERN Template</title>
        <meta name="description" content="A comprehensive MERN stack template with authentication" />
      </Helmet>

      <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
        <React.Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              
              {/* Auth Routes - Redirect if already authenticated */}
              <Route path="auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
              <Route path="auth/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
              <Route path="auth/verify-email" element={<VerifyEmailPage />} />
              <Route path="auth/callback" element={<OAuthCallbackPage />} />

              {/* Protected Routes */}
              <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="files" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />

              {/* Fallback Routes */}
              <Route path="404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </React.Suspense>
      </Box>
    </>
  )
}

export default App

// =============================================