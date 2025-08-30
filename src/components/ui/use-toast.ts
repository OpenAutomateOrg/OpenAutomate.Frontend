import { createContext, useContext } from 'react'

import type { ToastActionElement, ToastProps } from '@/components/ui/toast'

type ToastType = ToastProps & {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: 'default' | 'destructive' | 'success' | 'warning'
}

type ToastContextType = {
  toasts: ToastType[]
  addToast: (toast: ToastType) => string
  updateToast: (toast: ToastType) => void
  dismissToast: (toastId: string) => void
  removeToast: (toastId: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => '',
  updateToast: () => {},
  dismissToast: () => {},
  removeToast: () => {},
})

export function useToast() {
  const context = useContext(ToastContext)

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return {
    toast: (props: ToastType) => context.addToast(props),
    dismiss: (toastId: string) => context.dismissToast(toastId),
    toasts: context.toasts,
  }
}

export { ToastContext }
export type { ToastContextType, ToastType }
