/**
 * Test file for datetime utilities
 * Run with: npm test -- datetime.test.ts
 */

import { 
  formatUtcToLocal, 
  parseUtcDate, 
  safeFormatRelativeTime,
  createUtcDateTimeString,
  validateUtcFormat,
  isValidUtcDateTime
} from './datetime'

describe('DateTime Utilities', () => {
  
  describe('parseUtcDate', () => {
    it('should parse valid UTC dates', () => {
      const validUtcDate = '2025-08-17T10:30:00.000Z'
      const result = parseUtcDate(validUtcDate)
      expect(result).toBeInstanceOf(Date)
      expect(result?.toISOString()).toBe(validUtcDate)
    })

    it('should return null for invalid dates', () => {
      expect(parseUtcDate(null)).toBeNull()
      expect(parseUtcDate(undefined)).toBeNull()
      expect(parseUtcDate('')).toBeNull()
      expect(parseUtcDate('invalid-date')).toBeNull()
    })

    it('should handle dates without Z suffix', () => {
      const dateWithoutZ = '2025-08-17T10:30:00'
      const result = parseUtcDate(dateWithoutZ)
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('formatUtcToLocal', () => {
    const testUtcDate = '2025-08-17T10:30:00.000Z'

    it('should format UTC dates to local', () => {
      const result = formatUtcToLocal(testUtcDate)
      expect(result).toBeTruthy()
      expect(result).not.toBe('N/A')
    })

    it('should return fallback for invalid dates', () => {
      expect(formatUtcToLocal(null)).toBe('N/A')
      expect(formatUtcToLocal('invalid')).toBe('N/A')
      expect(formatUtcToLocal('', { fallback: 'Custom fallback' })).toBe('Custom fallback')
    })

    it('should use custom formatting options', () => {
      const result = formatUtcToLocal(testUtcDate, {
        dateStyle: 'short',
        timeStyle: 'short'
      })
      expect(result).toBeTruthy()
    })
  })

  describe('safeFormatRelativeTime', () => {
    it('should format relative time with prefix', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      const result = safeFormatRelativeTime(futureDate, { prefix: 'Expires' })
      expect(result).toContain('Expires')
      expect(result).toContain('in')
    })

    it('should return fallback for invalid dates', () => {
      expect(safeFormatRelativeTime(null)).toBe('Date pending')
      expect(safeFormatRelativeTime('invalid', { fallback: 'Custom fallback' })).toBe('Custom fallback')
    })

    it('should handle past dates', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      const result = safeFormatRelativeTime(pastDate, { prefix: 'Expired' })
      expect(result).toContain('Expired')
      expect(result).toContain('ago')
    })
  })

  describe('createUtcDateTimeString', () => {
    it('should create UTC datetime string from local inputs', () => {
      const testDate = new Date('2025-08-17')
      const timeString = '17:30'
      const result = createUtcDateTimeString(testDate, timeString)
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(isValidUtcDateTime(result)).toBe(true)
    })

    it('should handle 12-hour time format', () => {
      const testDate = new Date('2025-08-17')
      const timeString = '5:30 PM'
      const result = createUtcDateTimeString(testDate, timeString)
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should throw error for invalid time format', () => {
      const testDate = new Date('2025-08-17')
      expect(() => createUtcDateTimeString(testDate, 'invalid')).toThrow('Invalid time format')
    })
  })

  describe('validateUtcFormat', () => {
    it('should validate UTC format strings', () => {
      expect(validateUtcFormat('2025-08-17T10:30:00.000Z')).toBe(true)
      expect(validateUtcFormat('2025-08-17T10:30:00Z')).toBe(true)
    })

    it('should reject non-UTC formats', () => {
      expect(validateUtcFormat('2025-08-17')).toBe(false)
      expect(validateUtcFormat('2025-08-17 10:30:00')).toBe(false)
    })
  })

  describe('isValidUtcDateTime', () => {
    it('should validate UTC datetime strings', () => {
      expect(isValidUtcDateTime('2025-08-17T10:30:00.000Z')).toBe(true)
      expect(isValidUtcDateTime('2025-08-17T10:30:00Z')).toBe(true)
    })

    it('should reject invalid datetime strings', () => {
      expect(isValidUtcDateTime('invalid')).toBe(false)
      expect(isValidUtcDateTime('2025-08-17')).toBe(false)
      expect(isValidUtcDateTime('2025-08-17T25:30:00Z')).toBe(false) // Invalid hour
    })
  })

})

// Test specifically for the SubscriptionStatus error case
describe('SubscriptionStatus Error Prevention', () => {
  it('should handle null/undefined subscription dates safely', () => {
    // These should not throw errors
    expect(safeFormatRelativeTime(null)).toBe('Date pending')
    expect(safeFormatRelativeTime(undefined)).toBe('Date pending')
    expect(safeFormatRelativeTime('')).toBe('Date pending')
  })

  it('should handle malformed date strings', () => {
    const malformedDates = [
      'not-a-date',
      '2025-13-45T99:99:99Z', // Invalid date values
      '2025-08-17T10:30:00ZZZ', // Extra characters
      '2025-08-17T10:30:00+', // Incomplete timezone
    ]

    malformedDates.forEach(date => {
      expect(() => safeFormatRelativeTime(date)).not.toThrow()
      expect(safeFormatRelativeTime(date)).toBe('Date pending')
    })
  })

  it('should handle edge case subscription data', () => {
    const edgeCases = [
      null,
      undefined,
      '', 
      'Invalid Date',
      '0000-00-00T00:00:00Z',
      'NaN',
    ]

    edgeCases.forEach(testCase => {
      expect(() => {
        formatUtcToLocal(testCase)
        safeFormatRelativeTime(testCase)
        parseUtcDate(testCase)
      }).not.toThrow()
    })
  })
})