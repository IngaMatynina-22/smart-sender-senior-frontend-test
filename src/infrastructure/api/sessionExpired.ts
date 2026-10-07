type SessionExpiredHandler = () => void

let sessionExpiredHandler: SessionExpiredHandler | null = null
let sessionExpiredNotified = false

export function registerSessionExpiredHandler(
  handler: SessionExpiredHandler | null,
): void {
  sessionExpiredHandler = handler
}

export function clearSessionExpiredNotification(): void {
  sessionExpiredNotified = false
}

export function notifySessionExpired(): void {
  if (sessionExpiredNotified) {
    return
  }

  sessionExpiredNotified = true
  sessionExpiredHandler?.()
}
