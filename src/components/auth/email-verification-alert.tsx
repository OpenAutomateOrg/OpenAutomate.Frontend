'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { authApi } from '@/lib/api/auth'

interface EmailVerificationAlertProps {
  email: string
}

export function EmailVerificationAlert({ email }: EmailVerificationAlertProps) {
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
    } catch (error: unknown) {
      setResendStatus('error')
      console.error('Failed to resend verification email:', error)
      
      // Extract error message for display
      let displayError = 'Failed to resend. Please try again.';
      if (error && typeof error === 'object') {
        // Check for standard Error object
        if ('message' in error && typeof error.message === 'string') {
          displayError = error.message;
        } 
        // Check for axios error response
        else if ('response' in error && 
                 typeof error.response === 'object' && 
                 error.response && 
                 'data' in error.response && 
                 typeof error.response.data === 'object' && 
                 error.response.data && 
                 'message' in error.response.data && 
                 typeof error.response.data.message === 'string') {
          displayError = error.response.data.message;
        }
      }
      setErrorMessage(displayError);
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        onClick={handleResendVerification}
        disabled={isResending}
      >
        {isResending && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
        {isResending ? 'Sending...' : 'Resend verification email'}
      </Button>
      
      {resendStatus === 'success' && (
        <p className="mt-2 text-sm text-center text-green-600">
          Verification email sent! Please check your inbox.
        </p>
      )}
      
      {resendStatus === 'error' && (
        <p className="mt-2 text-sm text-center text-red-600">
          {errorMessage || 'Failed to resend. Please try again.'}
        </p>
      )}
    </div>
  )
} 