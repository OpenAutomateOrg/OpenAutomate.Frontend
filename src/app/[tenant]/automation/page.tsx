import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Automation',
  description: 'Agent management page',
}

export default function AutomationPage() {
  redirect('/[tenant]/automation/executions') // or external URL
}
