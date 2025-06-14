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
  connection.start().catch((reconnectError: Error | unknown) => {
    const errorMessage = reconnectError instanceof Error ? reconnectError.message : 'Unknown error'
    console.debug('[SignalR Execution] Reconnection attempt also failed:', errorMessage)
  })
}

// Helper to start a SignalR connection with error handling
const startSignalRConnection = async (connection: HubConnection) => {
  try {
    await connection.start()
    console.debug('[SignalR Execution] Connected successfully')
  } catch (err: Error | unknown) {
    if (err instanceof Error && err.message && isExpectedSignalRError(err.message)) {
      console.debug('[SignalR Execution] Expected connection issue (suppressed):', err.message)
      setTimeout(() => retryConnectionAfterDelay(connection), 3000)
    } else {
      console.error('[SignalR Execution] Connection Error:', err)
    }
  }
}

// Helper to get machine key from storage
const getMachineKey = (): string | null => {
  try {
    return localStorage.getItem('machine_key') || sessionStorage.getItem('machine_key') || null
  } catch {
    return null
  }
}

// Helper to create a SignalR hub connection
const createSignalRConnection = (tenant: string): HubConnection => {
  const hubUrl = `/${tenant}/hubs/botagent`

  const machineKey = getMachineKey()
  const authToken = getAuthToken()

  console.debug(
    '[SignalR Execution] Creating connection with',
    machineKey ? 'machineKey authentication' : 'token authentication',
  )

  const connectionOptions = {
    accessTokenFactory: machineKey ? undefined : () => authToken || '',
    transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    headers: {
      ...(machineKey ? { 'X-Machine-Key': machineKey } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...(machineKey
      ? {
          queryString: `machineKey=${encodeURIComponent(machineKey)}`,
        }
      : {}),
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

export function useExecutionStatus(
  tenant: string,
  onStatusUpdate?: (update: ExecutionStatusUpdate) => void,
) {
  const [executionStatuses, setExecutionStatuses] = useState<Record<string, ExecutionStatusUpdate>>({})
  const connectionRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    if (!tenant) return

    const connection = createSignalRConnection(tenant)

    // Register handler for connection closed events
    connection.onclose((error) => {
      if (error) {
        if (error.message && isExpectedSignalRError(error.message)) {
          console.debug('[SignalR Execution] Connection issue - will automatically reconnect if possible')
        } else {
          console.error('[SignalR Execution] Connection closed with error:', error)
        }
      }
    })

    // Listen for ExecutionStatusUpdate events
    connection.on(
      'ExecutionStatusUpdate',
      (update: {
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
      }) => {
        // Normalize keys to camelCase
        const normalized: ExecutionStatusUpdate = {
          botAgentId: update.botAgentId ?? update.BotAgentId ?? '',
          botAgentName: update.botAgentName ?? update.BotAgentName ?? '',
          status: update.status ?? update.Status ?? '',
          executionId: update.executionId ?? update.ExecutionId ?? '',
          message: update.message ?? update.Message,
          timestamp: update.timestamp ?? update.Timestamp ?? new Date().toISOString(),
        }
        
        console.debug('[SignalR Execution] ExecutionStatusUpdate received:', normalized)
        
        // Store by executionId instead of botAgentId for execution tracking
        setExecutionStatuses((prev) => ({ 
          ...prev, 
          [normalized.executionId]: normalized 
        }))
        
        if (onStatusUpdate) onStatusUpdate(normalized)
      },
    )

    // Register reconnection handlers
    connection.onreconnecting((error) => {
      console.debug('[SignalR Execution] Attempting to reconnect...', error?.message)
    })

    connection.onreconnected((connectionId) => {
      console.debug('[SignalR Execution] Reconnected successfully with ID:', connectionId)
    })

    // Start the connection
    startSignalRConnection(connection)
    connectionRef.current = connection

    return () => {
      connection.stop().catch((err) => {
        console.debug('[SignalR Execution] Error during connection stop:', err?.message)
      })
    }
  }, [tenant, onStatusUpdate])

  return executionStatuses
} 