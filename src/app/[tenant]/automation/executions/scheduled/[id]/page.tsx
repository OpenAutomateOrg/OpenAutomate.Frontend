import ScheduledDetail from '@/components/automation/executions/scheduled/scheduled-detail'

interface PageProps {
    readonly params: Promise<{
        readonly id: string
        readonly tenant: string
    }>
}

export default async function ScheduledDetailPage({ params }: PageProps) {
    const { id } = await params
    return <ScheduledDetail id={id} />
}
