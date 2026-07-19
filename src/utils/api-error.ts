import axios from 'axios'

import type { ApiErrorResponse } from '@/types/api'

const ERROR_MESSAGES: Record<string, string> = {
  Blank: 'This field is required.',
  InvalidFormat: 'Enter a valid value.',
  CharacterMoreThan150: 'Use no more than 150 characters.',
  CharacterMoreThan255: 'Use no more than 255 characters.',
  CharacterLessThan8: 'Use at least 8 characters.',
  CharacterMoreThan72: 'Use no more than 72 characters.',
  WeakPassword: 'Use uppercase, lowercase, number, and special characters.',
  PasswordMismatch: 'The passwords do not match.',
  Duplicate: 'This email is already registered.',
  InvalidCredentials: 'The email or password is incorrect.',
  UserInactive: 'Your account is inactive. Please contact support.',
  Missing: 'Your session is missing. Please sign in again.',
  Invalid: 'Your session has expired. Please sign in again.',
}

export type FieldErrors = Record<string, string>

const translateError = (errorCode: string): string => ERROR_MESSAGES[errorCode] ?? errorCode

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
      return firstCode ? [[field, translateError(firstCode)]] : []
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
