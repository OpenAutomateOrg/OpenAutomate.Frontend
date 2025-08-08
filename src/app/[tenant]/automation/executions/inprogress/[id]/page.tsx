import InProgressDetail from '@/components/automation/executions/inProgress/inprogress-detail'

interface PageProps {
    readonly params: Promise<{
        readonly id: string
        readonly tenant: string
    }>
}

export default async function InProgressDetailPage({ params }: PageProps) {
    const { id } = await params
    return <InProgressDetail id={id} />
}
