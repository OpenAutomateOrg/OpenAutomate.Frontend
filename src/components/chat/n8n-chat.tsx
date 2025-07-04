'use client'

import { useEffect, useState, useRef } from 'react'
import { useTheme } from 'next-themes'

// Import n8n chat styles
import '@n8n/chat/style.css'

// Interface for n8n webhook payload
interface WebhookPayload {
  chatInput?: string
  message?: string
  sessionId?: string
  action?: string
  [key: string]: unknown
}

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

// Helper to safely convert input to string
const getUrlString = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url || ''
}

// Helper to create modified payload with context
const createModifiedPayload = (
  originalPayload: WebhookPayload,
  tenantSlug: string,
  authToken: string
) => {
  const originalChatInput = originalPayload.chatInput ?? originalPayload.message ?? ''

  const contextInfo = []
  if (tenantSlug) contextInfo.push(`[tenant: ${tenantSlug}]`)
  if (authToken) contextInfo.push(`[token: ${authToken}]`)

  const modifiedChatInput = contextInfo.length > 0
    ? `${originalChatInput} ${contextInfo.join(' ')}`
    : originalChatInput

  return {
    sessionId: originalPayload.sessionId,
    action: originalPayload.action ?? 'sendMessage',
    chatInput: modifiedChatInput
  }
}

// Helper to handle webhook request with typing indicators
const handleWebhookRequest = async (
  originalFetch: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit,
  originalPayload: WebhookPayload,
  context: {
    tenantSlug: string
    authToken: string
    onTypingStart?: () => void
    onTypingEnd?: () => void
  }
) => {
  const originalChatInput = originalPayload.chatInput ?? originalPayload.message ?? ''

  // Show typing indicator when sending a message
  if (context.onTypingStart && originalChatInput.trim()) {
    context.onTypingStart()
  }

  const cleanPayload = createModifiedPayload(originalPayload, context.tenantSlug, context.authToken)
  const modifiedOptions = {
    ...init,
    body: JSON.stringify(cleanPayload)
  }

  try {
    const response = await originalFetch(input, modifiedOptions)
    if (context.onTypingEnd) context.onTypingEnd()
    return response
  } catch (error) {
    if (context.onTypingEnd) context.onTypingEnd()
    throw error
  }
}

