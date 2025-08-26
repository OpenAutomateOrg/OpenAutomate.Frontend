'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/providers/auth-provider'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle } from 'lucide-react'
import { config } from '@/lib/config/config'
import { EmailVerificationAlert } from '@/components/auth/email-verification-alert'

// Form validation schema
const formSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type FormData = z.infer<typeof formSchema>

// This is a client component that accesses search params
export function LoginForm() {
  // The component using useSearchParams must be wrapped in a
  // Suspense boundary by the parent that renders this component
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<string | null>(null)
  const [isEmailVerificationError, setIsEmailVerificationError] = React.useState<boolean>(false)

  // Check for return URL or expired token
  const returnUrl = searchParams.get('returnUrl') ?? config.paths.auth.organizationSelector
  const isExpired = searchParams.get('expired') === 'true'
  const needVerification = searchParams.get('needVerification') === 'true'
  const emailParam = searchParams.get('email')

  // Check if this is coming from an invitation
  const isInvitation = returnUrl?.includes('/invitation/accept')

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: emailParam || '',
      password: '',
      rememberMe: false,
    },
  })

  // Get form methods to use in effect
  const { getValues, setValue } = form

  // Show expired token message or verification message if needed
  React.useEffect(() => {
    if (isExpired) {
      setError('Your session has expired. Please sign in again.')
    }

    // If coming back from verification page or with needVerification flag
    if (needVerification && emailParam) {
      setUnverifiedEmail(emailParam)
      setIsEmailVerificationError(true)
      setError(
        'Please verify your email address before logging in. Check your inbox for a verification link or request a new one.',
      )

      // Pre-fill the email field if it wasn't set in the defaultValues
      if (getValues('email') !== emailParam) {
        setValue('email', emailParam)
      }
    }
  }, [isExpired, needVerification, emailParam, getValues, setValue])

  // Form submit handler
  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const loginResponse = await login({
        email: data.email,
        password: data.password,
      })

      // If this login is from an invitation, redirect to the invitation page
      if (isInvitation) {
        router.push(returnUrl)
        return
      }

      // Check system role from the fresh login response, not context state
      const isAdmin =
        loginResponse?.systemRole === 'Admin' ||
        loginResponse?.systemRole === 'SystemAdmin' ||
        loginResponse?.systemRole === 1

      // Normal redirect if not from invitation
      if (isAdmin) {
        router.push('/dashboard') // Redirect to system admin dashboard
      } else if (returnUrl && !isInvitation) {
        router.push(returnUrl)
      } else {
        router.push('/tenant-selector') // Default redirect to tenant selector
      }
    } catch (error: unknown) {
      let errorMessage = 'Login failed. Please try again.'

      if (typeof error === 'object' && error !== null) {
        const axiosError = error as {
          response?: { data?: { message?: string; code?: string } }
          message?: string
        }
        errorMessage = axiosError.response?.data?.message ?? axiosError.message ?? errorMessage

        // Check if this is an email verification error
        if (
          errorMessage.toLowerCase().includes('verify') ||
          errorMessage.toLowerCase().includes('verification') ||
          errorMessage.toLowerCase().includes('email not verified') ||
          axiosError.response?.data?.code === 'EMAIL_NOT_VERIFIED'
        ) {
          // Set the unverified email and show verification error
          setUnverifiedEmail(data.email)
          setIsEmailVerificationError(true)
          setError(
            'Please verify your email address before logging in. Check your inbox for a verification link or request a new one.',
          )
          return
        }
      }

      // Reset verification error state for other errors
      setIsEmailVerificationError(false)
      setUnverifiedEmail(null)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      {error && (
        <div className="flex items-center gap-3 p-4 mb-2 rounded-lg border border-red-500 dark:border-red-400 bg-red-100 dark:bg-red-950 shadow-sm fade-in">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300">
            <AlertCircle className="w-6 h-6" />
          </span>
          <span className="text-sm font-medium text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}

      {/* Show resend verification button if this is an email verification error */}
      {isEmailVerificationError && unverifiedEmail && (
        <EmailVerificationAlert email={unverifiedEmail} />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="flex justify-between w-full items-center">
                  <FormLabel className="text-sm">Remember me</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    Forgot password?
                  </Link>
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 transition-all duration-300 hover:translate-y-[-2px]"
            disabled={isLoading}
          >
            {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>
    </div>
  )
}
