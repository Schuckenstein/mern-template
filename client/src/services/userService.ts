// client/src/services/userService.ts

import { User, UserProfile, ApiResponse } from '@shared/types'
import { apiCall } from './api'

class UserService {
  async getProfile(): Promise<ApiResponse<{ user: User; profile: UserProfile }>> {
    return apiCall({
      method: 'GET',
      url: '/users/profile'
    })
  }

  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<{ user: User; profile: UserProfile }>> {
    return apiCall({
      method: 'PUT',
      url: '/users/profile',
      data
    })
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData()
    formData.append('avatar', file)

    return apiCall({
      method: 'POST',
      url: '/users/avatar',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return apiCall({
      method: 'POST',
      url: '/users/change-password',
      data: { currentPassword, newPassword }
    })
  }

  async deleteAccount(): Promise<ApiResponse> {
    return apiCall({
      method: 'DELETE',
      url: '/users/account'
    })
  }

  async getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<{ users: User[]; meta: any }>> {
    return apiCall({
      method: 'GET',
      url: '/users',
      params
    })
  }
}

export const userService = new UserService()

// =============================================