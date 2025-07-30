'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { organizationUnitApi } from '@/lib/api/organization-units'
import { cn } from '@/lib/utils/utils'
import { mutate } from 'swr'
import { swrKeys } from '@/lib/config/swr-config'

// Form validation schema
const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CreateOrganizationUnitFormProps {
  readonly onSuccess?: (slug: string) => void
  readonly onCancel?: () => void
}

export function CreateOrganizationUnitForm({
  onSuccess,
  onCancel,
}: CreateOrganizationUnitFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  // Form submit handler
  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await organizationUnitApi.create({
        name: data.name,
        description: data.description,
      })

      // Invalidate relevant SWR cache keys to ensure fresh data is fetched
      // This ensures subscription status and user profile are up-to-date
      await mutate(swrKeys.subscription())
      await mutate('user-profile') // Cache key for user profile
      await mutate(swrKeys.organizationUnits())

      // Call onSuccess callback with the new organization slug
      if (onSuccess) {
        onSuccess(result.slug)
      } else {
        // If no callback is provided, redirect to the new org dashboard
        router.push(`/${result.slug}/tenant-selector`)
      }
    } catch (err: unknown) {
      console.error('Organization unit creation failed', err)
      setError(
        err instanceof Error ? err.message : 'Failed to create organization. Please try again.',
      )
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Organization" {...field} disabled={isLoading} />
                </FormControl>
                <FormDescription>This will be the name of your new organization.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <textarea
                    placeholder="A brief description of your organization"
                    {...field}
                    disabled={isLoading}
                    className={cn(
                      'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                      'resize-none',
                    )}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700 transition-all duration-300 hover:translate-y-[-2px]"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
