'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { authApi } from '@/lib/api/auth'
import { extractErrorMessage } from '@/lib/utils/error-utils'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface EmailVerificationAlertProps {
  readonly email: string
  onResendSuccess?: () => void
}

export function EmailVerificationAlert({ email, onResendSuccess }: EmailVerificationAlertProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleResendVerification = async () => {
    if (!email || isResending) return

    setIsResending(true)
    try {
      // Use the non-authenticated endpoint since user is not logged in yet
      await authApi.resendVerificationEmailByEmail(email)
      setResendStatus('success')
      setErrorMessage(null)
      if (onResendSuccess) onResendSuccess()
    } catch (error: unknown) {
      setResendStatus('error')
      console.error('Failed to resend verification email:', error)

      // Use the shared utility function to extract error message
      const displayError = extractErrorMessage(error) ?? 'Failed to resend. Please try again.'
      setErrorMessage(displayError)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <Button
        variant="outline"
        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 px-4 text-base font-semibold text-gray-700 dark:text-gray-200 shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
        onClick={handleResendVerification}
        disabled={isResending}
      >
        {isResending && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
        {isResending ? 'Sending...' : 'Resend verification email'}
      </Button>

      {resendStatus === 'success' && (
        <Alert
          variant="success"
          className="animate-fade-in border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:border-green-700 dark:text-green-200"
        >
          <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
          <div>
            <AlertTitle className="font-semibold">Verification email sent!</AlertTitle>
            <AlertDescription>Please check your inbox.</AlertDescription>
          </div>
        </Alert>
      )}

      {resendStatus === 'error' && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <AlertTitle className="font-semibold">Failed to resend</AlertTitle>
            <AlertDescription>
              {errorMessage ?? 'Failed to resend. Please try again.'}
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  )
}
