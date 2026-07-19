import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/types/auth'

const AUTH_PATH = '/api/v1/auth'

export const authApi = {
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>(
      `${AUTH_PATH}/register`,
      request,
    )
    return response.data.data
  },

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(`${AUTH_PATH}/login`, request)
    return response.data.data
  },

  async refresh(): Promise<RefreshResponse> {
    const response = await apiClient.post<ApiResponse<RefreshResponse>>(
      `${AUTH_PATH}/refresh`,
      null,
    )
    return response.data.data
  },

  async logout(): Promise<void> {
    await apiClient.post(`${AUTH_PATH}/logout`, null)
  },

  async me(): Promise<AuthUser> {
    const response = await apiClient.get<ApiResponse<AuthUser>>(`${AUTH_PATH}/me`)
    return response.data.data
  },
}
