'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/forms/login-form'
import { Icons } from '@/components/ui/icons'
import { useAuth } from '@/hooks/use-auth'

// Loading fallback for the login form
function LoginFormLoading() {
  return (
    <div className="grid gap-6">
      <div className="flex justify-center py-8">
        <Icons.Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}

export function LoginClient() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user, isSystemAdmin } = useAuth()
  const [returnUrl, setReturnUrl] = React.useState('')

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      setReturnUrl(searchParams.get('returnUrl') ?? '')
    }
  }, [])

  // Check if user is already authenticated and redirect
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // If user is already signed in, redirect them
      if (returnUrl) {
        router.push(returnUrl)
      } else {
        // Different default redirect based on user role
        const defaultRoute = isSystemAdmin ? '/dashboard' : '/tenant-selector'
        router.push(defaultRoute)
      }
    }
  }, [isLoading, isAuthenticated, user, returnUrl, router, isSystemAdmin])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex justify-center py-8">
          <Icons.Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <p className="text-center text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    )
  }

  // Don't render login form if user is authenticated
  if (isAuthenticated) {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex justify-center py-8">
          <Icons.Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <p className="text-center text-sm text-muted-foreground">Redirecting...</p>
      </div>
    )
  }

  const registerUrl = returnUrl
    ? `/register?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/register'

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-orange-600">Sign In</h1>
        <p className="text-sm text-muted-foreground">Enter your email and password to continue</p>
      </div>
      <Suspense fallback={<LoginFormLoading />}>
        <LoginForm />
      </Suspense>
      <div className="px-8 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href={registerUrl}
            className="text-orange-600 underline underline-offset-4 hover:text-orange-700 font-medium transition-all duration-300 hover:underline-offset-8"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
