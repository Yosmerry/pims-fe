import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type { PageResponse } from '@/types/pagination'
import type { ReferenceItem } from '@/types/reference'

const findAll = async (path: string): Promise<ReferenceItem[]> => {
  const response = await apiClient.get<ApiResponse<PageResponse<ReferenceItem>>>(path, {
    params: { page: 0, size: 100 },
  })
  return response.data.data.content.filter((item) => item.status === 'ACTIVE')
}

export const referenceApi = {
  findCategories: () => findAll('/api/v1/categories'),
  findLocations: () => findAll('/api/v1/locations'),
}
