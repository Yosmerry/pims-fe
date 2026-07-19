export function formatDate(value: string | number | null | undefined): string {
  if (!value) return '—'

  const date = typeof value === 'number' ? new Date(value) : new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value: number | null | undefined): string {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return value.charAt(0) + value.slice(1).toLowerCase()
}
