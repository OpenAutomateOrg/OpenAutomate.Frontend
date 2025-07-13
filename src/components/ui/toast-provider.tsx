'use client'

import { ReactNode, useState, useMemo } from 'react'
import { ToastContext, type ToastType } from './use-toast'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const addToast = (toast: ToastType) => {
    const id = toast.id || crypto.randomUUID()

    setToasts((prev) => {
      // Check if we need to limit the number of toasts
      const newToasts = [{ ...toast, id }, ...prev]
      return newToasts.slice(0, 5) // Limit to 5 toasts
    })

    return id
  }

  const updateToast = (toast: ToastType) => {
    if (!toast.id) return

    setToasts((prev) => prev.map((t) => (t.id === toast.id ? { ...t, ...toast } : t)))
  }

  const dismissToast = (toastId: string) => {
    setToasts((prev) => prev.map((t) => (t.id === toastId ? { ...t, open: false } : t)))
  }

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId))
  }

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      toasts,
      addToast,
      updateToast,
      dismissToast,
      removeToast,
    }),
    [toasts],
  )

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>
}
