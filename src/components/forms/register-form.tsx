'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { organizationInvitationsApi } from '@/lib/api/organization-unit-invitations'

// Form validation schema
const formSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      ),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof formSchema>

export function RegisterForm() {
  const router = useRouter()
  const { register, error } = useAuth()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [registerError, setRegisterError] = React.useState<string | null>(null)

  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

  // Check if this is coming from an invitation
  const isInvitation = returnUrl?.includes('/invitation/accept')

  // Function to extract token and tenant from return URL
  const extractInvitationParams = () => {
    if (!returnUrl) return { token: null, tenant: null }

    try {
      // Create URL object to parse components
      const url = new URL(returnUrl, window.location.origin)
      const token = url.searchParams.get('token')

      // Extract tenant from path pattern /[tenant]/invitation/accept
      const pathParts = url.pathname.split('/')
      const tenant = pathParts[1] // First segment after leading slash

      return { token, tenant }
    } catch (error) {
      console.error('Error parsing return URL:', error)
      return { token: null, tenant: null }
    }
  }

  // Function to accept invitation after registration
  const acceptInvitationAfterRegister = async () => {
    try {
      const { token, tenant } = extractInvitationParams()

      if (token && tenant) {
        await organizationInvitationsApi.acceptInvitation(tenant, token)
        // Redirect to organization dashboard
        router.push(`/${tenant}/dashboard`)
        return true
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
    }
    return false
  }

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Form submit handler
  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setRegisterError(null)

    try {
      await register({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      })

      // If this registration is from an invitation, process the invitation
      if (isInvitation) {
        const accepted = await acceptInvitationAfterRegister()
        if (accepted) return // If accepted and redirected, we're done
      }

      // Redirect to verification pending page with returnUrl for later use
      const params = new URLSearchParams({ email: data.email })
      if (returnUrl) params.append('returnUrl', returnUrl)
      const verificationUrl = `/verification-pending?${params.toString()}`
      router.push(verificationUrl)
    } catch (error: unknown) {
      console.error('Registration failed', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
      setRegisterError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {(registerError || error) && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{registerError ?? error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                </FormControl>
                <FormDescription className="text-xs">
                  Use 8+ characters with a mix of uppercase, lowercase, numbers & symbols.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full transition-all duration-300 hover:translate-y-[-2px]"
            disabled={isLoading}
          >
            {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </Form>
    </div>
  )
}
