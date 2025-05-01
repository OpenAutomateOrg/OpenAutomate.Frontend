'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { config } from '@/lib/config'

export default function EmailVerifiedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // Get verification params
  const success = searchParams.get('success') === 'true'
  const reason = searchParams.get('reason')
  
  useEffect(() => {
    // Simulate loading to ensure all params are processed
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Handle redirect to login
  const handleLoginRedirect = () => {
    router.push(config.paths.auth.login)
  }
  
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 space-y-4 text-center">
          <h1 className="text-2xl font-bold">Verifying your email...</h1>
          <p className="text-gray-500">Please wait while we confirm your email verification.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 space-y-6 text-center">
        {success ? (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold">Email Verified!</h1>
            <p className="text-gray-500">
              Your email has been successfully verified. You can now login to your account.
            </p>
            <Button className="w-full" onClick={handleLoginRedirect}>
              Go to Login
            </Button>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            <Alert variant="destructive" className="text-left">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {reason === 'invalid-token' && 'The verification link is invalid or has expired.'}
                {reason === 'verification-failed' && 'We couldn\'t verify your email. Please try again later.'}
                {reason === 'missing-token' && 'No verification token was provided.'}
                {reason === 'server-error' && 'A server error occurred. Please try again later.'}
                {!reason && 'An unknown error occurred during verification.'}
              </AlertDescription>
            </Alert>
            <p className="text-gray-500">
              If you continue to have problems, please contact support.
            </p>
            <div className="space-y-3">
              <Button className="w-full" onClick={handleLoginRedirect}>
                Go to Login
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 