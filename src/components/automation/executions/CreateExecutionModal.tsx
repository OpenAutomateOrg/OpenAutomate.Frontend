'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { createErrorToast } from '@/lib/utils/error-utils'
import { getAllAutomationPackages, AutomationPackageResponseDto } from '@/lib/api/automation-packages'
import { getAllBotAgents, BotAgentResponseDto } from '@/lib/api/bot-agents'
import { triggerExecution, TriggerExecutionDto } from '@/lib/api/executions'

const createExecutionSchema = z.object({
  packageId: z.string().min(1, 'Package is required'),
  version: z.string().min(1, 'Version is required'),
  botAgentId: z.string().min(1, 'Agent is required'),
})

type CreateExecutionFormData = z.infer<typeof createExecutionSchema>

interface CreateExecutionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateExecutionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateExecutionModalProps) {
  const { toast } = useToast()
  const [packages, setPackages] = useState<AutomationPackageResponseDto[]>([])
  const [agents, setAgents] = useState<BotAgentResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateExecutionFormData>({
    resolver: zodResolver(createExecutionSchema),
    defaultValues: {
      packageId: '',
      version: '',
      botAgentId: '',
    },
  })

  const selectedPackageId = form.watch('packageId')
  const selectedPackage = packages.find(p => p.id === selectedPackageId)
  const availableVersions = selectedPackage?.versions || []

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [packagesData, agentsData] = await Promise.all([
        getAllAutomationPackages(),
        getAllBotAgents(),
      ])

      // Filter active packages and agents by status only (not isActive)
      setPackages(packagesData.filter(p => p.isActive))
      setAgents(agentsData.filter(a => a.status !== 'Disconnected'))
    } catch (error) {
      console.error('Error loading data:', error)
      toast(createErrorToast(error))
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Load packages and agents when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, loadData])

  // Reset version when package changes
  useEffect(() => {
    if (selectedPackageId) {
      form.setValue('version', '')
    }
  }, [selectedPackageId, form])

  const onSubmit = async (data: CreateExecutionFormData) => {
    setIsSubmitting(true)
    try {
      // Validate agent status
      const selectedAgent = agents.find(a => a.id === data.botAgentId)
      if (!selectedAgent) {
        toast({
          variant: 'destructive',
          title: 'Agent Not Found',
          description: 'Selected agent not found',
        })
        return
      }

      if (selectedAgent.status === 'Disconnected') {
        toast({
          variant: 'destructive',
          title: 'Agent Disconnected',
          description: 'Selected agent is disconnected and cannot execute packages',
        })
        return
      }

      // Warn if agent is busy but still allow execution
      if (selectedAgent.status === 'Busy') {
        toast({
          title: 'Agent Busy',
          description: 'Selected agent is currently busy. The execution will be queued.',
        })
      }

      // Validate package and version exist
      const selectedPackage = packages.find(p => p.id === data.packageId)
      const selectedVersion = selectedPackage?.versions.find(v => v.versionNumber === data.version)
      
      if (!selectedPackage || !selectedVersion) {
        toast({
          variant: 'destructive',
          title: 'Invalid Selection',
          description: 'Invalid package or version selected',
        })
        return
      }

      // Check if package version is active
      if (!selectedVersion.isActive) {
        toast({
          variant: 'destructive',
          title: 'Version Inactive',
          description: 'Selected package version is not active',
        })
        return
      }

      const executionData: TriggerExecutionDto = {
        botAgentId: data.botAgentId,
        packageId: data.packageId,
        packageName: selectedPackage.name,
        version: data.version,
      }

      const result = await triggerExecution(executionData)
      
      toast({
        title: 'Execution Started',
        description: `Execution started successfully (ID: ${result.id.substring(0, 8)}...)`,
      })
      form.reset()
      onClose()
      onSuccess?.()
    } catch (error: unknown) {
      console.error('Error triggering execution:', error)

      // Handle specific error types
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as { response?: { status?: number } }
        if (httpError.response?.status === 403) {
          toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'You do not have permission to create executions',
          })
        } else if (httpError.response?.status === 404) {
          toast({
            variant: 'destructive',
            title: 'Not Found',
            description: 'Selected package or agent not found',
          })
        } else if (httpError.response?.status === 400) {
          toast({
            variant: 'destructive',
            title: 'Agent Busy',
            description: 'Agent is currently busy with another execution',
          })
        } else {
          toast(createErrorToast(error))
        }
      } else {
        toast(createErrorToast(error))
      }
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Create New Execution
          </DialogTitle>
          <DialogDescription>
            Select a package, version, and agent to execute immediately.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading packages and agents...</span>
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
                    <FormLabel>Package</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a package" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            <div className="flex flex-col">
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
                    <FormLabel>Version</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedPackageId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a version" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableVersions.map((version) => (
                          <SelectItem key={version.id} value={version.versionNumber}>
                            <div className="flex flex-col">
                              <span className="font-medium">v{version.versionNumber}</span>
                              <span className="text-sm text-muted-foreground">
                                Uploaded {new Date(version.uploadedAt).toLocaleDateString()}
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
                    <FormLabel>Agent</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an agent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-col">
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
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Execution
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