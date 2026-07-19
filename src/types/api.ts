export interface ApiMetadata {
  requestId: string
}

export interface ApiResponse<T> {
  code: number
  status: string
  data: T
  metadata: ApiMetadata
}

export interface ApiErrorResponse {
  code: number
  status: string
  errors?: Record<string, string[]>
  metadata?: ApiMetadata
}
