const FINGERPRINT_STORAGE_KEY = 'device-fingerprint'

const FINGERPRINT_PATTERN = /^[0-9a-f]{32}$/

export function isValidFingerprint(value: string): boolean {
  return FINGERPRINT_PATTERN.test(value)
}

export function getFingerprint(): string {
  const storedFingerprint = localStorage.getItem(FINGERPRINT_STORAGE_KEY)

  if (storedFingerprint !== null && isValidFingerprint(storedFingerprint)) {
    return storedFingerprint
  }

  const fingerprint = crypto.randomUUID().replaceAll('-', '')
  localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint)
  return fingerprint
}
