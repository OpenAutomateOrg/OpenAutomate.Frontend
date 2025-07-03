'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

// Import n8n chat styles
import '@n8n/chat/style.css'

interface N8nChatProps {
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
   * Full n8n chat window configuration
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
    metadata?: Record<string, any>
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

// Create a custom webhook endpoint that appends tenant and token to chatInput
const createCustomWebhookEndpoint = async (
  originalWebhookUrl: string, 
  tenantSlug: string, 
  authToken: string
): Promise<(() => void) | null> => {
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlString = input.toString()
      if (urlString === originalWebhookUrl && init?.method === 'POST') {
        try {
          const originalPayload = JSON.parse(init.body as string)
          const originalChatInput = originalPayload.chatInput || originalPayload.message || ''
          // Append context
          const contextInfo = []
          if (tenantSlug) contextInfo.push(`[tenant: ${tenantSlug}]`)
          if (authToken) contextInfo.push(`[token: ${authToken}]`)
          const modifiedChatInput = contextInfo.length > 0
            ? `${originalChatInput} ${contextInfo.join(' ')}`
            : originalChatInput
          const cleanPayload = {
            sessionId: originalPayload.sessionId,
            action: originalPayload.action || 'sendMessage',
            chatInput: modifiedChatInput
          }
          const modifiedOptions = {
            ...init,
            body: JSON.stringify(cleanPayload)
          }
          return originalFetch(input, modifiedOptions)
        } catch (error) {
          return originalFetch(input, init)
        }
      }
      return originalFetch(input, init)
    }
    window.fetch = customFetch
    return () => {
      window.fetch = originalFetch
    }
  }
  return null
}

export function N8nChat({
  webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '',
  enabled = true,
  position = 'bottom-right',
  chatConfig = {},
  tenantSlug = '',
  jwtToken = '',
}: N8nChatProps & { tenantSlug?: string; jwtToken?: string }) {
  const { theme } = useTheme()
  const [isChatLoaded, setIsChatLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchCleanup, setFetchCleanup] = useState<(() => void) | null>(null)

  // ✅ Effect for loading and initializing n8n chat
  useEffect(() => {
    // Don't load if disabled or no webhook URL
    if (!enabled || !webhookUrl) {
      return
    }

    let cleanup: (() => void) | undefined

    // Dynamically import and initialize chat
    const initializeChat = async () => {
      try {
        // Dynamic import for client-side only
        const { createChat } = await import('@n8n/chat')

        // Set up custom webhook endpoint that appends context
        const fetchCleanupFn = await createCustomWebhookEndpoint(webhookUrl, tenantSlug || '', jwtToken || '')
        if (fetchCleanupFn) {
          setFetchCleanup(() => fetchCleanupFn)
        }

        // Create the chat instance with filtered payload
        const chatInstance = createChat({
          webhookUrl,
          // n8n specific configuration options
          mode: chatConfig.mode || 'window',
          chatInputKey: chatConfig.chatInputKey || 'chatInput',
          chatSessionKey: chatConfig.chatSessionKey || 'sessionId',
          loadPreviousSession: chatConfig.loadPreviousSession !== false,
          metadata: chatConfig.metadata || {},
          showWelcomeScreen: chatConfig.showWelcomeScreen !== false,
          defaultLanguage: 'en',
          initialMessages: chatConfig.initialMessages || [],
          i18n: chatConfig.i18n || {},
        })

        // Mark as loaded
        setIsChatLoaded(true)
        setError(null)

        // Store cleanup function
        cleanup = () => {
          console.log('Chat component cleanup')
          if (fetchCleanup) {
            fetchCleanup()
          }
        }
      } catch (err) {
        console.error('Failed to initialize n8n chat:', err)
        setError('Failed to load chat widget')
        setIsChatLoaded(false)
      }
    }

    initializeChat()

    // ✅ Cleanup function
    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [webhookUrl, enabled, chatConfig, tenantSlug, jwtToken])

  // ✅ Effect for theme-based styling updates
  useEffect(() => {
    if (!isChatLoaded) return

    // Apply theme-specific CSS variables
    const root = document.documentElement
    
    if (theme === 'dark') {
      // Dark theme variables - enhanced orange theme for dark mode
      root.style.setProperty('--chat--color-primary', 'oklch(0.6641 0.2155 46.96)') // OpenAutomate orange
      root.style.setProperty('--chat--color-secondary', 'oklch(0.6 0.118 184.704)')
      root.style.setProperty('--chat--color-white', 'oklch(0.208 0.042 265.755)')
      root.style.setProperty('--chat--color-light', 'oklch(0.279 0.041 260.031)')
      root.style.setProperty('--chat--color-light-shade-50', 'oklch(0.208 0.042 265.755)')
      root.style.setProperty('--chat--color-dark', 'oklch(0.984 0.003 247.858)')
      root.style.setProperty('--chat--header--background', 'oklch(0.6241 0.2155 46.96)') // Darker orange for header
      root.style.setProperty('--chat--header--color', 'oklch(1 0 0)') // Pure white text
      root.style.setProperty('--chat--message--bot--background', 'oklch(0.279 0.041 260.031)')
      root.style.setProperty('--chat--message--bot--color', 'oklch(0.984 0.003 247.858)')
    } else {
      // Light theme variables - bright orange header theme
      root.style.setProperty('--chat--color-primary', 'oklch(0.6641 0.2155 46.96)') // OpenAutomate orange
      root.style.setProperty('--chat--color-secondary', 'oklch(0.6 0.118 184.704)')
      root.style.setProperty('--chat--color-white', 'oklch(1 0 0)')
      root.style.setProperty('--chat--color-light', 'oklch(0.984 0.003 247.858)')
      root.style.setProperty('--chat--color-light-shade-50', 'oklch(0.968 0.007 247.896)')
      root.style.setProperty('--chat--color-dark', 'oklch(0.129 0.042 264.695)')
      root.style.setProperty('--chat--header--background', 'oklch(0.6641 0.2155 46.96)') // Bright orange header
      root.style.setProperty('--chat--header--color', 'oklch(1 0 0)') // Pure white text
      root.style.setProperty('--chat--message--bot--background', 'oklch(1 0 0)')
      root.style.setProperty('--chat--message--bot--color', 'oklch(0.129 0.042 264.695)')
    }

    // Apply position styles
    const positionStyles = {
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' },
    }

    const positionStyle = positionStyles[position]
    Object.entries(positionStyle).forEach(([key, value]) => {
      root.style.setProperty(`--chat--toggle--${key}`, value)
    })

    // Apply custom chat configuration
    if (chatConfig.width) {
      root.style.setProperty('--chat--window--width', chatConfig.width)
    }
    if (chatConfig.height) {
      root.style.setProperty('--chat--window--height', chatConfig.height)
    }
  }, [theme, isChatLoaded, position, chatConfig])

  // ✅ Don't render anything - chat is handled by the library
  // This component only manages the initialization and styling
  if (!enabled || !webhookUrl) {
    return null
  }

  if (error) {
    // Optional: You can render an error state or just return null
    if (process.env.NODE_ENV === 'development') {
      console.warn('N8n Chat Error:', error)
    }
    return null
  }

  return null
} 