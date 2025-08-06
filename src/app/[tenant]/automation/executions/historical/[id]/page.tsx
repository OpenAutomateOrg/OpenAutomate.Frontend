import HistoricalDetail from '@/components/automation/executions/historical/historical-detail'

interface PageProps {
    readonly params: Promise<{
        readonly id: string
        readonly tenant: string
    }>
}

export default async function HistoricalDetailPage({ params }: PageProps) {
    const { id } = await params
    return <HistoricalDetail id={id} />
}
