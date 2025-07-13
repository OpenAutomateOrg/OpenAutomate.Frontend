import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Icons } from '@/components/ui/icons'
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'

export const metadata: Metadata = {
  title: 'Forgot Password | OpenAutomate',
  description: 'Reset your OpenAutomate account password',
}

// Loading fallback for the forgot password form
function ForgotPasswordFormLoading() {
  return (
    <div className="grid gap-6">
      <div className="flex justify-center py-8">
        <Icons.Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <div className="container flex-1 flex items-center justify-center py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-orange-600">
              Forgot Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to receive a password reset link
            </p>
          </div>
          <Suspense fallback={<ForgotPasswordFormLoading />}>
            <ForgotPasswordForm />
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
