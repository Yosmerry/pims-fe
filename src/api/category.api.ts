import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category'
import type { PageResponse } from '@/types/pagination'

const CATEGORY_PATH = '/api/v1/categories'

export const categoryApi = {
  async findAll(page: number, size: number): Promise<PageResponse<Category>> {
    const response = await apiClient.get<ApiResponse<PageResponse<Category>>>(CATEGORY_PATH, {
      params: { page, size },
    })
    return response.data.data
  },

  async create(request: CreateCategoryRequest): Promise<Category> {
    const response = await apiClient.post<ApiResponse<Category>>(CATEGORY_PATH, request)
    return response.data.data
  },

  async update(code: string, request: UpdateCategoryRequest): Promise<Category> {
    const response = await apiClient.put<ApiResponse<Category>>(`${CATEGORY_PATH}/${code}`, request)
    return response.data.data
  },

  async delete(code: string): Promise<void> {
    await apiClient.delete(`${CATEGORY_PATH}/${code}`)
  },
}
