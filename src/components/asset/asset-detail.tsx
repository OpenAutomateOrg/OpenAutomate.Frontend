'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, Eye, EyeOff, Key, FileText, User, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { swrKeys, createSWRErrorMessage } from '@/lib/config/swr-config'
import { useToast } from '@/components/ui/use-toast'
import {
  getAssetDetail,
  getAssetAgents,
  type AssetDetailDto,
  type BotAgentSummaryDto,
} from '@/lib/api/assets'
import { formatUtcToLocal } from '@/lib/utils/datetime'

interface AssetDetailProps {
  readonly id: string
}

// Helper component for displaying asset value with secret toggle
const AssetValueDisplay = ({
  asset,
  showSecret,
  onToggleSecret,
}: {
  asset: AssetDetailDto
  showSecret: boolean
  onToggleSecret: () => void
}) => {
  // Check if type is String (handle both number 0 and string "String")
  if (asset.type === 0 || asset.type === '0' || asset.type === 'String') {
    return <div className="text-base font-semibold border-b pb-1">{asset.value ?? '-'}</div>
  }

  return (
    <div className="flex items-center gap-2 border-b pb-1">
      <span className="text-base font-semibold">
        {showSecret ? (asset.value ?? '-') : '••••••••'}
      </span>
      <button
        type="button"
        className="ml-2 text-gray-500 hover:text-primary"
        onClick={onToggleSecret}
        aria-label={showSecret ? 'Hide secret' : 'Show secret'}
      >
        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

// Helper component for agents table
const AgentsTable = ({ agents }: { agents: BotAgentSummaryDto[] | undefined }) => {
  if ((agents?.length ?? 0) === 0) {
    return (
      <div className="h-[100px] flex items-center justify-center text-muted-foreground">
        No authorized agents.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="border px-3 py-2 text-left">Name</th>
            <th className="border px-3 py-2 text-left">Machine Name</th>
          </tr>
        </thead>
        <tbody>
          {agents?.map((agent) => (
            <tr key={agent.id} className="hover:bg-accent/30 transition">
              <td className="border px-3 py-2">{agent.name}</td>
              <td className="border px-3 py-2">{agent.machineName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AssetDetail({ id }: AssetDetailProps) {
  const router = useRouter()
  const { toast } = useToast()

  // ✅ SWR for asset details - following guideline #8: use framework-level loaders
  const {
    data: asset,
    error: assetError,
    isLoading: assetLoading,
  } = useSWR(id ? swrKeys.assetById(id) : null, () => getAssetDetail(id))

  // ✅ SWR for asset agents
  const {
    data: agents,
    error: agentsError,
    isLoading: agentsLoading,
  } = useSWR(id ? swrKeys.assetAgents(id) : null, () => getAssetAgents(id))

  // UI state
  const [showSecret, setShowSecret] = useState(false)

  // ✅ Combine loading states
  const loading = assetLoading || agentsLoading
  const error = assetError ?? agentsError
  // ✅ Error handling in dedicated effect (guideline #3)
  // Client-only: Requires toast notifications for user feedback
  useEffect(() => {
    if (error) {
      console.error('Failed to load asset details:', error)
      toast({
        title: 'Error',
        description: createSWRErrorMessage(error),
        variant: 'destructive',
      })
    }
  }, [error, toast])

  const handleBack = () => {
    router.back()
  }

  // ✅ Loading state handling
  if (loading) return <div>Loading...</div>

  // ✅ Error state handling - note: errors are also handled via toast in useEffect
  if (error && !asset) return <div className="text-red-500">{createSWRErrorMessage(error)}</div>

  // Handle case where asset is not found
  if (!asset) return <div>Asset not found</div>

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="border rounded-xl shadow-lg">
        <CardHeader className="flex items-center justify-between border-b p-6 rounded-t-xl">
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Asset Detail</span>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Asset Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <Key className="w-4 h-4" /> Key
                </div>
                <div className="text-base font-semibold border-b pb-1">{asset.key}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" /> Description
                </div>
                <div className="text-base font-semibold border-b pb-1">{asset.description}</div>
              </div>{' '}
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" /> Value
                </div>
                <AssetValueDisplay
                  asset={asset}
                  showSecret={showSecret}
                  onToggleSecret={() => setShowSecret((v) => !v)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" /> Type
                </div>
                <span>
                  {asset.type === 0 || asset.type === '0' || asset.type === 'String'
                    ? 'String'
                    : 'Secret'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1 mt-4">
                  <FileText className="w-4 h-4" /> Created At
                </div>
                <div className="text-base font-semibold border-b pb-1">
                  {formatUtcToLocal(asset.createdAt, {
                    dateStyle: 'medium',
                    timeStyle: undefined,
                    fallback: '-',
                  })}
                </div>
              </div>
            </div>
          </div>
          {/* Agent Table */}
          <div className="mt-8">
            {' '}
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Authorized Agents</h3>
            </div>
            <AgentsTable agents={agents} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
