'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useOrganizationUnits } from '@/hooks/use-organization-units'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, PlusCircle, RefreshCw } from 'lucide-react'
import { CreateOrganizationUnitForm } from '@/components/forms/create-organization-unit-form'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function OrganizationSelectorPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { organizationUnits, isLoading, error, selectOrganizationUnit, refresh } = useOrganizationUnits()
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // If user belongs to only one organization, auto-redirect to it
  useEffect(() => {
    if (!isLoading && organizationUnits.length === 1) {
      selectOrganizationUnit(organizationUnits[0].slug)
    }
  }, [isLoading, organizationUnits, selectOrganizationUnit])

  // Setup visibility change listener for refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Clean up event listener
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refresh])

  // Handle manual refresh with animation
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    // Add a small delay to make the refresh animation visible
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // While everything is loading, show loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Handle successful organization creation
  const handleOrganizationCreated = (slug: string) => {
    refresh() // Refresh the list first (in case user wants to create another)
    selectOrganizationUnit(slug) // Navigate to the newly created organization
  }

  // Show organization selector
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-6 space-y-8">
        {/* Logo and header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            <Image
              src="/logo-oa.png"
              alt="OpenAutomate Logo"
              width={500}
              height={76}
              priority
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="relative h-8 w-8 rounded-full overflow-hidden border">
              <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                {user?.firstName?.[0] ?? user?.email?.[0] ?? 'U'}
              </div>
            </div>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Header with refresh button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Your Organization Units</h2>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleManualRefresh} 
            disabled={isRefreshing || isLoading}
            className="w-8 h-8"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        {organizationUnits.length === 0 ? (
          // No organizations - show empty state
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              You don&apos;t belong to any organization units yet.
            </p>
            <p className="text-muted-foreground">
              Create your first organization to get started.
            </p>
            
            <Card className="p-6 mt-6">
              {showCreateForm ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Create New Organization</h3>
                  <CreateOrganizationUnitForm 
                    onSuccess={handleOrganizationCreated}
                    onCancel={() => setShowCreateForm(false)}
                  />
                </div>
              ) : (
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 transition-all duration-300 hover:translate-y-[-2px]"
                  onClick={() => setShowCreateForm(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Organization
                </Button>
              )}
            </Card>
          </div>
        ) : (
          // Has organizations - show selector
          <>
            {/* Selection instructions */}
            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Choose an organization unit to continue:
              </p>
            </div>

            {/* Organization list */}
            <div className="space-y-4">
              {organizationUnits.map((org) => (
                <Card 
                  key={org.id} 
                  className="hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => selectOrganizationUnit(org.slug)}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-lg">{org.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {org.description || `(${org.slug})`}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Create new organization */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-dashed"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Create a new organization unit to manage your automation processes.
                  </DialogDescription>
                </DialogHeader>
                <CreateOrganizationUnitForm onSuccess={handleOrganizationCreated} />
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-6 p-4 bg-destructive/10 rounded-md text-destructive text-center">
            {error}
          </div>
        )}

        {/* Need to sign in with another account */}
        <div className="mt-8 text-center">
          <Button
            variant="link"
            className="text-primary underline"
            onClick={() => router.push('/login?signout=true')}
          >
            Need to sign in to another account?
          </Button>
        </div>
      </div>
    </div>
  )
} 