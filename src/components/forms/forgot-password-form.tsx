'use client'

import * as React from 'react'
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
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authApi } from '@/lib/api/auth'

// Form validation schema
const formSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type FormData = z.infer<typeof formSchema>

interface ErrorWithMessage {
  message?: string
  details?: string
}

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<boolean>(false)

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  // Form submit handler
  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await authApi.forgotPassword({
        email: data.email,
      })

      // Show success message
      setSuccess(true)

      // Clear form
      form.reset()
    } catch (err: unknown) {
      console.error('Forgot password request failed', err)

      // Extract error message from different types of errors
      let errorMessage = 'Failed to send password reset email. Please try again later.'

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        // Try to get message from error object
        const errObj = err as ErrorWithMessage
        if (errObj.message) {
          errorMessage = errObj.message
        } else if (errObj.details) {
          errorMessage = errObj.details
        }
      }

      setError(errorMessage)
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

      {success && (
        <Alert variant="success" className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            Password reset instructions have been sent to your email. Please check your inbox.
          </AlertDescription>
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
                    disabled={isLoading || success}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 transition-all duration-300 hover:translate-y-[-2px]"
            disabled={isLoading || success}
          >
            {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
            {success ? 'Email Sent' : 'Send Reset Link'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
