import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type { PageResponse } from '@/types/pagination'
import type { ReferenceItem } from '@/types/reference'

const findAll = async (path: string): Promise<ReferenceItem[]> => {
  const findPage = async (page: number): Promise<PageResponse<ReferenceItem>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<ReferenceItem>>>(path, {
      params: { page, size: 50 },
    })
    return response.data.data
  }

  const firstPage = await findPage(0)
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(firstPage.totalPages - 1, 0) }, (_, index) =>
      findPage(index + 1),
    ),
  )

  return [firstPage, ...remainingPages]
    .flatMap((page) => page.content)
    .filter((item) => item.status === 'ACTIVE')
}

export const referenceApi = {
  findCategories: () => findAll('/api/v1/categories'),
  findLocations: () => findAll('/api/v1/locations'),
}
