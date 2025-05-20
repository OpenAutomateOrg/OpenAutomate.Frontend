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
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authApi } from '@/lib/api/auth'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator'

// Password schema with requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  )

// Form validation schema
const formSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof formSchema>

interface ErrorWithMessage {
  message?: string;
  details?: string;
  errors?: Record<string, string | string[]>;
}

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<boolean>(false)
  const [password, setPassword] = React.useState('')

  // Extract token and email from URL
  const rawToken = searchParams?.get('token') || ''
  const email = searchParams?.get('email') || ''
  
  // Process token for proper format
  const [token, setToken] = React.useState('')
  
  React.useEffect(() => {
    if (rawToken) {
      let processedToken = rawToken.trim();
      
      // Remove any spaces
      if (processedToken.includes(' ')) {
        processedToken = processedToken.replace(/\s/g, '');
      }
      
      // Try to URL decode if it appears to be encoded
      try {
        if (processedToken.includes('%')) {
          processedToken = decodeURIComponent(processedToken);
        }
      } catch (e) {
        console.warn('Error decoding token:', e);
      }
      
      setToken(processedToken);
    }
  }, [rawToken]);

  // For client-side form rendering only
  const [isClient, setIsClient] = React.useState(false)
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize form with default empty values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Log token info for debugging
  React.useEffect(() => {
    if (token) {
      console.log('Processed token length:', token.length);
      console.log('Token preview:', token.substring(0, 10) + '...');
    }
    if (email) {
      console.log('Email:', email);
    }
  }, [token, email])

  // Check if token and email are provided
  React.useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. The token or email is missing.')
    } else {
      setError(null)
    }
  }, [token, email])

  // Form submit handler
  async function onSubmit(data: FormData) {
    if (!token) {
      setError('Reset token is missing')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      console.log('Attempting to reset password with token:', token.substring(0, 10) + '...');
      console.log('Form data:', {
        newPassword: data.newPassword ? '[PRESENT]' : '[MISSING]',
        confirmPassword: data.confirmPassword ? '[PRESENT]' : '[MISSING]',
        passwordLength: data.newPassword?.length
      });
      
      // Validate passwords match on client-side as well
      if (data.newPassword !== data.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      
      // Prepare the request data with correct field names
      const requestData = {
        email: email,
        token: token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      };
      
      console.log('Sending reset password request with data:', {
        email: requestData.email,
        tokenLength: requestData.token.length,
        passwordLength: requestData.newPassword?.length || 0,
        confirmPasswordLength: requestData.confirmPassword?.length || 0,
        passwordsMatch: requestData.newPassword === requestData.confirmPassword
      });
      
      await authApi.resetPassword(requestData);
      
      console.log('Password reset successful');
      setSuccess(true)
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: unknown) {
      console.error('Password reset failed', err)
      
      let errorMessage = 'Password reset failed. The token may be invalid or expired.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Error instance message:', err.message);
      } else if (typeof err === 'object' && err !== null) {
        console.error('Error object:', JSON.stringify(err, null, 2));
        
        const errObj = err as ErrorWithMessage;
        if (errObj.message) {
          errorMessage = errObj.message;
          console.error('Error message from object:', errObj.message);
        } else if (errObj.details) {
          errorMessage = errObj.details;
          console.error('Error details from object:', errObj.details);
        } else if (errObj.errors) {
          // Extract validation errors
          console.error('Validation errors object:', errObj.errors);
          const validationErrors = Object.entries(errObj.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage = `Validation errors: ${validationErrors}`;
        }
      }
      
      console.error('Final error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render form during SSR to prevent hydration issues
  if (!isClient) {
    return (
      <div className="flex justify-center py-8">
        <Icons.Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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
            Your password has been reset successfully! You will be redirected to the login page.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" suppressHydrationWarning>
          <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-sm text-gray-600 mb-0">Resetting password for: <span className="font-medium">{email}</span></p>
          </div>
          
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setPassword(e.target.value);
                    }}
                    disabled={isLoading || success || !token}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Use 8+ characters with a mix of uppercase, lowercase, numbers & symbols.
                </FormDescription>
                <PasswordStrengthIndicator password={password} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                    disabled={isLoading || success || !token}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 transition-all duration-300 hover:translate-y-[-2px]"
            disabled={isLoading || success || !token || !email}
          >
            {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
            {success ? 'Password Reset' : 'Reset Password'}
          </Button>
        </form>
      </Form>
    </div>
  )
} 