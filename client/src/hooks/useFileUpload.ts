// client/src/hooks/useFileUpload.ts

import { useState, useCallback } from 'react'
import { useFileStore } from '@/stores/fileStore'
import { useUiStore } from '@/stores/uiStore'

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false)
  const { uploadFiles } = useFileStore()
  const { addNotification } = useUiStore()

  const upload = useCallback(async (files: FileList | File[]) => {
    try {
      setUploading(true)
      
      const fileList = files instanceof FileList ? files : new FileList()
      if (Array.isArray(files)) {
        // Convert File array to FileList
        const dt = new DataTransfer()
        files.forEach(file => dt.items.add(file))
        await uploadFiles(dt.files)
      } else {
        await uploadFiles(files)
      }
      
      addNotification({
        type: 'success',
        title: 'Upload Complete',
        message: `Successfully uploaded ${files.length} file(s)`
      })
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload files'
      })
      throw error
    } finally {
      setUploading(false)
    }
  }, [uploadFiles, addNotification])

  return {
    upload,
    uploading
  }
}

// =============================================