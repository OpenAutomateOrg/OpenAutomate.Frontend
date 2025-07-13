'use client'

import { useParams } from 'next/navigation'
import RolesDetail from '@/components/administration/roles/rolesDetail'

export default function Page() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      <RolesDetail id={id} />
    </div>
  )
}
