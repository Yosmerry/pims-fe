export type CategoryStatus = 'ACTIVE' | 'INACTIVE'

export interface Category {
  code: string
  name: string
  description: string | null
  status: CategoryStatus
  createdDate: number
  updatedDate: number
}

export interface CreateCategoryRequest {
  name: string
  description: string | null
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {
  status: CategoryStatus
}
