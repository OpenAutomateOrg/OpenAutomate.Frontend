import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
    tenant: string
  }>
}

export default async function ExecutionDetailPage({ params }: PageProps) {
  const { tenant, id } = await params

  // Default redirect to historical tab
  redirect(`/${tenant}/automation/executions/historical/${id}`)
}
