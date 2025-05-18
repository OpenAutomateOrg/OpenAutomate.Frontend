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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/providers/auth-provider'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { config } from '@/lib/config'

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

  // Check for return URL or expired token
  const returnUrl = searchParams.get('returnUrl') ?? config.paths.auth.organizationSelector
  const isExpired = searchParams.get('expired') === 'true'

  // Show expired token message if needed
  React.useEffect(() => {
    if (isExpired) {
      setError('Your session has expired. Please sign in again.')
    }
  }, [isExpired])

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Form submit handler
  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      })
      router.push(returnUrl)
    } catch (err: unknown) {
      console.error('Login failed', err)
      setError(err instanceof Error ? err.message : (authError ?? 'Invalid email or password'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
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
                  <Input
                    type="password"
                    placeholder="••••••••"
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
                <div className="space-y-1 leading-none">
                  <FormLabel>Remember me</FormLabel>
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
