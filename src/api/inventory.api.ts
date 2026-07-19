import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type {
  CreateInventoryItemRequest,
  InventoryImage,
  InventoryItem,
  InventoryItemFilter,
  UpdateInventoryItemRequest,
} from '@/types/inventory'
import type { PageResponse } from '@/types/pagination'

const INVENTORY_PATH = '/api/v1/inventory-items'

export const inventoryApi = {
  async findAll(filter: InventoryItemFilter): Promise<PageResponse<InventoryItem>> {
    const response = await apiClient.get<ApiResponse<PageResponse<InventoryItem>>>(INVENTORY_PATH, {
      params: filter,
    })
    return response.data.data
  },

  async findByCode(code: string): Promise<InventoryItem> {
    const response = await apiClient.get<ApiResponse<InventoryItem>>(`${INVENTORY_PATH}/${code}`)
    return response.data.data
  },

  async create(request: CreateInventoryItemRequest): Promise<InventoryItem> {
    const response = await apiClient.post<ApiResponse<InventoryItem>>(INVENTORY_PATH, request)
    return response.data.data
  },

  async update(code: string, request: UpdateInventoryItemRequest): Promise<InventoryItem> {
    const response = await apiClient.put<ApiResponse<InventoryItem>>(
      `${INVENTORY_PATH}/${code}`,
      request,
    )
    return response.data.data
  },

  async delete(code: string): Promise<void> {
    await apiClient.delete(`${INVENTORY_PATH}/${code}`)
  },

  async uploadImage(inventoryItemCode: string, file: File): Promise<InventoryImage> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<ApiResponse<InventoryImage>>(
      `${INVENTORY_PATH}/${inventoryItemCode}/images`,
      formData,
    )
    return response.data.data
  },
}
