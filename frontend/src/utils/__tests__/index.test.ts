import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPhone, formatIdCard, formatDateTime } from '../index'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1000)).toBe('¥1,000')
      expect(formatCurrency(1234567)).toBe('¥1,234,567')
    })
  })

  describe('formatPhone', () => {
    it('formats phone number correctly', () => {
      expect(formatPhone('13812345678')).toBe('138****5678')
      expect(formatPhone('')).toBe('-')
    })
  })

  describe('formatIdCard', () => {
    it('formats ID card correctly', () => {
      expect(formatIdCard('123456789012345678')).toBe('123456****5678')
      expect(formatIdCard('')).toBe('-')
    })
  })

  describe('formatDateTime', () => {
    it('formats date time correctly', () => {
      const date = '2025-07-12T10:30:00.000Z'
      const result = formatDateTime(date)
      expect(result).toMatch(/2025/)
    })
  })
})