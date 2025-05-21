'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, Eye, EyeOff, Key, FileText, User, Shield } from 'lucide-react'
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
      <Card className="border rounded-xl shadow-lg">
        <CardHeader className="flex items-center justify-between border-b p-6 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Asset Detail</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
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
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" /> Value
                </div>
                {asset.type === 0 ? (
                  <div className="text-base font-semibold border-b pb-1">{asset.value ?? '-'}</div>
                ) : (
                  <div className="flex items-center gap-2 border-b pb-1">
                    <span className="text-base font-semibold">
                      {showSecret ? (asset.value ?? '-') : '••••••••'}
                    </span>
                    <button
                      type="button"
                      className="ml-2 text-gray-500 hover:text-primary"
                      onClick={() => setShowSecret(v => !v)}
                      aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" /> Type
                </div>
                <span>
                  {asset.type === 0 ? 'String' : 'Secret'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1 mt-4">
                  <FileText className="w-4 h-4" /> Created At
                </div>
                <div className="text-base font-semibold border-b pb-1">{asset.createdAt ? new Date(asset.createdAt).toLocaleDateString('vi-VN') : '-'}</div>
              </div>
            </div>
          </div>
          {/* Agent Table */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Authorized Agents</h3>
            </div>
            {agents.length === 0 ? (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                No authorized agents.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border px-3 py-2 text-left">Name</th>
                      <th className="border px-3 py-2 text-left">Machine Name</th>
                      <th className="border px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map(agent => (
                      <tr key={agent.id} className="hover:bg-accent/30 transition">
                        <td className="border px-3 py-2">{agent.name}</td>
                        <td className="border px-3 py-2">{agent.machineName}</td>
                        <td className="border px-3 py-2">
                          <span className={`inline-flex items-center gap-1 ${agent.status === 'Connected' ? 'text-green-600' : 'text-gray-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${agent.status === 'Connected' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            {agent.status}
                          </span>
                        </td>
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
