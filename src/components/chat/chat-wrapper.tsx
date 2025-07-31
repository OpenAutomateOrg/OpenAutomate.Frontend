'use client'

import { N8nChat } from './n8n-chat'
import { useTenantChat } from '@/hooks/use-tenant-chat'

/**
 * Chat wrapper component that integrates n8n chat with the application
 * This component handles the configuration and placement of the chat widget
 */
export function ChatWrapper() {
  const { config, tenantSlug, jwtToken } = useTenantChat()

  return <N8nChat {...config} tenantSlug={tenantSlug || ''} jwtToken={jwtToken || ''} />
}

/**
 * Chat provider component for layout integration
 * Use this in your layout to add chat functionality throughout the app
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWrapper />
    </>
  )
}
