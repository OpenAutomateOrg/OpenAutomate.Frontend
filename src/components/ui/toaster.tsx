'use client'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/utils'

const getToastIcon = (variant?: string) => {
  switch (variant) {
    case 'destructive':
      return <AlertCircle className="h-5 w-5 text-red-500" />
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    default:
      return <Info className="h-5 w-5 text-blue-500" />
  }
}

const getToastStyles = (variant?: string) => {
  switch (variant) {
    case 'destructive':
      return 'border-red-200 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100'
    case 'success':
      return 'border-green-200 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-800 dark:text-green-100'
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-800 dark:text-yellow-100'
    default:
      return 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-800 dark:text-blue-100'
  }
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const toastId = id || crypto.randomUUID()

        return (
          <Toast
            key={toastId}
            {...props}
            className={cn(
              'group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 hover:shadow-xl',
              getToastStyles(variant),
            )}
          >
            <div className="flex-shrink-0 pt-0.5">{getToastIcon(variant)}</div>

            <div className="flex-1 min-w-0">
              {title && (
                <ToastTitle className="text-sm font-semibold leading-5 mb-1">{title}</ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-sm leading-5 opacity-90">
                  {description}
                </ToastDescription>
              )}
              {action && <div className="mt-3">{action}</div>}
            </div>

            <ToastClose
              className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
              onClick={() => dismiss(toastId)}
            />
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:left-0 sm:top-auto sm:flex-col md:max-w-[400px]" />
    </ToastProvider>
  )
}
