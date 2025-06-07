import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Clock, Play } from 'lucide-react'

interface ExecutionStatusBadgeProps {
  status: string
  className?: string
}

export default function ExecutionStatusBadge({ status, className }: ExecutionStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Pending',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
      case 'running':
        return {
          variant: 'default' as const,
          icon: Loader2,
          label: 'Running',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        }
      case 'completed':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Completed',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        }
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Failed',
          className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }
      case 'cancelled':
        return {
          variant: 'outline' as const,
          icon: XCircle,
          label: 'Cancelled',
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
        }
      default:
        return {
          variant: 'outline' as const,
          icon: Play,
          label: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ''}`}>
      <Icon className={`mr-1 h-3 w-3 ${status.toLowerCase() === 'running' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  )
} 