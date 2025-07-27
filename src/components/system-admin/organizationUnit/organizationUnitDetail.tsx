'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, RefreshCw, Users, Bot, Package, Shield, Laptop, Trash2 } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useCallback, useState } from 'react'
import { organizationUnitApi } from '@/lib/api/organization-units'
import { adminApi } from '@/lib/api/admin'
import { getAllBotAgents } from '@/lib/api/bot-agents'
import { getAllAssets } from '@/lib/api/assets'
import { getAllAutomationPackages } from '@/lib/api/automation-packages'
import { organizationUnitUserApi } from '@/lib/api/organization-unit-user'
import type { ReactNode } from 'react'
import useSWR from 'swr'
import { useToast } from '@/components/ui/use-toast'

interface OrganizationUnitDetailProps {
  readonly id: string
}

interface DetailBlockProps {
  readonly label: string
  readonly children?: ReactNode
}

interface StatCardProps {
  readonly title: string
  readonly count: number | undefined
  readonly icon: ReactNode
  readonly isLoading: boolean
}

// Component for displaying statistics cards
function StatCard({ title, count, icon, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <div className="animate-pulse bg-muted h-8 w-12 rounded"></div>
              ) : (
                (count ?? 0)
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrganizationUnitDetail({ id }: OrganizationUnitDetailProps) {
  const router = useRouter()
  const params = useParams()
  const tenant = params?.tenant as string
  const { toast } = useToast()

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Memoized fetcher functions to prevent re-renders
  const fetchOrgUnit = useCallback(async () => {
    if (!id) return Promise.reject('No ID provided')

    // For system admin, use admin API to get all org units and find the specific one
    try {
      const allOrgUnits = await adminApi.getAllOrganizationUnits()
      const orgUnit = allOrgUnits.find((unit) => unit.id === id)
      if (!orgUnit) {
        throw new Error(`Organization unit with ID ${id} not found`)
      }
      return orgUnit
    } catch (error) {
      console.error('Failed to fetch organization unit via admin API, trying regular API:', error)
      // Fallback to regular API if admin API fails
      return organizationUnitApi.getById(id)
    }
  }, [id])

  const fetchAgentsCount = useCallback(async () => {
    const agents = await getAllBotAgents()
    return { length: agents.length, data: agents }
  }, [])

  const fetchAssetsCount = useCallback(async () => {
    const assets = await getAllAssets()
    return { length: assets.length, data: assets }
  }, [])

  const fetchPackagesCount = useCallback(async () => {
    const packages = await getAllAutomationPackages()
    return { length: packages.length, data: packages }
  }, [])

  const fetchUsersCount = useCallback(async () => {
    if (!tenant) return { length: 0, data: [] }
    const users = await organizationUnitUserApi.getUsers(tenant)
    return { length: users.length, data: users }
  }, [tenant])

  const fetchRolesCount = useCallback(async () => {
    if (!tenant) return { length: 0, data: [] }
    const roles = await organizationUnitUserApi.getRolesInOrganizationUnit(tenant)
    return { length: roles.length, data: roles }
  }, [tenant])

  // ✅ SWR for organization unit data
  const {
    data: orgUnit,
    error: orgError,
    isLoading: orgLoading,
  } = useSWR(id ? `organization-unit-${id}` : null, fetchOrgUnit)

  // ✅ SWR for counts
  const { data: agentsData, isLoading: agentsLoading } = useSWR(
    tenant ? `agents-count-${tenant}` : null,
    fetchAgentsCount,
  )

  const { data: assetsData, isLoading: assetsLoading } = useSWR(
    tenant ? `assets-count-${tenant}` : null,
    fetchAssetsCount,
  )

  const { data: packagesData, isLoading: packagesLoading } = useSWR(
    tenant ? `packages-count-${tenant}` : null,
    fetchPackagesCount,
  )

  const { data: usersData, isLoading: usersLoading } = useSWR(
    tenant ? `users-count-${tenant}` : null,
    fetchUsersCount,
  )

  const { data: rolesData, isLoading: rolesLoading } = useSWR(
    tenant ? `roles-count-${tenant}` : null,
    fetchRolesCount,
  )

  // ✅ Handle SWR errors
  useEffect(() => {
    if (orgError) {
      console.error('Failed to load organization unit details:', orgError)
      toast({
        title: 'Error',
        description: 'Failed to load organization unit details.',
        variant: 'destructive',
      })
    }
  }, [orgError, toast])

  const handleBack = () => {
    router.back()
  }

  const handleDelete = async () => {
    if (!orgUnit) return

    setIsDeleting(true)
    try {
      await adminApi.deleteOrganizationUnit(id)
      toast({
        title: 'Success',
        description: `Organization unit "${orgUnit.name}" has been deleted successfully.`,
      })
      // Navigate back to organization units list
      router.push('/system-admin/org-unit-management')
    } catch (error) {
      console.error('Failed to delete organization unit:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete organization unit. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
  }

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-full py-10">
        <div className="animate-spin text-primary">
          <RefreshCw className="h-10 w-10" />
        </div>
      </div>
    )
  }

  if (orgError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
        <p className="text-red-800 dark:text-red-300">Failed to load organization unit details.</p>
        <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!orgUnit) {
    return <div>Organization unit not found</div>
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="border rounded-md shadow-sm">
        <CardHeader className="flex items-center justify-between border-b p-4">
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteClick} className="gap-1">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Organization Unit Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <DetailBlock label="Name">{orgUnit.name}</DetailBlock>
              <DetailBlock label="Description">
                {orgUnit.description || 'No description'}
              </DetailBlock>
            </div>
            <div className="space-y-4">
              <DetailBlock label="Slug">{orgUnit.slug}</DetailBlock>
              <DetailBlock label="Status">
                <Badge
                  variant="outline"
                  className={
                    orgUnit.isActive
                      ? 'bg-green-100 text-green-600 border-none'
                      : 'bg-red-100 text-red-600 border-none'
                  }
                >
                  {orgUnit.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </DetailBlock>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-6">Organization Statistics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard
                title="Total Agents"
                count={agentsData?.length}
                icon={<Bot className="h-5 w-5 text-primary" />}
                isLoading={agentsLoading}
              />

              <StatCard
                title="Total Assets"
                count={assetsData?.length}
                icon={<Laptop className="h-5 w-5 text-primary" />}
                isLoading={assetsLoading}
              />

              <StatCard
                title="Total Users"
                count={usersData?.length}
                icon={<Users className="h-5 w-5 text-primary" />}
                isLoading={usersLoading}
              />

              <StatCard
                title="Total Packages"
                count={packagesData?.length}
                icon={<Package className="h-5 w-5 text-primary" />}
                isLoading={packagesLoading}
              />

              <StatCard
                title="Total Roles"
                count={rolesData?.length}
                icon={<Shield className="h-5 w-5 text-primary" />}
                isLoading={rolesLoading}
              />
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Additional Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailBlock label="Created At">
                {new Date(orgUnit.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </DetailBlock>

              {orgUnit.updatedAt && (
                <DetailBlock label="Last Updated">
                  {new Date(orgUnit.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </DetailBlock>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the organization unit &quot;{orgUnit?.name}&quot;?
              This action cannot be undone and will permanently remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-1"
            >
              {isDeleting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? 'Deleting...' : 'Delete Organization Unit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Block hiển thị label trên, value dưới, có border-b
function DetailBlock({ label, children }: DetailBlockProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="text-base font-medium pb-1 border-b">{children}</div>
    </div>
  )
}
