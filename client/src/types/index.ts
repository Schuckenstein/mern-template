// client/src/types/index.ts
/**
 * Client-specific types that extend or complement shared types
 */

import { User, UserProfile, FileUpload } from '@shared/types'

// =============================================
// UI State Types
// =============================================

export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
}

export interface NotificationState {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  isVisible: boolean
  timestamp: number
}

export interface ModalState {
  isOpen: boolean
  title?: string
  content?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  onClose?: () => void
}

// =============================================
// Form Types
// =============================================

export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export interface ProfileFormData {
  firstName: string
  lastName: string
  username?: string
  bio?: string
  phoneNumber?: string
  dateOfBirth?: string
  website?: string
  twitter?: string
  linkedin?: string
  github?: string
}

export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

// =============================================
// API Response Types
// =============================================

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface SearchResponse<T> {
  results: T[]
  query: string
  totalResults: number
  searchTime: number
}

// =============================================
// Component Props Types
// =============================================

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  'data-testid'?: string
}

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string | number
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  sorting?: {
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    onSort: (column: string) => void
  }
  onRowClick?: (row: T) => void
}

export interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  onUpload: (files: FileList) => void
  onProgress?: (progress: number) => void
  disabled?: boolean
  children?: React.ReactNode
}

// =============================================
// Route Types
// =============================================

export interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  redirectTo?: string
}

export interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export interface BreadcrumbItem {
  label: string
  href?: string
  isCurrentPage?: boolean
}

// =============================================
// Theme Types
// =============================================

export interface ThemeConfig {
  initialColorMode: 'light' | 'dark' | 'system'
  useSystemColorMode: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  fonts: {
    heading: string
    body: string
    mono: string
  }
}

export interface ColorModeContextType {
  colorMode: 'light' | 'dark'
  toggleColorMode: () => void
  setColorMode: (mode: 'light' | 'dark') => void
}

// =============================================
// Hook Return Types
// =============================================

export interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginFormData) => Promise<void>
  register: (credentials: RegisterFormData) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
}

export interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (...args: any[]) => Promise<T>
  reset: () => void
}

export interface UseFileUploadReturn {
  upload: (files: FileList) => Promise<void>
  uploading: boolean
  progress: number
  uploadedFiles: FileUpload[]
  error: string | null
}

export interface UsePaginationReturn {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
}

// =============================================
// Store Types
// =============================================

export interface AuthStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginFormData) => Promise<void>
  register: (credentials: RegisterFormData) => Promise<void>
  logout: () => Promise<void>
  refreshTokens: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  clearAuth: () => void
}

export interface UIStore {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  notifications: NotificationState[]
  modal: ModalState
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp' | 'isVisible'>) => void
  removeNotification: (id: string) => void
  openModal: (modal: Partial<ModalState>) => void
  closeModal: () => void
}

export interface FileStore {
  files: FileUpload[]
  uploading: boolean
  uploadProgress: Record<string, number>
  uploadFile: (file: File) => Promise<void>
  uploadFiles: (files: FileList) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>
  getFiles: () => Promise<void>
}

// =============================================
// Utility Types
// =============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type NonNullable<T> = T extends null | undefined ? never : T

// =============================================
// Event Types
// =============================================

export interface CustomEvents {
  'auth:login': { user: User }
  'auth:logout': {}
  'file:uploaded': { file: FileUpload }
  'notification:show': { notification: NotificationState }
  'theme:changed': { theme: string }
}

// =============================================
// Environment Types
// =============================================

export interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_DEBUG_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_ENABLE_DEBUG: string
  readonly DEV: boolean
  readonly PROD: boolean
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

// =============================================