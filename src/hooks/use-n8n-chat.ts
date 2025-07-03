'use client'

import { useState, useCallback } from 'react'
import { useAuth } from './use-auth'
import { getAuthToken } from '@/lib/auth/token-storage'

export interface ChatConfig {
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
   * Custom chat window configuration
   */
  chatConfig?: {
    width?: string
    height?: string
    title?: string
    subtitle?: string
    // Webhook configuration for custom payload
    webhookConfig?: {
      method?: 'POST' | 'GET'
      headers?: Record<string, string>
    }
  }
}

export function useN8nChat() {
  const { user, isAuthenticated } = useAuth()
  const [isEnabled, setIsEnabled] = useState(true)

  // ✅ Derive chat configuration based on user context
  const getChatConfig = useCallback((): ChatConfig => {
    // Default webhook URL from environment
    const defaultWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''
    
    // Get current JWT token
    const authToken = getAuthToken()
    
    // Determine if chat should be enabled
    const shouldEnable = isEnabled && Boolean(defaultWebhookUrl) && isAuthenticated

    // Custom configuration based on user/context
    const title = user?.firstName 
      ? `Hi ${user.firstName}! 👋` 
      : 'OpenAutomate Support'
    
    const subtitle = 'How can we help you today?'

    // Determine user name for headers
    const fullUserName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.firstName || user?.email || 'User'

    return {
      webhookUrl: defaultWebhookUrl,
      enabled: shouldEnable,
      position: 'bottom-right',
      chatConfig: {
        width: '400px',
        height: '600px',
        title,
        subtitle,
      },
    }
  }, [isEnabled, isAuthenticated, user])

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

  return {
    config: getChatConfig(),
    isEnabled,
    enableChat,
    disableChat,
    toggleChat,
    jwtToken: getAuthToken(),
  }
} 