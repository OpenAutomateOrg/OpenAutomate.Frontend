'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { swrKeys, createSWRErrorMessage } from '@/lib/config/swr-config'
import { useParams, useRouter } from 'next/navigation'
import {
  Download,
  Upload,
  Trash2,
  Calendar,
  Package,
  FileText,
  HardDrive,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import {
  PackageVersionResponseDto,
  getAutomationPackageById,
  getPackageDownloadUrl,
  deleteAutomationPackage,
  deletePackageVersion,
} from '@/lib/api/automation-packages'
import { createErrorToast } from '@/lib/utils/error-utils'

export default function PackageDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const packageId = params.id as string

  // ✅ SWR for data fetching - following guideline #8: use framework-level loaders
  const {
    data: packageData,
    error,
    isLoading,
    mutate,
  } = useSWR(packageId ? swrKeys.packageById(packageId) : null, () =>
    getAutomationPackageById(packageId),
  )

  // UI state
  const [downloadingVersion, setDownloadingVersion] = useState<string | null>(null)

  // ✅ Error handling in dedicated effect (guideline #3)
  // Client-only: Requires toast notifications for user feedback
  useEffect(() => {
    if (error) {
      console.error('Failed to load package details:', error)
      toast({
        title: 'Error',
        description: createSWRErrorMessage(error),
        variant: 'destructive',
      })
    }
  }, [error, toast])

  const handleDownloadVersion = async (version: PackageVersionResponseDto) => {
    try {
      setDownloadingVersion(version.versionNumber)
      const response = await getPackageDownloadUrl(packageId, version.versionNumber)

      // Open download URL in new tab
      window.open(response.downloadUrl, '_blank')

      // Success toast
      toast({
        title: 'Download Started',
        description: `Downloading ${version.fileName}`,
        variant: 'default',
      })
    } catch (err) {
      console.error('Error downloading package:', err)
      toast(createErrorToast(err))
    } finally {
      setDownloadingVersion(null)
    }
  }

  const handleDeleteVersion = async (version: PackageVersionResponseDto) => {
    if (!confirm(`Are you sure you want to delete version ${version.versionNumber}?`)) {
      return
    }

    try {
      await deletePackageVersion(packageId, version.versionNumber)
      mutate() // ✅ Use SWR's mutate for cache invalidation

      // Success toast
      toast({
        title: 'Version Deleted',
        description: `Version ${version.versionNumber} has been deleted successfully`,
        variant: 'default',
      })
    } catch (err) {
      console.error('Error deleting version:', err)
      toast(createErrorToast(err))
    }
  }

  const handleDeletePackage = async () => {
    if (!confirm(`Are you sure you want to delete this package and all its versions?`)) {
      return
    }

    try {
      await deleteAutomationPackage(packageId)

      // Success toast
      toast({
        title: 'Package Deleted',
        description: `Package "${packageData?.name}" has been deleted successfully`,
        variant: 'default',
      })

      router.back()
    } catch (err) {
      console.error('Error deleting package:', err)
      toast(createErrorToast(err))
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  // ✅ Loading state handling
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading package details...</span>
        </div>
      </div>
    )
  }

  // ✅ Error state handling - note: errors are also handled via toast in useEffect
  if (error && !packageData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            {createSWRErrorMessage(error) ?? 'Package not found'}
            <Button variant="outline" size="sm" className="ml-2" onClick={() => mutate()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Handle case where package is not found
  if (!packageData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Package not found
            <Button variant="outline" size="sm" className="ml-2" onClick={() => mutate()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const sortedVersions = [...packageData.versions].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{packageData.name}</h1>
            <p className="text-muted-foreground">{packageData.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={packageData.isActive ? 'default' : 'secondary'}>
            {packageData.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button variant="destructive" onClick={handleDeletePackage}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Package
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Package Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Package Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm text-muted-foreground">{packageData.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground">{packageData.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(packageData.createdAt)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Versions</label>
                <p className="text-sm text-muted-foreground">{packageData.versions.length}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Badge variant={packageData.isActive ? 'default' : 'secondary'}>
                  {packageData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Versions List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Package Versions
                </div>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Version
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedVersions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No versions uploaded yet
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedVersions.map((version, index) => (
                    <div key={version.id}>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <Badge variant={index === 0 ? 'default' : 'secondary'}>
                                v{version.versionNumber}
                              </Badge>
                              {index === 0 && <Badge variant="outline">Latest</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{version.fileName}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <HardDrive className="h-4 w-4 mr-1" />
                              {formatFileSize(version.fileSize)}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(version.uploadedAt)}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadVersion(version)}
                              disabled={downloadingVersion === version.versionNumber}
                            >
                              {downloadingVersion === version.versionNumber ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteVersion(version)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {index < sortedVersions.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
