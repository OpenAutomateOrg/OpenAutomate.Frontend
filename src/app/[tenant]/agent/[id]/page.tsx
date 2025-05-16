'use client'

import { useParams } from 'next/navigation'
import AgentDetail from '@/components/agent/agentDetail'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default function Page() {
  const params = useParams()
  const id = params?.id as string
  const [error, setError] = useState<string | null>(null)

  // Validate the ID parameter
  useEffect(() => {
    if (!id) {
      setError('Invalid agent ID')
    }
  }, [id])

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardContent className="p-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              <p className="font-medium mb-2">Error</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {id ? <AgentDetail id={id} /> : null}
    </div>
  )
}