// Create a custom webhook endpoint that appends tenant and token to chatInput
// and manages typing indicator state
const createCustomWebhookEndpoint = async (
  originalWebhookUrl: string,
  tenantSlug: string,
  authToken: string,
  onTypingStart?: () => void,
  onTypingEnd?: () => void
): Promise<(() => void) | null> => {
  if (typeof window === 'undefined') return null

  const originalFetch = window.fetch
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlString = getUrlString(input)

    if (urlString === originalWebhookUrl && init?.method === 'POST') {
      try {
        const originalPayload = JSON.parse(init.body as string)
        return await handleWebhookRequest(
          originalFetch,
          input,
          init,
          originalPayload,
          { tenantSlug, authToken, onTypingStart, onTypingEnd }
        )
      } catch {
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

export function N8nChat({
  webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? '',
  enabled = true,
  position = 'bottom-right',
  chatConfig = {},
  tenantSlug = '',
  jwtToken = '',
}: N8nChatProps & { tenantSlug?: string; jwtToken?: string }) {
  const { theme } = useTheme()
  const [isChatLoaded, setIsChatLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ Typing indicator handlers
  const handleTypingStart = () => {
    setIsTyping(true)
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    // Set a fallback timeout in case the response never comes
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 30000) // 30 seconds timeout
  }

  const handleTypingEnd = () => {
    setIsTyping(false)
    // Clear the timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  // ✅ Effect for loading and initializing n8n chat
  useEffect(() => {
    // Don't load if disabled or no webhook URL
    if (!enabled || !webhookUrl) {
      return
    }

    let cleanup: (() => void) | undefined
    let currentFetchCleanup: (() => void) | null = null

    // Dynamically import and initialize chat
    const initializeChat = async () => {
      try {
        // Dynamic import for client-side only
        const { createChat } = await import('@n8n/chat')

        // Set up custom webhook endpoint that appends context and handles typing
        const fetchCleanupFn = await createCustomWebhookEndpoint(
          webhookUrl,
          tenantSlug ?? '',
          jwtToken ?? '',
          handleTypingStart,
          handleTypingEnd
        )
        if (fetchCleanupFn) {
          currentFetchCleanup = fetchCleanupFn
        }

        // Create the chat instance with filtered payload
        createChat({
          webhookUrl,
          // n8n specific configuration options
          mode: chatConfig.mode ?? 'window',
          chatInputKey: chatConfig.chatInputKey ?? 'chatInput',
          chatSessionKey: chatConfig.chatSessionKey ?? 'sessionId',
          loadPreviousSession: chatConfig.loadPreviousSession !== false,
          metadata: chatConfig.metadata ?? {},
          showWelcomeScreen: chatConfig.showWelcomeScreen !== false,
          defaultLanguage: 'en',
          initialMessages: chatConfig.initialMessages ?? [],
          i18n: chatConfig.i18n ?? {},
        })

        // Mark as loaded
        setIsChatLoaded(true)
        setError(null)

        // Store cleanup function using the local reference
        cleanup = () => {
          console.log('Chat component cleanup')
          if (currentFetchCleanup) {
            currentFetchCleanup()
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
      // Also clean up the local fetch cleanup function
      if (currentFetchCleanup) {
        currentFetchCleanup()
      }
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [webhookUrl, enabled, chatConfig, tenantSlug, jwtToken])

  // ✅ Effect for injecting typing indicator into chat
  useEffect(() => {
    if (!isChatLoaded || !isTyping) return

    const injectTypingIndicator = () => {
      // Find the chat messages container
      const chatContainer = document.querySelector('.n8n-chat .chat-messages, .n8n-chat [class*="messages"], .n8n-chat [class*="conversation"]')
      if (!chatContainer) return

      // Check if typing indicator already exists
      if (document.querySelector('.typing-indicator')) return

      // Create typing indicator element
      const typingIndicator = document.createElement('div')
      typingIndicator.className = 'typing-indicator'
      typingIndicator.innerHTML = `
        <div class="typing-indicator-content">
          <div class="typing-indicator-avatar">🤖</div>
          <div class="typing-indicator-message">
            <div class="typing-indicator-text">Assistant is typing</div>
            <div class="typing-indicator-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      `

      // Add styles
      const style = document.createElement('style')
      style.textContent = `
        .typing-indicator {
          padding: 8px 16px;
          margin: 4px 0;
          display: flex;
          align-items: flex-start;
          animation: fadeIn 0.3s ease-in;
        }

        .typing-indicator-content {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          max-width: 80%;
        }

        .typing-indicator-avatar {
          font-size: 24px;
          line-height: 1;
          flex-shrink: 0;
        }

        .typing-indicator-message {
          background: var(--chat--message--bot--background, #f1f1f1);
          color: var(--chat--message--bot--color, #333);
          padding: 12px 16px;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .typing-indicator-text {
          font-size: 14px;
          margin-bottom: 4px;
          opacity: 0.7;
        }

        .typing-indicator-dots {
          display: flex;
          gap: 4px;
        }

        .typing-indicator-dots span {
          width: 6px;
          height: 6px;
          background: currentColor;
          border-radius: 50%;
          opacity: 0.4;
          animation: typingDot 1.4s infinite ease-in-out;
        }

        .typing-indicator-dots span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.4; transform: scale(1); }
          30% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `

      if (!document.querySelector('#typing-indicator-styles')) {
        style.id = 'typing-indicator-styles'
        document.head.appendChild(style)
      }

      // Append to chat container
      chatContainer.appendChild(typingIndicator)

      // Scroll to bottom
      chatContainer.scrollTop = chatContainer.scrollHeight
    }

    // Try to inject immediately, then retry with delays
    injectTypingIndicator()
    const timeout1 = setTimeout(injectTypingIndicator, 100)
    const timeout2 = setTimeout(injectTypingIndicator, 500)

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [isChatLoaded, isTyping])

  // ✅ Effect for removing typing indicator
  useEffect(() => {
    if (!isTyping) {
      // Remove typing indicator
      const typingIndicator = document.querySelector('.typing-indicator')
      if (typingIndicator) {
        typingIndicator.remove()
      }
    }
  }, [isTyping])

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
    // In development, show error state; in production, return null
    if (process.env.NODE_ENV === 'development') {
      console.warn('N8n Chat Error:', error)
      return (
        <div className="fixed bottom-4 right-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Chat Error: {error}
        </div>
      )
    }
    return null
  }

  // In development, show loading state when chat is initializing
  if (process.env.NODE_ENV === 'development' && !isChatLoaded) {
    return (
      <div className="fixed bottom-4 right-4 p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
        Initializing chat...
      </div>
    )
  }

  return null
} 