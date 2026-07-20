export type LocationStatus = 'ACTIVE' | 'INACTIVE'

export interface Location {
  code: string
  name: string
  description: string | null
  status: LocationStatus
  createdDate: number
  updatedDate: number
}

export interface CreateLocationRequest {
  name: string
  description: string | null
}

export interface UpdateLocationRequest extends CreateLocationRequest {
  status: LocationStatus
}
