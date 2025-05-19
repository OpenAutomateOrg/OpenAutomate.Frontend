'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAssetDetail, getAssetAgents, AssetDetailDto, BotAgentSummaryDto } from '@/lib/api/assets'

interface AssetDetailProps {
  readonly id: string
}

export default function AssetDetail({ id }: AssetDetailProps) {
  const router = useRouter()
  const [asset, setAsset] = useState<AssetDetailDto | null>(null)
  const [agents, setAgents] = useState<BotAgentSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getAssetDetail(id),
      getAssetAgents(id)
    ])
      .then(([assetRes, agentsRes]) => {
        setAsset(assetRes)
        setAgents(agentsRes)
      })
      .catch(() => setError('Failed to load asset detail'))
      .finally(() => setLoading(false))
  }, [id])

  const handleBack = () => {
    router.back()
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!asset) return <div>Asset not found</div>

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="border rounded-md shadow-sm">
        <CardHeader className="flex items-center justify-between border-b p-4">
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Asset Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Key</p>
                <p className="text-base font-medium border-b pb-1">{asset.key}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-base font-medium border-b pb-1">{asset.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Value</p>
                {asset.type === 0 ? (
                  <p className="text-base font-medium border-b pb-1">{asset.value ?? '-'}</p>
                ) : (
                  <div className="flex items-center gap-2 border-b pb-1">
                    <span className="text-base font-medium">
                      {showSecret ? (asset.value ?? '-') : '••••••••'}
                    </span>
                    <button
                      type="button"
                      className="ml-2 text-gray-500 hover:text-gray-800"
                      onClick={() => setShowSecret(v => !v)}
                      aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground mb-1">Type</p>
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-700 font-normal rounded-sm px-2 py-0.5 text-xs w-fit"
              >
                {asset.type === 0 ? 'String' : 'Secret'}
              </Badge>
              <p className="text-sm text-muted-foreground mb-1 mt-4">Created At</p>
              <p className="text-base font-medium border-b pb-1">{asset.createdAt ? new Date(asset.createdAt).toLocaleDateString('vi-VN') : '-'}</p>
            </div>
          </div>

          {/* Agent Table */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Authorized Agents</h3>
            {agents.length === 0 ? (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                No authorized agents.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Name</th>
                      <th className="border px-2 py-1">Machine Name</th>
                      <th className="border px-2 py-1">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map(agent => (
                      <tr key={agent.id}>
                        <td className="border px-2 py-1">{agent.name}</td>
                        <td className="border px-2 py-1">{agent.machineName}</td>
                        <td className="border px-2 py-1">{agent.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
