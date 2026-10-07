import { describe, expect, it } from 'vitest'
import { getSafePostLoginPath } from './safeRedirect.ts'

describe('getSafePostLoginPath', () => {
  it('returns default path for empty or unsafe values', () => {
    expect(getSafePostLoginPath(null)).toBe('/webhooks')
    expect(getSafePostLoginPath('')).toBe('/webhooks')
    expect(getSafePostLoginPath('https://evil.example')).toBe('/webhooks')
    expect(getSafePostLoginPath('//evil.example')).toBe('/webhooks')
    expect(getSafePostLoginPath('/login')).toBe('/webhooks')
  })

  it('allows webhooks paths with query string', () => {
    expect(getSafePostLoginPath('/webhooks?page=2&search=payment')).toBe(
      '/webhooks?page=2&search=payment',
    )
    expect(
      getSafePostLoginPath(encodeURIComponent('/webhooks?page=3')),
    ).toBe('/webhooks?page=3')
  })
})
