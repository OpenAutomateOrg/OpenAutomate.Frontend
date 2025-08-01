import { isValid } from 'date-fns';
import { parseISO } from 'date-fns';

/**
 * Datetime utility functions for handling timezone conversions and formatting
 * 
 * Key principles:
 * - Receive UTC from backend, display in user's local timezone
 * - Send UTC to backend from user's local input
 * - Centralized date handling to ensure consistency across the app
 */

/**
 * Get the browser's locale or fall back to a default
 */
function getBrowserLocale(): string {
  if (typeof window !== 'undefined') {
    // Try to get the user's preferred locale
    return navigator.language || 'en-US'
  }
  return 'en-US'
}


/**
 * Default date format options for displaying dates
 */
export const DEFAULT_DATE_FORMAT = 'MMM dd, yyyy, h:mm a' // Jul 26, 2024, 5:17 PM
export const SHORT_DATE_FORMAT = 'MMM dd, yyyy' // Jul 26, 2024
export const TIME_FORMAT = 'h:mm a' // 5:17 PM
export const FULL_DATE_FORMAT = 'EEEE, MMMM dd, yyyy \'at\' h:mm a' // Monday, July 26, 2024 at 5:17 PM

/**
 * Format options interface for customizing date display
 */
export interface DateFormatOptions {
  /**
   * The format string to use (using Intl.DateTimeFormat options)
   * @default 'medium'
   */
  dateStyle?: 'short' | 'medium' | 'long' | 'full'
  /**
   * Time formatting style
   * @default 'short'
   */
  timeStyle?: 'short' | 'medium' | 'long' | 'full'
  /**
   * What to display if the date is invalid or null
   * @default 'N/A'
   */
  fallback?: string
  /**
   * Custom format string (overrides dateStyle/timeStyle)
   */
  customFormat?: string
  /**
   * Locale for formatting (e.g., 'en-US', 'vi-VN')
   * @default 'en-US'
   */
  locale?: string
}

/**
 * Convert a UTC date string or Date object to a formatted local time string
 * 
 * @param utcDate - UTC ISO string (e.g., '2024-07-26T10:00:00Z') or Date object
 * @param options - Formatting options
 * @returns Formatted local time string or fallback value
 * 
 * @example
 * formatUtcToLocal('2024-07-26T10:00:00Z') // 'Jul 26, 2024, 5:00 AM' (for UTC-5)
 * formatUtcToLocal('2024-07-26T10:00:00Z', { dateStyle: 'short' }) // '7/26/24'
 * formatUtcToLocal(null) // 'N/A'
 * formatUtcToLocal('invalid-date') // 'N/A'
 */
export function formatUtcToLocal(
  utcDate: string | Date | null | undefined,
  options: DateFormatOptions = {}
): string {
  const { 
    dateStyle = 'medium', 
    timeStyle = 'short', 
    fallback = 'N/A',
    customFormat,
    locale = getBrowserLocale()
  } = options

  if (!utcDate) {
    return fallback
  }

  try {
    let date: Date

    if (typeof utcDate === 'string') {
      // Handle the case where backend sends UTC time without 'Z' suffix
      // If the string doesn't end with 'Z' and doesn't have timezone info, assume it's UTC
      let dateString = utcDate
      if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
        // Add 'Z' to indicate UTC timezone
        dateString = dateString.replace(/(\.\d+)?$/, '$1Z')
        console.debug(`Corrected UTC date format: ${utcDate} -> ${dateString}`)
      }
      
      // Create Date object from UTC string - this automatically converts to local timezone
      date = new Date(dateString)
    } else {
      // Already a Date object
      date = utcDate
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date provided to formatUtcToLocal: ${utcDate}`)
      return fallback
    }

    // Use custom format if provided
    if (customFormat) {
      return formatWithCustomPattern(date, customFormat)
    }

    // Use Intl.DateTimeFormat for proper local timezone formatting
    return new Intl.DateTimeFormat(locale, {
      dateStyle,
      timeStyle,
    }).format(date)
  } catch (error) {
    console.error(`Error formatting date ${utcDate}:`, error)
    return fallback
  }
}

/**
 * Custom formatting function for specific patterns
 */
function formatWithCustomPattern(date: Date, pattern: string): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const formatMap: { [key: string]: string } = {
    'yyyy': year.toString(),
    'MMM': monthNames[month - 1],
    'dd': day.toString().padStart(2, '0'),
    'h': (hours % 12 || 12).toString(),
    'mm': minutes.toString().padStart(2, '0'),
    'a': hours >= 12 ? 'PM' : 'AM'
  }
  
  let result = pattern
  Object.entries(formatMap).forEach(([key, value]) => {
    result = result.replace(new RegExp(key, 'g'), value)
  })
  
  return result
}

/**
 * Convert a local Date object to a UTC ISO string for backend submission
 * 
 * @param localDate - Date object in local timezone
 * @returns UTC ISO string (e.g., '2024-07-26T10:00:00.000Z') or null if invalid
 * 
 * @example
 * const userSelectedDate = new Date('2024-07-26 17:00') // Local time
 * formatLocalToUtc(userSelectedDate) // '2024-07-26T22:00:00.000Z' (for UTC-5)
 */
export function formatLocalToUtc(localDate: Date | null | undefined): string | null {
  if (!localDate || !isValid(localDate)) {
    return null
  }

  return localDate.toISOString()
}

/**
 * Parse a UTC date string into a Date object (in local timezone)
 * Useful for working with Date objects while maintaining timezone awareness
 * 
 * @param utcDateString - UTC ISO string
 * @returns Date object or null if invalid
 * 
 * @example
 * const date = parseUtcDate('2024-07-26T10:00:00Z')
 * // Returns Date object that will display as local time when formatted
 */
export function parseUtcDate(utcDateString: string | null | undefined): Date | null {
  if (!utcDateString) {
    return null
  }

  try {
    const date = parseISO(utcDateString)
    return isValid(date) ? date : null
  } catch (error) {
    console.error(`Error parsing UTC date ${utcDateString}:`, error)
    return null
  }
}

/**
 * Get current date/time as UTC ISO string
 * Useful for timestamps that need to be sent to the backend
 * 
 * @returns Current UTC ISO string
 * 
 * @example
 * const now = getCurrentUtcIsoString() // '2024-07-26T15:30:45.123Z'
 */
export function getCurrentUtcIsoString(): string {
  return new Date().toISOString()
}

/**
 * Format a relative time string (e.g., "2 hours ago", "in 3 days")
 * This is a placeholder for future implementation with date-fns formatDistanceToNow
 * 
 * @param utcDate - UTC date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(utcDate: string | Date | null | undefined): string {
  if (!utcDate) {
    return 'Unknown'
  }

  const date = typeof utcDate === 'string' ? parseUtcDate(utcDate) : utcDate
  if (!date) {
    return 'Unknown'
  }

  // For now, fall back to standard formatting
  // Future: implement with formatDistanceToNow from date-fns
  return formatUtcToLocal(date, { customFormat: SHORT_DATE_FORMAT })
}

/**
 * Validation helper to check if a date string appears to be UTC
 * Logs a warning if the date doesn't end with 'Z' (UTC indicator)
 * 
 * @param dateString - Date string to validate
 * @returns true if appears to be UTC format
 */
export function validateUtcFormat(dateString: string): boolean {
  if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('T')) {
    console.warn(
      `Date string '${dateString}' may not be in UTC format. ` +
      'Expected format: 2024-07-26T10:00:00Z'
    )
    return false
  }
  return true
}