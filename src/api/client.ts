import axios, { type InternalAxiosRequestConfig } from 'axios'

import type { ApiResponse } from '@/types/api'
import type { RefreshResponse } from '@/types/auth'
import { clearAuthSession, getAccessToken, setAccessToken } from '@/utils/auth-session'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const createRequestId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const addCommonHeaders = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  config.headers.set('X-CHANNEL-ID', 'WEB')
  config.headers.set('X-SERVICE-ID', 'pims-fe')
  config.headers.set('X-REQUEST-ID', createRequestId())
  return config
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  addCommonHeaders(config)

  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return config
})

refreshClient.interceptors.request.use(addCommonHeaders)

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const isPublicAuthRequest = (url?: string): boolean =>
  ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh'].some((path) =>
    url?.includes(path),
  )

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error)
    }

    const request = error.config as RetryableRequestConfig | undefined
    const shouldRefresh =
      error.response?.status === 401 &&
      request &&
      !request._retry &&
      !isPublicAuthRequest(request.url)

    if (!shouldRefresh) {
      return Promise.reject(error)
    }

    request._retry = true

    try {
      const response = await refreshClient.post<ApiResponse<RefreshResponse>>(
        '/api/v1/auth/refresh',
        null,
      )
      setAccessToken(response.data.data.accessToken)
      request.headers.set('Authorization', `Bearer ${response.data.data.accessToken}`)
      return apiClient(request)
    } catch (refreshError) {
      clearAuthSession()

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }

      return Promise.reject(refreshError)
    }
  },
)
