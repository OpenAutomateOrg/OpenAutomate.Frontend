import HistoricalDetail from '@/components/automation/executions/historical/historical-detail'

interface PageProps {
  readonly params: Promise<{
    readonly id: string
    readonly tenant: string
  }>
}

export default async function HistoricalDetailPage({ params }: PageProps) {
  const { id } = await params
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      <HistoricalDetail id={id} />
    </div>
  )
}
