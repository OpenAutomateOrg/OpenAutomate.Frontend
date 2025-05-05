/**
 * Logger utility with styled console output for development purposes
 */

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'auth'

interface LogStyles {
  [key: string]: string
}

// Style configuration for different log types
const styles: LogStyles = {
  info: 'color: #3498db; font-weight: bold;',
  success: 'color: #2ecc71; font-weight: bold;',
  warning: 'color: #f39c12; font-weight: bold;',
  error: 'color: #e74c3c; font-weight: bold;',
  auth: 'color: #9b59b6; font-weight: bold;',
  default: 'color: #34495e; font-weight: normal;',
  group: 'color: #2c3e50; font-weight: bold; font-size: 1.1em;',
  object: 'color: #7f8c8d; font-weight: normal;',
}

/**
 * Logs a message with optional styling based on log level
 */
export const log = (message: string, level: LogLevel = 'info', ...data: unknown[]) => {
  // Only log in development environment
  if (process.env.NODE_ENV !== 'production') {
    const style = styles[level] || styles.default
    console.log(`%c${message}`, style, ...data)
  }
}

/**
 * Logs a success message
 */
export const logSuccess = (message: string, ...data: unknown[]) => {
  log(message, 'success', ...data)
}

/**
 * Logs an error message
 */
export const logError = (message: string, ...data: unknown[]) => {
  log(message, 'error', ...data)
}

/**
 * Logs a warning message
 */
export const logWarning = (message: string, ...data: unknown[]) => {
  log(message, 'warning', ...data)
}

/**
 * Logs authentication-related messages with special styling
 */
export const logAuth = (
  message: string,
  data?: Record<string, unknown> | string | number | boolean,
) => {
  if (process.env.NODE_ENV !== 'production') {
    console.group(`%c🔐 ${message}`, styles.group)

    if (data) {
      if (typeof data === 'object') {
        console.log('%cDetails:', styles.object)
        console.table(data)
      } else {
        console.log(data)
      }
    }

    console.groupEnd()
  }
}

/**
 * Creates a styled divider in the console
 */
export const logDivider = (label?: string) => {
  if (process.env.NODE_ENV !== 'production') {
    if (label) {
      console.log(`%c---------------- ${label} ----------------`, styles.info)
    } else {
      console.log('%c----------------------------------------', styles.info)
    }
  }
}

// Export as default object
const logger = {
  log,
  success: logSuccess,
  error: logError,
  warning: logWarning,
  auth: logAuth,
  divider: logDivider,
}

export default logger
