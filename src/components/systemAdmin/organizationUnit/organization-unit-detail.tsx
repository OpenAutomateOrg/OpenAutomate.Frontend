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
import { useEffect, useState, useCallback, useRef } from 'react'
import { organizationUnitApi } from '@/lib/api/organization-units'
import { adminApi } from '@/lib/api/admin'
import { getAllBotAgents } from '@/lib/api/bot-agents'
import { getAllAssets } from '@/lib/api/assets'
import { getAllAutomationPackages } from '@/lib/api/automation-packages'
import { organizationUnitUserApi } from '@/lib/api/organization-unit-user'
import type { ReactNode } from 'react'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { useToast } from '@/components/ui/use-toast'
import { formatUtcToLocal } from '@/lib/utils/datetime'

interface OrganizationUnitDetailProps {
  readonly id: string
}

interface DeletionStatus {
  isPendingDeletion?: boolean
  isDeletionPending?: boolean
  remainingSeconds: number | null
  scheduledDeletionAt: string | null
  hoursUntilDeletion?: number
  canCancel: boolean
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

// Loading component
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full py-10">
      <div className="animate-spin text-primary">
        <RefreshCw className="h-10 w-10" />
      </div>
    </div>
  )
}

// Error component
function ErrorState({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
      <p className="text-red-800 dark:text-red-300">Failed to load organization unit details.</p>
      <Button variant="outline" className="mt-2" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

// Deletion status banner component
function DeletionStatusBanner({
  countdown,
  deletionStatusData,
  onCancelClick,
  formatTimeRemaining,
}: {
  readonly countdown: number | null
  readonly deletionStatusData: DeletionStatus | undefined
  readonly onCancelClick: () => void
  readonly formatTimeRemaining: (seconds: number) => string
}) {
  return (
    <div className="flex items-center justify-between dark:bg-orange-950/50 bg-orange-50 border border-orange-300 dark:border-orange-800/50 rounded-lg px-4 py-3">
      <div className="text-orange-700 dark:text-orange-400 font-semibold">
        {typeof countdown === 'number' && countdown > 0
          ? `This organization unit will be deleted in ${formatTimeRemaining(countdown)}`
          : 'Deleting organization unit...'}
      </div>
      {deletionStatusData?.canCancel && (
        <Button
          variant="outline"
          className="ml-4 border-orange-600 text-orange-700 hover:bg-orange-100"
          onClick={onCancelClick}
        >
          Cancel Deletion
        </Button>
      )}
    </div>
  )
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

// Custom hook for deletion status and countdown
function useDeletionStatus(id: string) {
  const countdownInitialized = useRef(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Fetch deletion status from API
  const fetchDeletionStatus = async (): Promise<DeletionStatus> => {
    if (!id) throw new Error('Missing ID')
    const result = await organizationUnitApi.getDeletionStatus(id)
    const status = result as DeletionStatus

    const isPendingDeletion = status.isPendingDeletion ?? status.isDeletionPending ?? false

    let remainingSeconds: number | null = null
    if (typeof status.remainingSeconds === 'number') {
      remainingSeconds = status.remainingSeconds
    } else if (typeof status.hoursUntilDeletion === 'number') {
      remainingSeconds = status.hoursUntilDeletion * 3600
    }

    return {
      isPendingDeletion,
      remainingSeconds,
      scheduledDeletionAt: status.scheduledDeletionAt,
      canCancel: status.canCancel ?? false,
    }
  }

  const { data: deletionStatusData, mutate: mutateDeletionStatus } = useSWR(
    id ? swrKeys.organizationUnitDeletionStatus(id) : null,
    fetchDeletionStatus,
    {
      refreshInterval: 60000,
      refreshWhenHidden: true,
    },
  )

  // Countdown effect
  useEffect(() => {
    if (!deletionStatusData?.isPendingDeletion) {
      setCountdown(null)
      countdownInitialized.current = false
      return
    }

    if (
      !countdownInitialized.current &&
      typeof deletionStatusData.remainingSeconds === 'number' &&
      deletionStatusData.remainingSeconds >= 0
    ) {
      setCountdown(deletionStatusData.remainingSeconds)
      countdownInitialized.current = true
    }

    const interval = setInterval(() => {
      setCountdown((current) => {
        if (current === null || current <= 0) return 0
        return current - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [deletionStatusData?.isPendingDeletion, deletionStatusData?.remainingSeconds])

  return {
    deletionStatusData,
    mutateDeletionStatus,
    countdown,
    showDeletionStatus: Boolean(deletionStatusData?.isPendingDeletion),
  }
}

// Custom hook for organization unit data
function useOrganizationUnitData(id: string) {
  const fetchOrgUnit = useCallback(async () => {
    if (!id) return Promise.reject(new Error('No ID provided'))

    try {
      const allOrgUnits = await adminApi.getAllOrganizationUnits()
      const orgUnit = allOrgUnits.find((unit) => unit.id === id)
      if (!orgUnit) {
        throw new Error(`Organization unit with ID ${id} not found`)
      }
      return orgUnit
    } catch (error) {
      console.error('Failed to fetch organization unit via admin API, trying regular API:', error)
      return organizationUnitApi.getById(id)
    }
  }, [id])

  return useSWR(id ? `organization-unit-${id}` : null, fetchOrgUnit)
}

// Custom hook for fetching statistics data
function useStatisticsData(tenant: string) {
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

  return {
    agentsData,
    agentsLoading,
    assetsData,
    assetsLoading,
    packagesData,
    packagesLoading,
    usersData,
    usersLoading,
    rolesData,
    rolesLoading,
  }
}

export default function OrganizationUnitDetail({ id }: OrganizationUnitDetailProps) {
  const router = useRouter()
  const params = useParams()
  const tenant = params?.tenant as string
  const { toast } = useToast()

  // Use custom hooks
  const { data: orgUnit, error: orgError, isLoading: orgLoading } = useOrganizationUnitData(id)
  const {
    agentsData,
    agentsLoading,
    assetsData,
    assetsLoading,
    packagesData,
    packagesLoading,
    usersData,
    usersLoading,
    rolesData,
    rolesLoading,
  } = useStatisticsData(tenant)

  const { deletionStatusData, mutateDeletionStatus, countdown, showDeletionStatus } =
    useDeletionStatus(id)

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCancelDeletionDialog, setShowCancelDeletionDialog] = useState(false)
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false)
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false)

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

  // Request deletion handler
  const handleRequestDeletion = async () => {
    setIsRequestingDeletion(true)
    try {
      await adminApi.deleteOrganizationUnit(id)
      toast({
        title: 'Success',
        description: `Organization unit "${orgUnit?.name}" has been deleted successfully.`,
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
      setIsRequestingDeletion(false)
      setShowDeleteDialog(false)
    }
  }

  // Cancel deletion handler
  const handleCancelDeletion = async () => {
    setIsCancellingDeletion(true)
    try {
      await organizationUnitApi.cancelDeletion(id)
      await mutateDeletionStatus()
      toast({
        title: 'Deletion Cancelled',
        description: 'Organization unit deletion has been cancelled.',
      })
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel deletion.', variant: 'destructive' })
    } finally {
      setIsCancellingDeletion(false)
      setShowCancelDeletionDialog(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  // Format remaining time
  const formatTimeRemaining = useCallback((seconds: number): string => {
    if (seconds <= 0) return 'Deleting...'
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)
    const remainingSeconds = seconds % 60

    const parts = []
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
    if (remainingSeconds > 0 && parts.length === 0)
      parts.push(`${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`)

    return parts.join(', ')
  }, [])

  if (orgLoading) return <LoadingState />
  if (orgError) return <ErrorState onRetry={() => window.location.reload()} />
  if (!orgUnit) return <div>Organization unit not found</div>

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="border rounded-md shadow-sm">
        <CardHeader className="flex items-center justify-between border-b p-4">
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {!showDeletionStatus && (
            <Button variant="destructive" size="sm" onClick={handleDeleteClick} className="gap-1">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {showDeletionStatus && (
            <DeletionStatusBanner
              countdown={countdown}
              deletionStatusData={deletionStatusData}
              onCancelClick={() => setShowCancelDeletionDialog(true)}
              formatTimeRemaining={formatTimeRemaining}
            />
          )}
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
                {formatUtcToLocal(orgUnit.createdAt)}
              </DetailBlock>

              {orgUnit.updatedAt && (
                <DetailBlock label="Last Updated">
                  {formatUtcToLocal(orgUnit.updatedAt)}
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
              Are you sure you want to delete the organization unit &quot;{orgUnit?.name}&quot;? It
              will be deleted in 7 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isRequestingDeletion}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRequestDeletion}
              disabled={isRequestingDeletion}
              className="gap-1"
            >
              {isRequestingDeletion ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isRequestingDeletion ? 'Processing...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Cancel Deletion Dialog */}
      <Dialog open={showCancelDeletionDialog} onOpenChange={setShowCancelDeletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Deletion</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to cancel the deletion of this organization unit?</div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDeletionDialog(false)}
              disabled={isCancellingDeletion}
            >
              No
            </Button>
            <Button
              onClick={handleCancelDeletion}
              className="bg-[#FF6A1A] text-white hover:bg-orange-500"
              disabled={isCancellingDeletion}
            >
              Cancel Deletion
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
