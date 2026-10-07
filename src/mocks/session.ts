const SESSION_TTL_MS = 30_000

let expiresAt: number | null = null
let isRefreshable = false

export function startSession(): void {
  expiresAt = Date.now() + SESSION_TTL_MS
  isRefreshable = true
}

export function isSessionActive(): boolean {
  if (expiresAt === null) {
    return false
  }

  if (Date.now() >= expiresAt) {
    expiresAt = null
    return false
  }

  return true
}

export function canRotateSession(): boolean {
  return isRefreshable
}

export function resetSession(): void {
  expiresAt = null
  isRefreshable = false
}
