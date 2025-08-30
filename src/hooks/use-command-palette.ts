'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for managing command palette state and keyboard shortcuts
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  // Toggle command palette
  const toggle = useCallback(() => {
    setOpen(prev => !prev)
  }, [])

  // Open command palette
  const openPalette = useCallback(() => {
    setOpen(true)
  }, [])

  // Close command palette
  const closePalette = useCallback(() => {
    setOpen(false)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
        return
      }

      // Escape to close
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        closePalette()
        return
      }

      // Prevent opening when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return
      }

      // Quick shortcuts when palette is closed
      if (!open) {
        // '/' to open search
        if (e.key === '/') {
          e.preventDefault()
          openPalette()
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, toggle, openPalette, closePalette])

  return {
    open,
    setOpen,
    toggle,
    openPalette,
    closePalette,
  }
}
