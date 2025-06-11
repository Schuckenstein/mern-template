// client/src/services/fileService.ts

import { FileUpload, ApiResponse, UploadResponse } from '@shared/types'
import { apiCall, api } from './api'

interface UploadProgressCallback {
  (progress: { loaded: number; total: number }): void
}

class FileService {
  async uploadFile(file: File, onProgress?: UploadProgressCallback): Promise<ApiResponse<{ file: FileUpload }>> {
    const formData = new FormData()
    formData.append('file', file)

    return new Promise((resolve, reject) => {
      api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total
            })
          }
        }
      })
      .then(response => {
        resolve({
          data: response.data.data || response.data,
          status: response.status
        })
      })
      .catch(error => {
        reject({
          message: error.response?.data?.message || error.message,
          status: error.response?.status || 500,
          code: error.response?.data?.error?.code || 'UPLOAD_ERROR'
        })
      })
    })
  }

  async uploadMultipleFiles(files: File[], onProgress?: UploadProgressCallback): Promise<ApiResponse<{ files: FileUpload[] }>> {
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })

    return new Promise((resolve, reject) => {
      api.post('/files/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total
            })
          }
        }
      })
      .then(response => {
        resolve({
          data: response.data.data || response.data,
          status: response.status
        })
      })
      .catch(error => {
        reject({
          message: error.response?.data?.message || error.message,
          status: error.response?.status || 500,
          code: error.response?.data?.error?.code || 'UPLOAD_ERROR'
        })
      })
    })
  }

  async getFiles(params?: { page?: number; limit?: number; type?: string }): Promise<ApiResponse<{ files: FileUpload[]; meta: any }>> {
    return apiCall({
      method: 'GET',
      url: '/files',
      params
    })
  }

  async getFile(fileId: string): Promise<ApiResponse<{ file: FileUpload }>> {
    return apiCall({
      method: 'GET',
      url: `/files/${fileId}`
    })
  }

  async deleteFile(fileId: string): Promise<ApiResponse> {
    return apiCall({
      method: 'DELETE',
      url: `/files/${fileId}`
    })
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob'
    })
    return response.data
  }

  getFileUrl(fileId: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    return `${baseUrl}/files/${fileId}`
  }

  getFileThumbnail(fileId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    return `${baseUrl}/files/${fileId}/thumbnail?size=${size}`
  }
}

export const fileService = new FileService()

// =============================================