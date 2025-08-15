'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/providers/locale-provider'

export default function UsersDetail() {
  const { t } = useLocale()
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="border rounded-md shadow-sm">
        <CardHeader className="flex items-center justify-between border-b p-4">
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {t('administration.users.detail.noDetail')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
