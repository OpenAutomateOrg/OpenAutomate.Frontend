'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { authApi } from '@/lib/api/auth'
import { Icons } from '@/components/ui/icons'

// Loading fallback component
function VerificationPendingLoading() {
  return (
    <div className="container flex-1 flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Loading...</CardTitle>
          <CardDescription className="text-center">
            Please wait while we load your verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex justify-center">
          <Icons.Spinner className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    </div>
  )
}

// Client component that uses search params
function VerificationPendingContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const returnUrl = searchParams.get('returnUrl')
  const [isResending, setIsResending] = useState(false)
  const [alert, setAlert] = useState<{
    type: 'success' | 'error'
    title: string
    message: string
  } | null>(null)

  const resendVerification = async () => {
    if (!email) return

    setIsResending(true)
    try {
      // Sử dụng phương thức không yêu cầu xác thực
      await authApi.resendVerificationEmailByEmail(email)
      setAlert({
        type: 'success',
        title: 'Verification email sent',
        message: 'Please check your inbox for the verification link.',
      })
    } catch (error: unknown) {
      console.error('Failed to resend verification email:', error);
      
      // Trích xuất thông báo lỗi chi tiết hơn
      let errorMessage = 'An unexpected error occurred.';
      if (error && typeof error === 'object') {
        // Kiểm tra Error object tiêu chuẩn
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } 
        // Kiểm tra lỗi response từ axios
        else if ('response' in error && 
                 typeof error.response === 'object' && 
                 error.response && 
                 'data' in error.response && 
                 typeof error.response.data === 'object' && 
                 error.response.data && 
                 'message' in error.response.data && 
                 typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        }
      }
      
      setAlert({
        type: 'error',
        title: 'Failed to resend email',
        message: errorMessage,
      })
    } finally {
      setIsResending(false)
    }
  }

  // Generate login URL with return URL if available
  const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'

  return (
    <div className="container flex-1 flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            We&apos;ve sent a verification email to{' '}
            <span className="font-medium">{email ?? 'your email address'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {alert && (
            <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>Please check your inbox and click the link in the email to verify your account.</p>
            <p className="mt-2">
              If you don&apos;t see the email, check your spam folder or request a new verification
              email.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={resendVerification}
              variant="outline"
              className="w-full"
              disabled={isResending}
            >
              {isResending && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
              {isResending ? 'Sending...' : 'Resend verification email'}
            </Button>

            <Link href={loginUrl}>
              <Button variant="ghost" className="w-full">
                Return to login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component with Suspense boundary
export default function VerificationPendingPage() {
  return (
    <Suspense fallback={<VerificationPendingLoading />}>
      <VerificationPendingContent />
    </Suspense>
  )
}
