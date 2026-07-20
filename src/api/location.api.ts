import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type { CreateLocationRequest, Location, UpdateLocationRequest } from '@/types/location'
import type { PageResponse } from '@/types/pagination'

const LOCATION_PATH = '/api/v1/locations'

export const locationApi = {
  async findAll(page: number, size: number): Promise<PageResponse<Location>> {
    const response = await apiClient.get<ApiResponse<PageResponse<Location>>>(LOCATION_PATH, {
      params: { page, size },
    })
    return response.data.data
  },

  async findByCode(code: string): Promise<Location> {
    const response = await apiClient.get<ApiResponse<Location>>(`${LOCATION_PATH}/${code}`)
    return response.data.data
  },

  async create(request: CreateLocationRequest): Promise<Location> {
    const response = await apiClient.post<ApiResponse<Location>>(LOCATION_PATH, request)
    return response.data.data
  },

  async update(code: string, request: UpdateLocationRequest): Promise<Location> {
    const response = await apiClient.put<ApiResponse<Location>>(`${LOCATION_PATH}/${code}`, request)
    return response.data.data
  },

  async delete(code: string): Promise<void> {
    await apiClient.delete(`${LOCATION_PATH}/${code}`)
  },
}
