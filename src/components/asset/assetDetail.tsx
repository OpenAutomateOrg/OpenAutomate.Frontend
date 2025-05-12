'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AssetRow } from './asset'

interface AssetDetailProps {
  id: string
}

export default function AssetDetail({ id }: AssetDetailProps) {
  const router = useRouter()
  const [asset, setAsset] = useState<AssetRow | null>(null)

  useEffect(() => {
    // TODO: Replace with actual API call
    const mockAsset: AssetRow = {
      id,
      name: 'Laptop Dell XPS 13',
      type: 'Hardware',
      value: '$1,299',
      createdBy: 'John Doe',
      label: 'IT Equipment',
      status: 'Active',
    }
    setAsset(mockAsset)
  }, [id])

  const handleBack = () => {
    router.back()
  }

  if (!asset) {
    return <div>Loading...</div>
  }

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
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="text-base font-medium border-b pb-1">{asset.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Created By</p>
                <p className="text-base font-medium border-b pb-1">{asset.createdBy}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground mb-1">Type</p>
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-700 font-normal rounded-sm px-2 py-0.5 text-xs w-fit"
              >
                {asset.type}
              </Badge>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="common" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-transparent p-0 border-b">
              <TabsTrigger
                value="common"
                className="text-sm data-[state=active]:text-red-500 data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none bg-transparent"
              >
                Common Value
              </TabsTrigger>
              <TabsTrigger
                value="agent"
                className="text-sm data-[state=active]:text-red-500 data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none bg-transparent"
              >
                Value Per Agent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="common" className="mt-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Value</p>
                <p className="text-base font-medium">{asset.value}</p>
              </div>
            </TabsContent>

            <TabsContent value="agent" className="mt-4">
              <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                Value Per Agent content
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
