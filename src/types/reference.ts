export interface ReferenceItem {
  code: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
  createdDate: number
  updatedDate: number
}
