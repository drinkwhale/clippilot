/**
 * API client wrapper for ClipPilot frontend
 * Provides typed HTTP methods and error handling
 */

import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Error response interface
interface APIError {
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

// API client class
export class APIClient {
  private client: AxiosInstance

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<APIError>) => {
        // Handle API errors
        if (error.response?.data?.error) {
          const apiError = error.response.data.error
          return Promise.reject(new Error(apiError.message))
        }

        // Handle network errors
        if (error.code === 'ECONNABORTED') {
          return Promise.reject(new Error('요청 시간이 초과되었습니다'))
        }

        if (!error.response) {
          return Promise.reject(new Error('네트워크 연결을 확인해주세요'))
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null

    // Get token from localStorage or cookie
    return localStorage.getItem('access_token')
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    if (typeof window === 'undefined') return

    localStorage.setItem('access_token', token)
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    if (typeof window === 'undefined') return

    localStorage.removeItem('access_token')
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config)
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config)
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config)
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config)
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      },
    })
  }
}

// Global API client instance
export const apiClient = new APIClient()

// Export type-safe API methods
export const api = {
  // Health check
  health: () => apiClient.get('/health'),

  // Auth endpoints (will be implemented in Phase 3)
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/api/v1/auth/login', { email, password }),
    logout: () => apiClient.post('/api/v1/auth/logout'),
    me: () => apiClient.get('/api/v1/auth/me'),
  },

  // Jobs endpoints (will be implemented in Phase 5)
  jobs: {
    list: (params?: { page?: number; page_size?: number; status?: string }) =>
      apiClient.get('/api/v1/jobs', { params }),
    get: (id: string) => apiClient.get(`/api/v1/jobs/${id}`),
    create: (data: {
      prompt: string
      video_length_sec: number
      tone: string
      channel_id?: string
      template_id?: string
    }) => apiClient.post('/api/v1/jobs', data),
    delete: (id: string) => apiClient.delete(`/api/v1/jobs/${id}`),
  },

  // Templates endpoints (will be implemented in Phase 4)
  templates: {
    list: () => apiClient.get('/api/v1/templates'),
    get: (id: string) => apiClient.get(`/api/v1/templates/${id}`),
    create: (data: { name: string; brand_config_json: object }) =>
      apiClient.post('/api/v1/templates', data),
    update: (id: string, data: { name?: string; brand_config_json?: object }) =>
      apiClient.patch(`/api/v1/templates/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/v1/templates/${id}`),
  },

  // Channels endpoints (will be implemented in Phase 4)
  channels: {
    list: () => apiClient.get('/api/v1/channels'),
    get: (id: string) => apiClient.get(`/api/v1/channels/${id}`),
    connect: (code: string) => apiClient.post('/api/v1/channels/oauth/callback', { code }),
    disconnect: (id: string) => apiClient.delete(`/api/v1/channels/${id}`),
  },

  // Billing endpoints (will be implemented later)
  billing: {
    subscription: () => apiClient.get('/api/v1/billing/subscription'),
    usage: () => apiClient.get('/api/v1/billing/usage'),
    createCheckout: (plan: string) =>
      apiClient.post('/api/v1/billing/checkout', { plan }),
  },

  // Dashboard endpoints
  dashboard: {
    stats: () => apiClient.get('/api/v1/dashboard/stats'),
  },
}
