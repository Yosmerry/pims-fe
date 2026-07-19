export interface AuthUser {
  code: string
  name: string
  email: string
  status: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface RegisterResponse extends AuthUser {
  createdDate: number
  updatedDate: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

export interface RefreshResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}
