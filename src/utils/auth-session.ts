import type { AuthUser } from '@/types/auth'

const ACCESS_TOKEN_KEY = 'pims_access_token'
const AUTH_USER_KEY = 'pims_auth_user'

const hasSessionStorage = () => typeof window !== 'undefined' && Boolean(window.sessionStorage)

export function getAccessToken(): string | null {
  return hasSessionStorage() ? window.sessionStorage.getItem(ACCESS_TOKEN_KEY) : null
}

export function setAccessToken(accessToken: string): void {
  if (hasSessionStorage()) {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }
}

export function getAuthUser(): AuthUser | null {
  if (!hasSessionStorage()) {
    return null
  }

  const storedUser = window.sessionStorage.getItem(AUTH_USER_KEY)
  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    window.sessionStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

export function setAuthUser(user: AuthUser): void {
  if (hasSessionStorage()) {
    window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
}

export function clearAuthSession(): void {
  if (hasSessionStorage()) {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    window.sessionStorage.removeItem(AUTH_USER_KEY)
  }
}
