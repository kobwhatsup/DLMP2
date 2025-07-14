import { describe, it, expect, vi } from 'vitest'
import { formatCurrency, formatPhone, formatIdCard, formatDateTime, validatePhone, validateIdCard, formatFileSize, downloadFile, getFileExtension, debounce } from '../index'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats positive currency correctly', () => {
      expect(formatCurrency(1000)).toBe('¥1,000')
      expect(formatCurrency(1234567)).toBe('¥1,234,567')
      expect(formatCurrency(0)).toBe('¥0')
    })

    it('formats negative currency correctly', () => {
      expect(formatCurrency(-1000)).toBe('-¥1,000')
    })

    it('handles decimal numbers', () => {
      expect(formatCurrency(1000.50)).toBe('¥1,000.5')
      expect(formatCurrency(1000.123)).toBe('¥1,000.123')
    })

    it('handles edge cases', () => {
      expect(formatCurrency(undefined as any)).toBe('¥0')
      expect(formatCurrency(null as any)).toBe('¥0')
      expect(formatCurrency(NaN)).toBe('¥0')
    })
  })

  describe('formatPhone', () => {
    it('formats phone number correctly', () => {
      expect(formatPhone('13812345678')).toBe('138****5678')
      expect(formatPhone('18900001234')).toBe('189****1234')
    })

    it('handles edge cases', () => {
      expect(formatPhone('')).toBe('-')
      expect(formatPhone(null as any)).toBe('-')
      expect(formatPhone(undefined as any)).toBe('-')
      expect(formatPhone('123')).toBe('123')
    })
  })

  describe('formatIdCard', () => {
    it('formats ID card correctly', () => {
      expect(formatIdCard('123456789012345678')).toBe('123456****5678')
      expect(formatIdCard('110101199001011234')).toBe('110101****1234')
    })

    it('handles edge cases', () => {
      expect(formatIdCard('')).toBe('-')
      expect(formatIdCard(null as any)).toBe('-')
      expect(formatIdCard(undefined as any)).toBe('-')
      expect(formatIdCard('123456')).toBe('123456')
    })
  })

  describe('formatDateTime', () => {
    it('formats date time correctly', () => {
      const date = '2025-07-12T10:30:00.000Z'
      const result = formatDateTime(date)
      expect(result).toMatch(/2025-07-12 \d{2}:30:00/)
    })

    it('handles different date formats', () => {
      expect(formatDateTime('2025-07-12')).toMatch(/2025-07-12/)
      expect(formatDateTime(new Date('2025-07-12').getTime())).toMatch(/2025-07-12/)
    })

    it('handles invalid dates', () => {
      expect(formatDateTime('')).toBe('-')
      expect(formatDateTime(null as any)).toBe('-')
      expect(formatDateTime('invalid')).toBe('-')
    })
  })

  describe('validatePhone', () => {
    it('validates correct phone numbers', () => {
      expect(validatePhone('13812345678')).toBe(true)
      expect(validatePhone('18900001234')).toBe(true)
      expect(validatePhone('15555555555')).toBe(true)
    })

    it('rejects invalid phone numbers', () => {
      expect(validatePhone('12345678901')).toBe(false)
      expect(validatePhone('1381234567')).toBe(false)
      expect(validatePhone('abc1234567')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('validateIdCard', () => {
    it('validates correct ID cards', () => {
      expect(validateIdCard('110101199001011234')).toBe(true)
      expect(validateIdCard('123456789012345678')).toBe(true)
    })

    it('rejects invalid ID cards', () => {
      expect(validateIdCard('12345678901234567')).toBe(false)
      expect(validateIdCard('1234567890123456789')).toBe(false)
      expect(validateIdCard('abcdefghij12345678')).toBe(false)
      expect(validateIdCard('')).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('formats file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('handles edge cases', () => {
      expect(formatFileSize(-1024)).toBe('0 B')
      expect(formatFileSize(undefined as any)).toBe('0 B')
      expect(formatFileSize(null as any)).toBe('0 B')
    })
  })

  describe('getFileExtension', () => {
    it('extracts file extensions correctly', () => {
      expect(getFileExtension('test.pdf')).toBe('pdf')
      expect(getFileExtension('document.docx')).toBe('docx')
      expect(getFileExtension('image.jpeg')).toBe('jpeg')
      expect(getFileExtension('path/to/file.txt')).toBe('txt')
    })

    it('handles files without extensions', () => {
      expect(getFileExtension('README')).toBe('')
      expect(getFileExtension('file.')).toBe('')
      expect(getFileExtension('')).toBe('')
    })
  })

  describe('downloadFile', () => {
    beforeEach(() => {
      // Mock DOM methods
      document.createElement = vi.fn().mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
        style: { display: '' }
      })
      document.body.appendChild = vi.fn()
      document.body.removeChild = vi.fn()
      global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url')
      global.URL.revokeObjectURL = vi.fn()
    })

    it('downloads file correctly', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' })
      const filename = 'test.txt'
      
      downloadFile(blob, filename)
      
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob)
    })
  })

  describe('debounce', () => {
    vi.useFakeTimers()

    it('debounces function calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('passes arguments correctly', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })

    afterEach(() => {
      vi.useRealTimers()
    })
  })
})