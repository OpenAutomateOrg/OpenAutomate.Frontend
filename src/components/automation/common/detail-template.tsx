'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DetailTemplateProps<TData extends { name: string; status: string }> {
  id: string
  fetchItem?: (id: string) => Promise<TData>
}

const getStatusBadgeClass = (status: string) => {
  if (status === 'Disconnected') return 'bg-red-100 text-red-600 border-none'
  if (status === 'Offline') return 'bg-yellow-100 text-yellow-600 border-none'
  return 'bg-green-100 text-green-600 border-none'
}

export function DetailTemplate<TData extends { name: string; status: string }>({
  id,
  fetchItem,
}: DetailTemplateProps<TData>) {
  const router = useRouter()
  const [item, setItem] = useState<TData | null>(null)

  useEffect(() => {
    const load = async () => {
      if (fetchItem) {
        setItem(await fetchItem(id))
      } else {
        setItem({
          id,
          name: 'Item',
          status: 'Disconnected',
        } as TData)
      }
    }
    load()
  }, [id, fetchItem])

  const handleBack = () => {
    router.back()
  }

  if (!item) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <DetailBlock label="Name">{item.name}</DetailBlock>
              <DetailBlock label="Machine name" />
            </div>
            <div className="space-y-4">
              <DetailBlock label="Status">
                <Badge variant="outline" className={getStatusBadgeClass(item.status)}>
                  {item.status}
                </Badge>
              </DetailBlock>
              <DetailBlock label="Last Connected" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DetailBlock({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="text-base font-medium pb-1 border-b">{children}</div>
    </div>
  )
}
