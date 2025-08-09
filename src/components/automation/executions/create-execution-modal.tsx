'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2, Play } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import useSWR from 'swr'
import { swrKeys } from '@/lib/config/swr-config'
import { getAllAutomationPackages } from '@/lib/api/automation-packages'
import { formatUtcToLocal } from '@/lib/utils/datetime'
import { getAllBotAgents, BotAgentResponseDto } from '@/lib/api/bot-agents'
import { triggerExecution, TriggerExecutionDto } from '@/lib/api/executions'
import { useLocale } from '@/providers/locale-provider'

const createExecutionSchema = z.object({
  packageId: z.string().min(1, 'Package is required'),
  version: z.string().min(1, 'Version is required'),
  botAgentId: z.string().min(1, 'Agent is required'),
})

type CreateExecutionFormData = z.infer<typeof createExecutionSchema>

interface CreateExecutionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newExecution?: { id: string; packageName: string; botAgentName: string }) => void
}

export default function CreateExecutionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateExecutionModalProps) {
  const { t } = useLocale()
  const { toast } = useToast()

  // SWR for data fetching - replaces manual state management
  const { data: packages, error: packagesError } = useSWR(
    isOpen ? swrKeys.packages() : null, // Only fetch when modal is open
    getAllAutomationPackages,
  )

  const { data: agents, error: agentsError } = useSWR(
    isOpen ? swrKeys.agents() : null, // Only fetch when modal is open
    getAllBotAgents,
  )

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Derive filtered data during render (following guideline #1)
  const filteredPackages = useMemo(() => packages?.filter((p) => p.isActive) ?? [], [packages])

  const filteredAgents = useMemo(
    () => agents?.filter((a) => a.status !== 'Disconnected') ?? [],
    [agents],
  )

  // Combined loading state
  const isLoading = !packages || !agents

  const form = useForm<CreateExecutionFormData>({
    resolver: zodResolver(createExecutionSchema),
    defaultValues: {
      packageId: '',
      version: '',
      botAgentId: '',
    },
  })

  const selectedPackageId = form.watch('packageId')
  const selectedPackage = packages?.find((p) => p.id === selectedPackageId)
  const availableVersions = selectedPackage?.versions || []

  // SWR errors are now handled automatically by the global error handler
  // Log errors for debugging purposes only
  useEffect(() => {
    if (packagesError) {
      console.error('Error loading packages:', packagesError)
    }
    if (agentsError) {
      console.error('Error loading agents:', agentsError)
    }
  }, [packagesError, agentsError])

  // Reset version when package changes
  // Client-only: Requires form state manipulation
  useEffect(() => {
    if (selectedPackageId) {
      form.setValue('version', '')
    }
  }, [selectedPackageId, form])

  // Helper function to validate agent
  const validateAgent = (agentId: string): BotAgentResponseDto | null => {
    const selectedAgent = agents?.find((a) => a.id === agentId)

    if (!selectedAgent) {
      toast({
        variant: 'destructive',
        title: 'Agent Not Found',
        description: 'Selected agent not found',
      })
      return null
    }

    if (selectedAgent.status === 'Disconnected') {
      toast({
        variant: 'destructive',
        title: 'Agent Disconnected',
        description: 'Selected agent is disconnected and cannot execute packages',
      })
      return null
    }

    // Warn if agent is busy but still allow execution
    if (selectedAgent.status === 'Busy') {
      toast({
        title: 'Agent Busy',
        description: 'Selected agent is currently busy. The execution will be queued.',
      })
    }

    return selectedAgent
  }

  // Helper function to validate package and version
  const validatePackageAndVersion = (packageId: string, version: string) => {
    const selectedPackage = packages?.find((p) => p.id === packageId)
    const selectedVersion = selectedPackage?.versions.find((v) => v.versionNumber === version)

    if (!selectedPackage || !selectedVersion) {
      toast({
        variant: 'destructive',
        title: 'Invalid Selection',
        description: 'Invalid package or version selected',
      })
      return null
    }

    if (!selectedVersion.isActive) {
      toast({
        variant: 'destructive',
        title: 'Version Inactive',
        description: 'Selected package version is not active',
      })
      return null
    }

    return { selectedPackage, selectedVersion }
  }

  // Simple error logging - API errors are handled globally
  const handleExecutionError = (error: unknown) => {
    console.error('Error triggering execution:', error)
    // Global error handler will show appropriate toast notification
  }

  const onSubmit = async (data: CreateExecutionFormData) => {
    setIsSubmitting(true)
    try {
      // Validate agent
      const validatedAgent = validateAgent(data.botAgentId)
      if (!validatedAgent) return

      // Validate package and version
      const validation = validatePackageAndVersion(data.packageId, data.version)
      if (!validation) return

      const { selectedPackage } = validation

      const executionData: TriggerExecutionDto = {
        botAgentId: data.botAgentId,
        packageId: data.packageId,
        packageName: selectedPackage.name,
        version: data.version,
      }

      const result = await triggerExecution(executionData)

      toast({
        title: t('executions.modal.executionStarted'),
        description: `${t('executions.modal.executionStartedDesc')} (ID: ${result.id.substring(0, 8)}...)`,
      })
      form.reset()
      onClose()

      // ✅ Pass execution details to callback for optimistic update
      onSuccess?.({
        id: result.id,
        packageName: selectedPackage.name,
        botAgentName: validatedAgent.name,
      })
    } catch (error: unknown) {
      handleExecutionError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[70vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {t('executions.modal.title')}
          </DialogTitle>
          <DialogDescription>{t('executions.modal.description')}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{t('executions.modal.loading')}</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Package Selection */}
              <FormField
                control={form.control}
                name="packageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('executions.modal.package')}</FormLabel>
                    <Select data-size="sm" onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full py-8">
                          <SelectValue placeholder={t('executions.modal.selectPackage')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredPackages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            <div className="flex flex-col text-left">
                              <span className="font-medium">{pkg.name}</span>
                              {pkg.description && (
                                <span className="text-sm text-muted-foreground">
                                  {pkg.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Version Selection */}
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('executions.modal.version')}</FormLabel>
                    <Select
                      data-size="sm"
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedPackageId}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full py-8">
                          <SelectValue placeholder={t('executions.modal.selectVersion')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableVersions.map((version) => (
                          <SelectItem key={version.id} value={version.versionNumber}>
                            <div className="flex flex-col text-left">
                              <span className="font-medium">v{version.versionNumber}</span>
                              <span className="text-sm text-muted-foreground">
                                {t('executions.modal.uploaded')}{' '}
                                {formatUtcToLocal(version.uploadedAt, {
                                  dateStyle: 'medium',
                                  timeStyle: undefined,
                                  fallback: t('executions.modal.unknownDate'),
                                })}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Agent Selection */}
              <FormField
                control={form.control}
                name="botAgentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('executions.modal.agent')}</FormLabel>
                    <Select data-size="sm" onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full py-8">
                          <SelectValue placeholder={t('executions.modal.selectAgent')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-col text-left">
                                <span className="font-medium">{agent.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {agent.machineName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    agent.status === 'Available'
                                      ? 'bg-green-500'
                                      : agent.status === 'Busy'
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                  }`}
                                />
                                <span
                                  className={`text-xs font-medium ${
                                    agent.status === 'Available'
                                      ? 'text-green-600'
                                      : agent.status === 'Busy'
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                  }`}
                                >
                                  {agent.status}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t('executions.modal.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('executions.modal.starting')}
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      {t('executions.modal.startExecution')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
