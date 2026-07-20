import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/types/api'
import type { InventoryImage } from '@/types/image'

const INVENTORY_PATH = '/api/v1/inventory-items'
const IMAGE_PATH = '/api/v1/images'

export const imageApi = {
  async findAll(inventoryItemCode: string): Promise<InventoryImage[]> {
    const response = await apiClient.get<ApiResponse<InventoryImage[]>>(
      `${INVENTORY_PATH}/${inventoryItemCode}/images`,
    )
    return response.data.data
  },

  async findContent(imageCode: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`${IMAGE_PATH}/${imageCode}`, {
      responseType: 'blob',
    })
    return response.data
  },

  async upload(inventoryItemCode: string, file: File): Promise<InventoryImage> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<ApiResponse<InventoryImage>>(
      `${INVENTORY_PATH}/${inventoryItemCode}/images`,
      formData,
    )
    return response.data.data
  },

  async delete(imageCode: string): Promise<void> {
    await apiClient.delete(`${IMAGE_PATH}/${imageCode}`)
  },
}
