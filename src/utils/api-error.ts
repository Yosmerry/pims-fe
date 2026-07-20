import axios from 'axios'

import type { ApiErrorResponse } from '@/types/api'

const ERROR_MESSAGES: Record<string, string> = {
  Blank: 'This field is required.',
  InvalidFormat: 'Enter a valid value.',
  CharacterMoreThan150: 'Use no more than 150 characters.',
  CharacterMoreThan255: 'Use no more than 255 characters.',
  CharacterMoreThan20: 'Use no more than 20 characters.',
  CharacterMoreThan100: 'Use no more than 100 characters.',
  CharacterMoreThan500: 'Use no more than 500 characters.',
  CharacterMoreThan1000: 'Use no more than 1,000 characters.',
  CharacterLessThan8: 'Use at least 8 characters.',
  CharacterMoreThan72: 'Use no more than 72 characters.',
  WeakPassword: 'Use uppercase, lowercase, number, and special characters.',
  PasswordMismatch: 'The passwords do not match.',
  Duplicate: 'This email is already registered.',
  InvalidCredentials: 'The email or password is incorrect.',
  UserInactive: 'Your account is inactive. Please contact support.',
  Missing: 'Your session is missing. Please sign in again.',
  Invalid: 'Enter a valid value.',
  Minimum0: 'The value cannot be negative.',
  Minimum1: 'The value must be at least 1.',
  Maximum100: 'The value cannot be more than 100.',
  Maximum50: 'The value cannot be more than 50.',
  FutureDate: 'The date cannot be in the future.',
  NotFound: 'The requested record was not found.',
  FileTooLarge: 'The image must be 5 MB or smaller.',
  Maximum5: 'Maximum of 5 images per inventory item.',
  UnsupportedFileType: 'Only JPEG and PNG images are supported.',
  StorageFailed: 'The image could not be stored. Please try again.',
}

export type FieldErrors = Record<string, string>

const translateError = (field: string, errorCode: string): string => {
  if (field === 'refreshToken' && errorCode === 'Invalid') {
    return 'Your session has expired. Please sign in again.'
  }

  return ERROR_MESSAGES[errorCode] ?? errorCode
}

export function getFieldErrors(error: unknown): FieldErrors {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {}
  }

  const errors = error.response?.data.errors
  if (!errors) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, codes]) => {
      const firstCode = codes[0]
      return firstCode ? [[field, translateError(field, firstCode)]] : []
    }),
  )
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return 'Something went wrong. Please try again.'
  }

  if (!error.response) {
    return 'Unable to connect to the server. Please try again.'
  }

  const fieldErrors = getFieldErrors(error)
  const authenticationError = fieldErrors.authentication
  if (authenticationError) {
    return authenticationError
  }

  const firstError = Object.values(fieldErrors)[0]
  return firstError ?? 'The request could not be completed. Please try again.'
}
