'use client'

import { useParams } from 'next/navigation'
import { useState, useCallback, useMemo } from 'react'
import { useAuth } from './use-auth'
import { getAuthToken } from '@/lib/auth/token-storage'

export interface TenantChatConfig {
  /**
   * The webhook URL for the n8n chat workflow
   */
  webhookUrl?: string
  /**
   * Whether to show the chat widget
   */
  enabled?: boolean
  /**
   * Custom position for the chat toggle button
   */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /**
   * Full n8n chat configuration
   */
  chatConfig?: {
    // Window configuration
    width?: string
    height?: string
    title?: string
    subtitle?: string
    
    // n8n chat specific options
    mode?: 'window' | 'fullscreen'
    chatInputKey?: string
    chatSessionKey?: string
    loadPreviousSession?: boolean
    metadata?: Record<string, unknown>
    showWelcomeScreen?: boolean
    defaultLanguage?: string
    initialMessages?: string[]
    i18n?: Record<string, {
      [message: string]: string
      title: string
      subtitle: string
      footer: string
      getStarted: string
      inputPlaceholder: string
      closeButtonTooltip: string
    }>
    // Webhook configuration for custom payload
    webhookConfig?: {
      method?: 'POST' | 'GET'
      headers?: Record<string, string>
    }
  }
}

export function useTenantChat() {
  const params = useParams()
  const { user, isAuthenticated } = useAuth()
  const [isEnabled, setIsEnabled] = useState(true)
  
  // Get current tenant from URL params
  const currentTenant = params.tenant as string | undefined

  // ✅ Derive chat configuration based on tenant and user context
  const getChatConfig = useCallback((): TenantChatConfig => {
    // Default webhook URL from environment
    const baseWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? ''

    // Get current JWT token for authentication
    const authToken = getAuthToken()

    // Only enable chat when:
    // 1. Chat is enabled
    // 2. Webhook URL is configured
    // 3. User is authenticated
    // 4. User is within a tenant context
    const shouldEnable = isEnabled && Boolean(baseWebhookUrl) && isAuthenticated && Boolean(currentTenant)

    // Determine user name for personalization
    const userName = user?.firstName ?? 'there'
    const fullUserName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName ?? user?.email ?? 'User'

    return {
      webhookUrl: baseWebhookUrl,
      enabled: shouldEnable,
      position: 'bottom-right',
      chatConfig: {
        // Window configuration
        width: '420px',
        height: '600px',
        
        // n8n chat configuration tailored for OpenAutomate
        mode: 'window',
        chatInputKey: 'chatInput',
        chatSessionKey: 'sessionId',
        loadPreviousSession: true,
        showWelcomeScreen: false,
        defaultLanguage: 'en',
        
        // Enhanced metadata with business context
        metadata: {
          tenant: currentTenant,
          userId: user?.id,
          userEmail: user?.email,
          userName: fullUserName,
          userRole: user?.systemRole ?? 'user',
          timestamp: new Date().toISOString(),
          platform: 'openAutomate',
          source: 'frontend-chat',
          hasToken: Boolean(authToken)
        },
        
        // Personalized welcome messages
        initialMessages: [
          `Hi ${userName}! 👋`,
          `Welcome to OpenAutomate. I'm your AI assistant ready to help you with automation and general questions.`,
          `What can I help you with today?`
        ],
        
        // Internationalization configuration
        i18n: {
          en: {
            title: `Assistant`,
            subtitle: ``,
            footer: 'Powered by OpenAutomate',
            getStarted: 'Start New Conversation',
            inputPlaceholder: 'Ask automation, or anything else...',
            closeButtonTooltip: 'Close chat'
          }
        },

        // Webhook configuration with authentication headers
        webhookConfig: authToken ? {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'X-Tenant': currentTenant ?? '',
          }
        } : undefined
      },
    }
  }, [isEnabled, isAuthenticated, user, currentTenant])

  // ✅ Methods for controlling chat
  const enableChat = useCallback(() => {
    setIsEnabled(true)
  }, [])

  const disableChat = useCallback(() => {
    setIsEnabled(false)
  }, [])

  const toggleChat = useCallback(() => {
    setIsEnabled(prev => !prev)
  }, [])

  // ✅ Get tenant information
  const tenantInfo = useMemo(() => ({
    currentTenant,
    isInTenant: Boolean(currentTenant),
    tenantDisplayName: currentTenant 
      ? currentTenant.charAt(0).toUpperCase() + currentTenant.slice(1).replace(/-/g, ' ')
      : null,
  }), [currentTenant])

  return {
    config: getChatConfig(),
    tenantInfo,
    isEnabled,
    enableChat,
    disableChat,
    toggleChat,
    tenantSlug: currentTenant,
    jwtToken: getAuthToken(),
  }
} 