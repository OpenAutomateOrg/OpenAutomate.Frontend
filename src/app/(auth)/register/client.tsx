'use client';

import React from 'react'
import Link from 'next/link'
import { RegisterForm } from '@/components/forms/register-form'

export function RegisterClient() {
    const [returnUrl, setReturnUrl] = React.useState('')

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search)
            setReturnUrl(searchParams.get('returnUrl') ?? '')
        }
    }, [])

    const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your details to create your account
                </p>
            </div>
            <RegisterForm />
            <p className="px-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                    href={loginUrl}
                    className="underline underline-offset-4 hover:text-primary font-medium transition-all duration-300 hover:underline-offset-8"
                >
                    Sign in
                </Link>
            </p>
        </div>
    )
} 