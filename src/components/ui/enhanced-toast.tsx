import * as React from 'react'
import { Toast, ToastClose, ToastDescription, ToastTitle } from './toast'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils/utils'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface EnhancedToastProps {
  id?: string
  type: NotificationType
  title: string
  description: string
  duration?: number
  action?: React.ReactNode
  onClose?: () => void
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    variant: 'default' as const,
    className:
      'border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-800 dark:text-green-100',
    iconClassName: 'text-green-600 dark:text-green-400',
    titleClassName: 'text-green-800 dark:text-green-100',
    descriptionClassName: 'text-green-700 dark:text-green-200',
  },
  error: {
    icon: AlertCircle,
    variant: 'destructive' as const,
    className:
      'border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-100',
    iconClassName: 'text-red-600 dark:text-red-400',
    titleClassName: 'text-red-800 dark:text-red-100',
    descriptionClassName: 'text-red-700 dark:text-red-200',
  },
  warning: {
    icon: AlertTriangle,
    variant: 'default' as const,
    className:
      'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-100',
    iconClassName: 'text-yellow-600 dark:text-yellow-400',
    titleClassName: 'text-yellow-800 dark:text-yellow-100',
    descriptionClassName: 'text-yellow-700 dark:text-yellow-200',
  },
  info: {
    icon: Info,
    variant: 'default' as const,
    className:
      'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-100',
    iconClassName: 'text-blue-600 dark:text-blue-400',
    titleClassName: 'text-blue-800 dark:text-blue-100',
    descriptionClassName: 'text-blue-700 dark:text-blue-200',
  },
}

export function EnhancedToast({ type, title, description, action, onClose }: EnhancedToastProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <Toast
      className={cn(
        'group pointer-events-auto relative flex w-full items-start space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all duration-300',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out',
        'data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-left-full',
        'data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
        'hover:shadow-xl',
        config.className,
      )}
    >
      <div className="flex-shrink-0">
        <Icon className={cn('h-5 w-5', config.iconClassName)} />
      </div>

      <div className="flex-1 min-w-0">
        <ToastTitle className={cn('text-sm font-semibold leading-5', config.titleClassName)}>
          {title}
        </ToastTitle>
        <ToastDescription className={cn('mt-1 text-sm leading-5', config.descriptionClassName)}>
          {description}
        </ToastDescription>
        {action && <div className="mt-3">{action}</div>}
      </div>

      <ToastClose
        className={cn(
          'absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100',
          'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2',
          type === 'error' &&
            'text-red-500 hover:text-red-600 focus:ring-red-500 dark:text-red-400',
          type === 'success' &&
            'text-green-500 hover:text-green-600 focus:ring-green-500 dark:text-green-400',
          type === 'warning' &&
            'text-yellow-500 hover:text-yellow-600 focus:ring-yellow-500 dark:text-yellow-400',
          type === 'info' &&
            'text-blue-500 hover:text-blue-600 focus:ring-blue-500 dark:text-blue-400',
        )}
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </ToastClose>
    </Toast>
  )
}
