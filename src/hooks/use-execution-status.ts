import { useEffect, useRef, useState } from 'react'
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
  HttpTransportType,
} from '@microsoft/signalr'
import { getAuthToken } from '@/lib/auth/token-storage'

export interface ExecutionStatusUpdate {
  botAgentId: string
  botAgentName: string
  status: string
  executionId: string
  message?: string
  timestamp: string
}

interface DiscoveryResponse {
  apiUrl: string
}

// Helper to determine if an error is an expected SignalR error
const isExpectedSignalRError = (message: string): boolean => {
  const expectedErrors = [
    'Server timeout elapsed',
    'The connection was stopped during negotiation',
    'Failed to start the connection',
    'Error: Error: The connection was stopped',
    'connection disconnected',
    'Unable to connect',
    'disconnected with error',
    'Stopping the connection',
    'WebSocket closed',
    'network error',
    'transport timed out',
    'Transport disconnected',
    'Response status code does not indicate success: 401',
    'Unauthorized',
    'Cannot start a HubConnection',
  ]

  return expectedErrors.some((errorText) => message.includes(errorText))
}

// Helper function to retry connection after timeout
const retryConnectionAfterDelay = (connection: HubConnection) => {
  console.debug('[SignalR Execution] Attempting to reconnect after delay...')
  connection.start().catch((reconnectError: unknown) => {
    const errorMessage = reconnectError instanceof Error ? reconnectError.message : 'Unknown error'
    console.debug('[SignalR Execution] Reconnection attempt also failed:', errorMessage)
  })
}

// Helper to start a SignalR connection with error handling
const startSignalRConnection = async (connection: HubConnection) => {
  try {
    await connection.start()
    console.debug('[SignalR Execution] Connected successfully')
  } catch (err: unknown) {
    if (err instanceof Error && err.message && isExpectedSignalRError(err.message)) {
      console.debug('[SignalR Execution] Expected connection issue (suppressed):', err.message)
      setTimeout(() => retryConnectionAfterDelay(connection), 3000)
    } else {
      console.error('[SignalR Execution] Connection Error:', err)
    }
  }
}

// Helper to discover backend API URL from frontend
const discoverApiUrl = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/connection-info')
    if (!response.ok) {
      throw new Error(`Discovery failed: ${response.status}`)
    }
    const data: DiscoveryResponse = await response.json()
    return data.apiUrl
  } catch (error) {
    console.error('[SignalR Execution] Failed to discover API URL:', error)
    return null
  }
}

// Helper to create a SignalR hub connection with direct backend connection
const createSignalRConnection = async (tenant: string): Promise<HubConnection | null> => {
  // Discover the backend API URL
  const apiUrl = await discoverApiUrl()
  if (!apiUrl) {
    console.error(
      '[SignalR Execution] Cannot create connection: Failed to discover backend API URL',
    )
    return null
  }

  // Construct the direct hub URL to backend
  const hubUrl = `${apiUrl.replace(/\/$/, '')}/${tenant}/hubs/botagent`

  // Frontend users should use JWT authentication, not machine key
  const authToken = getAuthToken()
  if (!authToken) {
    console.warn('[SignalR Execution] No auth token available for SignalR connection')
    return null
  }

  console.debug('[SignalR Execution] Creating direct connection to backend hub:', hubUrl)

  const connectionOptions = {
    accessTokenFactory: () => authToken,
    transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  }

  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl, connectionOptions)
    .configureLogging(LogLevel.Warning)
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        const delayMs = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 60000)
        return delayMs
      },
    })
    .withServerTimeout(120000) // 2 minute server timeout
    .withKeepAliveInterval(30000) // 30 second keep-alive
    .build()

  return connection
}

// Helper to normalize execution status update from SignalR
const normalizeExecutionStatusUpdate = (update: {
  botAgentId?: string
  BotAgentId?: string
  botAgentName?: string
  BotAgentName?: string
  status?: string
  Status?: string
  executionId?: string
  ExecutionId?: string
  message?: string
  Message?: string
  timestamp?: string
  Timestamp?: string
}): ExecutionStatusUpdate => ({
  botAgentId: update.botAgentId ?? update.BotAgentId ?? '',
  botAgentName: update.botAgentName ?? update.BotAgentName ?? '',
  status: update.status ?? update.Status ?? '',
  executionId: update.executionId ?? update.ExecutionId ?? '',
  message: update.message ?? update.Message,
  timestamp: update.timestamp ?? update.Timestamp ?? new Date().toISOString(),
})

// Helper to handle execution connection close events
const handleExecutionConnectionClose = (error?: Error) => {
  if (error) {
    if (error.message && isExpectedSignalRError(error.message)) {
      console.debug(
        '[SignalR Execution] Connection issue - will automatically reconnect if possible',
      )
    } else {
      console.error('[SignalR Execution] Connection closed with error:', error)
    }
  }
}

// Helper to setup execution connection event handlers
const setupExecutionConnectionHandlers = (
  connection: HubConnection,
  setExecutionStatuses: React.Dispatch<React.SetStateAction<Record<string, ExecutionStatusUpdate>>>,
  onStatusUpdate?: (update: ExecutionStatusUpdate) => void,
) => {
  connection.onclose(handleExecutionConnectionClose)

  connection.on('ExecutionStatusUpdate', (update) => {
    const normalized = normalizeExecutionStatusUpdate(update)
    console.debug('[SignalR Execution] ExecutionStatusUpdate received:', normalized)

    // Store by executionId instead of botAgentId for execution tracking
    setExecutionStatuses((prev) => ({
      ...prev,
      [normalized.executionId]: normalized,
    }))

    if (onStatusUpdate) onStatusUpdate(normalized)
  })

  connection.onreconnecting((error) => {
    console.debug('[SignalR Execution] Attempting to reconnect...', error?.message)
  })

  connection.onreconnected((connectionId) => {
    console.debug('[SignalR Execution] Reconnected successfully with ID:', connectionId)
  })
}

export function useExecutionStatus(
  tenant: string,
  onStatusUpdate?: (update: ExecutionStatusUpdate) => void,
) {
  const [executionStatuses, setExecutionStatuses] = useState<Record<string, ExecutionStatusUpdate>>(
    {},
  )
  const connectionRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    if (!tenant) return

    const initializeConnection = async () => {
      const connection = await createSignalRConnection(tenant)
      if (!connection) {
        console.error('[SignalR Execution] Failed to create connection')
        return
      }

      setupExecutionConnectionHandlers(connection, setExecutionStatuses, onStatusUpdate)
      await startSignalRConnection(connection)
      connectionRef.current = connection
    }

    initializeConnection()

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch((err) => {
          console.debug('[SignalR Execution] Error during connection stop:', err?.message)
        })
      }
    }
  }, [tenant, onStatusUpdate])

  return executionStatuses
}
