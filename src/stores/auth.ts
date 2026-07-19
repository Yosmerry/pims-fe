import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { authApi } from '@/api/auth.api'
import type { AuthUser, LoginRequest, RegisterRequest } from '@/types/auth'
import {
  clearAuthSession,
  getAccessToken,
  getAuthUser,
  setAccessToken,
  setAuthUser,
} from '@/utils/auth-session'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(getAccessToken())
  const user = ref<AuthUser | null>(getAuthUser())
  const isAuthenticated = computed(() => Boolean(accessToken.value))

  const saveSession = (token: string, authenticatedUser: AuthUser): void => {
    accessToken.value = token
    user.value = authenticatedUser
    setAccessToken(token)
    setAuthUser(authenticatedUser)
  }

  const login = async (request: LoginRequest): Promise<void> => {
    const result = await authApi.login(request)
    saveSession(result.accessToken, result.user)
  }

  const registerAndLogin = async (request: RegisterRequest): Promise<void> => {
    await authApi.register(request)
    await login({ email: request.email, password: request.password })
  }

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout()
    } finally {
      accessToken.value = null
      user.value = null
      clearAuthSession()
    }
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    login,
    registerAndLogin,
    logout,
  }
})
