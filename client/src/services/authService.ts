// client/src/services/authService.ts
import { LoginCredentials, RegisterCredentials, AuthResponse, ApiResponse } from '@shared/types'
import { apiCall } from './api'

class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return apiCall({
      method: 'POST',
      url: '/auth/login',
      data: credentials
    })
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> {
    return apiCall({
      method: 'POST',
      url: '/auth/register',
      data: credentials
    })
  }

  async logout(refreshToken: string): Promise<ApiResponse> {
    return apiCall({
      method: 'POST',
      url: '/auth/logout',
      data: { refreshToken }
    })
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return apiCall({
      method: 'POST',
      url: '/auth/refresh',
      data: { refreshToken }
    })
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: any }>> {
    return apiCall({
      method: 'GET',
      url: '/auth/me'
    })
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    return apiCall({
      method: 'POST',
      url: '/auth/verify-email',
      data: { token }
    })
  }

  async resendVerification(email: string): Promise<ApiResponse> {
    return apiCall({
      method: 'POST',
      url: '/auth/resend-verification',
      data: { email }
    })
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return apiCall({
      method: 'POST',
      url: '/auth/forgot-password',
      data: { email }
    })
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return apiCall({
      method: 'POST',
      url: '/auth/reset-password',
      data: { token, password }
    })
  }

  // OAuth helpers
  getGoogleAuthUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    return `${baseUrl}/auth/google`
  }

  getGitHubAuthUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    return `${baseUrl}/auth/github`
  }
}

export const authService = new AuthService()

// =============================================