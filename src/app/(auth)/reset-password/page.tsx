import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Icons } from '@/components/ui/icons'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset Password | OpenAutomate',
  description: 'Reset your OpenAutomate account password',
}

// Loading fallback for the reset password form
function ResetPasswordFormLoading() {
  return (
    <div className="grid gap-6">
      <div className="flex justify-center py-8">
        <Icons.Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}

// Sử dụng unknown để tránh lỗi ESLint
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ResetPasswordPage(props: any) {
  // Extract searchParams từ props
  const searchParams = props.searchParams || {}

  // Get token and email from search params to pass down to the form
  const token = searchParams.token || ''
  const email = searchParams.email || ''

  // For debugging in server logs
  if (token) {
    console.log('Reset page received token length:', token.length)
  }

  if (email) {
    console.log('Reset page received email:', email)
  }

  return (
    <>
      <div className="container flex-1 flex items-center justify-center py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-orange-600">
              Reset Password
            </h1>
            <p className="text-sm text-muted-foreground">Enter your new password below</p>
          </div>
          <Suspense fallback={<ResetPasswordFormLoading />}>
            <ResetPasswordForm />
          </Suspense>
          <p className="px-8 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link
              href="/login"
              className="text-orange-600 underline underline-offset-4 hover:text-orange-700 font-medium transition-all duration-300 hover:underline-offset-8"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
