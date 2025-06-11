// client/src/stores/fileStore.ts

import { create } from 'zustand'
import { FileUpload, UploadProgress } from '@shared/types'
import { fileService } from '@/services/fileService'
import { logger } from '@/utils/logger'

interface FileState {
  files: FileUpload[]
  uploads: UploadProgress[]
  isLoading: boolean
  
  // Actions
  uploadFiles: (files: FileList) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>
  getFiles: () => Promise<void>
  updateUploadProgress: (progress: UploadProgress) => void
  removeUpload: (fileId: string) => void
  setLoading: (loading: boolean) => void
}

export const useFileStore = create<FileState>()((set, get) => ({
  files: [],
  uploads: [],
  isLoading: false,

  uploadFiles: async (fileList: FileList) => {
    try {
      const files = Array.from(fileList)
      
      // Initialize upload progress for each file
      files.forEach((file) => {
        const uploadProgress: UploadProgress = {
          fileId: Math.random().toString(36).substr(2, 9),
          fileName: file.name,
          loaded: 0,
          total: file.size,
          percentage: 0,
          status: 'pending'
        }
        
        set((state) => ({
          uploads: [...state.uploads, uploadProgress]
        }))
      })

      // Upload files
      const uploadPromises = files.map(async (file, index) => {
        const { uploads } = get()
        const uploadProgress = uploads[uploads.length - files.length + index]
        
        try {
          set((state) => ({
            uploads: state.uploads.map((up) =>
              up.fileId === uploadProgress.fileId
                ? { ...up, status: 'uploading' }
                : up
            )
          }))

          const response = await fileService.uploadFile(file, (progress) => {
            get().updateUploadProgress({
              ...uploadProgress,
              loaded: progress.loaded,
              percentage: Math.round((progress.loaded / progress.total) * 100),
              status: 'uploading'
            })
          })

          const uploadedFile = response.data.file
          
          set((state) => ({
            files: [...state.files, uploadedFile],
            uploads: state.uploads.map((up) =>
              up.fileId === uploadProgress.fileId
                ? { ...up, status: 'completed', percentage: 100 }
                : up
            )
          }))

          // Remove upload progress after delay
          setTimeout(() => {
            get().removeUpload(uploadProgress.fileId)
          }, 2000)

        } catch (error) {
          logger.error('File upload failed', error)
          
          set((state) => ({
            uploads: state.uploads.map((up) =>
              up.fileId === uploadProgress.fileId
                ? { ...up, status: 'error', error: 'Upload failed' }
                : up
            )
          }))
        }
      })

      await Promise.all(uploadPromises)
    } catch (error) {
      logger.error('Bulk file upload failed', error)
      throw error
    }
  },

  deleteFile: async (fileId: string) => {
    try {
      await fileService.deleteFile(fileId)
      
      set((state) => ({
        files: state.files.filter((file) => file.id !== fileId)
      }))
      
      logger.info('File deleted successfully', { fileId })
    } catch (error) {
      logger.error('File deletion failed', error)
      throw error
    }
  },

  getFiles: async () => {
    try {
      set({ isLoading: true })
      
      const response = await fileService.getFiles()
      const files = response.data.files || []
      
      set({ files, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      logger.error('Failed to fetch files', error)
      throw error
    }
  },

  updateUploadProgress: (progress: UploadProgress) => {
    set((state) => ({
      uploads: state.uploads.map((up) =>
        up.fileId === progress.fileId ? progress : up
      )
    }))
  },

  removeUpload: (fileId: string) => {
    set((state) => ({
      uploads: state.uploads.filter((up) => up.fileId !== fileId)
    }))
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  }
}))

// =============================================