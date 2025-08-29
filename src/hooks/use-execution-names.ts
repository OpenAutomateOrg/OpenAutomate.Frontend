import useSWR from 'swr'
import { getAutomationPackageById } from '@/lib/api/automation-packages'
import { getBotAgentById } from '@/lib/api/bot-agents'

export function useExecutionNames(packageId?: string, botAgentId?: string) {
  // Fetch package name
  const { data: packageData } = useSWR(
    packageId ? `package-${packageId}` : null,
    () => (packageId ? getAutomationPackageById(packageId) : null),
    {
      dedupingInterval: 5 * 60 * 1000, // Cache for 5 minutes
      revalidateOnFocus: false,
    },
  )

  // Fetch bot agent name
  const { data: botAgentData } = useSWR(
    botAgentId ? `bot-agent-${botAgentId}` : null,
    () => (botAgentId ? getBotAgentById(botAgentId) : null),
    {
      dedupingInterval: 5 * 60 * 1000, // Cache for 5 minutes
      revalidateOnFocus: false,
    },
  )

  return {
    packageName: packageData?.name,
    botAgentName: botAgentData?.name,
    isLoading: (!packageData && packageId) || (!botAgentData && botAgentId),
  }
}
