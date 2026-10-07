const DEFAULT_PATH = '/webhooks'

/**
 * Allows only same-app relative paths under /webhooks (open-redirect safe).
 */
export function getSafePostLoginPath(next: string | null | undefined): string {
  if (next === null || next === undefined || next.trim() === '') {
    return DEFAULT_PATH
  }

  let decoded = next

  try {
    decoded = decodeURIComponent(next)
  } catch {
    return DEFAULT_PATH
  }

  if (
    !decoded.startsWith('/webhooks') ||
    decoded.startsWith('//') ||
    decoded.includes('://') ||
    decoded.includes('\\')
  ) {
    return DEFAULT_PATH
  }

  return decoded
}
