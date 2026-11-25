import { describe, expect, it } from 'vitest'
import { cardBrand, expiryValid, lookupRouting, luhnValid } from '@/lib/payment-lookup'

describe('payment lookup', () => {
  it('recognises a known routing number as its bank', () => {
    expect(lookupRouting('021000021')).toMatchObject({ status: 'verified', bank: 'JPMorgan Chase Bank' })
  })
  it('rejects a routing number that fails the checksum', () => {
    expect(lookupRouting('123456789').status).toBe('invalid')
  })
  it('waits until all 9 digits are entered', () => {
    expect(lookupRouting('0210').status).toBe('incomplete')
  })
  it('shows a demo bank name for a valid routing number it does not recognise', () => {
    const result = lookupRouting('091000019')
    expect(result.status).toBe('verified')
    if (result.status !== 'verified') return
    expect(result.bank).toBe('Pacific Meridian Bank')
    expect(lookupRouting('091000019')).toEqual(result)
  })
  it('detects card brand and validates the number', () => {
    expect(cardBrand('4111111111111111')).toBe('Visa')
    expect(luhnValid('4111111111111111')).toBe(true)
    expect(luhnValid('4111111111111112')).toBe(false)
  })
  it('rejects expired cards', () => {
    const now = new Date(2026, 10, 3)
    expect(expiryValid('10/26', now)).toBe(false)
    expect(expiryValid('11/26', now)).toBe(true)
  })
})
