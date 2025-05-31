'use client';

import React, { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from '@/components/forms/login-form'
import { Icons } from '@/components/ui/icons'

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
    const [returnUrl, setReturnUrl] = React.useState('')

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search)
            setReturnUrl(searchParams.get('returnUrl') ?? '')
        }
    }, [])

    const registerUrl = returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-orange-600">Sign In</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email and password to continue
                </p>
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