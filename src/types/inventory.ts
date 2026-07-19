export const INVENTORY_CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'] as const
export const INVENTORY_STATUSES = ['OWNED', 'LOANED', 'SOLD', 'LOST', 'DISPOSED'] as const
export const INVENTORY_SORTS = [
  'updatedDate:desc',
  'updatedDate:asc',
  'name:asc',
  'name:desc',
  'purchaseDate:desc',
  'purchaseDate:asc',
] as const

export type InventoryCondition = (typeof INVENTORY_CONDITIONS)[number]
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number]
export type InventorySort = (typeof INVENTORY_SORTS)[number]

export interface InventoryItem {
  code: string
  categoryCode: string
  locationCode: string | null
  name: string
  description: string | null
  quantity: number
  purchasePrice: number | null
  purchaseDate: string | null
  condition: InventoryCondition
  status: InventoryStatus
  notes: string | null
  createdDate: number
  updatedDate: number
}

export interface CreateInventoryItemRequest {
  categoryCode: string
  locationCode: string | null
  name: string
  description: string | null
  quantity: number
  purchasePrice: number | null
  purchaseDate: string | null
  condition: InventoryCondition
  notes: string | null
}

export interface UpdateInventoryItemRequest extends CreateInventoryItemRequest {
  status: InventoryStatus
}

export interface InventoryItemFilter {
  page: number
  size: number
  search?: string
  categoryCode?: string
  locationCode?: string
  condition?: InventoryCondition
  status?: InventoryStatus
  sortBy?: InventorySort
}

export interface InventoryImage {
  code: string
  inventoryItemCode: string
  originalFilename: string
  contentType: string
  fileSize: number
  primary: boolean
  url: string
  createdDate: number
}
