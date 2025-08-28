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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

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
  const { login, error: authError } = useAuth()
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
  // Helper: determine default redirect after login
  function handleRedirectAfterLogin(
    loginResponse: { systemRole?: string | number } | undefined | void,
  ) {
    const isAdmin =
      loginResponse?.systemRole === 'Admin' ||
      loginResponse?.systemRole === 'SystemAdmin' ||
      loginResponse?.systemRole === 1

    if (isInvitation) {
      router.push(returnUrl)
      return
    }

    if (isAdmin) {
      router.push('/dashboard')
      return
    }

    if (returnUrl) {
      router.push(returnUrl)
      return
    }

    router.push('/tenant-selector')
  }

  // Helper: check if an error indicates email verification required
  function isVerificationError(errMsg: string, code?: string | undefined): boolean {
    const lower = (errMsg || '').toLowerCase()
    return (
      lower.includes('verify') ||
      lower.includes('verification') ||
      lower.includes('email not verified') ||
      code === 'EMAIL_NOT_VERIFIED'
    )
  }

  // Helper: map backend errors to form fields and return a display message
  function normalizeAndMapErrors(error: unknown): string {
    let message = 'Login failed. Please try again.'

    if (typeof error !== 'object' || error === null) return message

    const axiosError = error as {
      response?: {
        data?: {
          message?: string
          code?: string
          errors?: Record<string, string | string[]>
        }
      }
      message?: string
    }

    message = axiosError.response?.data?.message ?? axiosError.message ?? message

    const fieldErrors = axiosError.response?.data?.errors
    if (fieldErrors) {
      const emailErr = fieldErrors['email'] || fieldErrors['Email']
      const passwordErr = fieldErrors['password'] || fieldErrors['Password']
      if (emailErr) {
        const msg = Array.isArray(emailErr) ? emailErr.join(', ') : emailErr
        form.setError('email', { type: 'server', message: msg })
      }
      if (passwordErr) {
        const msg = Array.isArray(passwordErr) ? passwordErr.join(', ') : passwordErr
        form.setError('password', { type: 'server', message: msg })
      }
    } else {
      const lowerMsg = (message || '').toLowerCase()
      if (
        axiosError.response?.data?.code === 'EMAIL_NOT_FOUND' ||
        lowerMsg.includes('email not found') ||
        lowerMsg.includes('user not found')
      ) {
        form.setError('email', { type: 'server', message })
        form.setFocus('email')
      } else if (
        axiosError.response?.data?.code === 'INCORRECT_PASSWORD' ||
        lowerMsg.includes('incorrect password') ||
        lowerMsg.includes('invalid credentials')
      ) {
        form.setError('password', { type: 'server', message })
      }
    }

    return message
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const loginResponse = await login({
        email: data.email,
        password: data.password,
      })

      handleRedirectAfterLogin(loginResponse)
    } catch (error: unknown) {
      const axiosErr = (error as { response?: { data?: { code?: string } } }) || {}
      const message = normalizeAndMapErrors(error)

      if (isVerificationError(message, axiosErr.response?.data?.code)) {
        setUnverifiedEmail(data.email)
        setIsEmailVerificationError(true)
        setError(
          'Please verify your email address before logging in. Check your inbox for a verification link or request a new one.',
        )
        return
      }

      setIsEmailVerificationError(false)
      setUnverifiedEmail(null)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const displayError = error || authError || null

  return (
    <div className="grid gap-6">
      {displayError && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Login failed</AlertTitle>
          <AlertDescription className="text-sm">{displayError}</AlertDescription>
        </Alert>
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
