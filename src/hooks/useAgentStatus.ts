import { useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { getAuthToken } from '@/lib/auth/token-storage';

export interface AgentStatusUpdate {
  botAgentId: string;
  botAgentName: string;
  status: string;
  executionId?: string;
  timestamp: string;
  lastHeartbeat?: string;
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
    'Cannot start a HubConnection'
  ];
  
  return expectedErrors.some(errorText => message.includes(errorText));
};

// Helper function to retry connection after timeout
const retryConnectionAfterDelay = (connection: HubConnection) => {
  console.debug('[SignalR] Attempting to reconnect after delay...');
  connection.start().catch((reconnectError: Error | unknown) => {
    const errorMessage = reconnectError instanceof Error ? reconnectError.message : 'Unknown error';
    console.debug('[SignalR] Reconnection attempt also failed:', errorMessage);
  });
};

// Helper to start a SignalR connection with error handling
const startSignalRConnection = async (connection: HubConnection) => {
  try {
    await connection.start();
    console.debug('[SignalR] Connected successfully');
  } catch (err: Error | unknown) {
    if (err instanceof Error && err.message && isExpectedSignalRError(err.message)) {
      console.debug('[SignalR] Expected connection issue (suppressed):', err.message);
      
      // For Vercel deployments, we might need to retry with different transport
      setTimeout(() => retryConnectionAfterDelay(connection), 3000);
    } else {
      console.error('[SignalR] Connection Error:', err);
    }
  }
};

// Helper to get machine key from storage
const getMachineKey = (): string | null => {
  try {
    return localStorage.getItem('machine_key') || sessionStorage.getItem('machine_key') || null;
  } catch {
    // Silent fail if localStorage/sessionStorage is unavailable
    return null;
  }
};

// Helper to create a SignalR hub connection
const createSignalRConnection = (tenant: string): HubConnection => {
  const hubUrl = `/${tenant}/hubs/botagent`;
  
  // Get the machine key if needed (for bot agent clients)
  const machineKey = getMachineKey();
  const authToken = getAuthToken();
  
  console.debug('[SignalR] Creating connection with', 
    machineKey ? 'machineKey authentication' : 'token authentication');
  
  // Configure options for the connection
  const connectionOptions = {
    // If we have a machine key, don't use token authentication as it will conflict
    accessTokenFactory: machineKey ? undefined : () => authToken || '',
    
    // Support both WebSockets and Long Polling for maximum compatibility
    transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    
    // Always add headers for compatibility with different auth methods
    headers: {
      // If we have a machine key, pass it as a header for secondary authentication
      ...(machineKey ? { 'X-Machine-Key': machineKey } : {}),
      
      // Always include the authorization header if we have a token
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    },
    
    // Use specific query params for bot agents if available
    ...(machineKey ? { 
      queryString: `machineKey=${encodeURIComponent(machineKey)}` 
    } : {})
  };
  
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl, connectionOptions)
    .configureLogging(LogLevel.Warning)
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: retryContext => {
        // Custom retry policy with exponential backoff
        const delayMs = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 60000);
        return delayMs;
      }
    })
    .withServerTimeout(120000) // 2 minute server timeout
    .withKeepAliveInterval(30000) // 30 second keep-alive
    .build();
  
  return connection;
};

export function useAgentStatus(
  tenant: string,
  onStatusUpdate?: (update: AgentStatusUpdate) => void
) {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatusUpdate>>({});
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!tenant) return;
    
    const connection = createSignalRConnection(tenant);
    
    // Register handler for connection closed events
    connection.onclose((error) => {
      if (error) {
        // Filter out expected SignalR errors from the console
        if (error.message && isExpectedSignalRError(error.message)) {
          // Silently handle expected errors - this is expected behavior
          console.debug('[SignalR] Connection issue - will automatically reconnect if possible');
        } else {
          // Log other errors normally
          console.error('[SignalR] Connection closed with error:', error);
        }
      }
    });

    connection.on('BotStatusUpdate', (update: {
      botAgentId?: string;
      BotAgentId?: string;
      botAgentName?: string;
      BotAgentName?: string;
      status?: string;
      Status?: string;
      executionId?: string;
      ExecutionId?: string;
      timestamp?: string;
      Timestamp?: string;
      lastHeartbeat?: string;
      LastHeartbeat?: string;
    }) => {
      // Normalize keys to camelCase
      const normalized: AgentStatusUpdate = {
        botAgentId: update.botAgentId ?? update.BotAgentId ?? '',
        botAgentName: update.botAgentName ?? update.BotAgentName ?? '',
        status: update.status ?? update.Status ?? '',
        executionId: update.executionId ?? update.ExecutionId,
        timestamp: update.timestamp ?? update.Timestamp ?? new Date().toISOString(),
        lastHeartbeat: update.lastHeartbeat ?? update.LastHeartbeat,
      };
      console.debug('[SignalR] BotStatusUpdate received:', normalized);
      setAgentStatuses(prev => ({ ...prev, [normalized.botAgentId]: normalized }));
      if (onStatusUpdate) onStatusUpdate(normalized);
    });

    // Register reconnection handlers for better error visibility
    connection.onreconnecting(error => {
      console.debug('[SignalR] Attempting to reconnect...', error?.message);
    });

    connection.onreconnected(connectionId => {
      console.debug('[SignalR] Reconnected successfully with ID:', connectionId);
    });

    connection.onreconnected(connectionId => {
      console.debug('[SignalR] Reconnected successfully with ID:', connectionId);
    });
    // Start the connection
    startSignalRConnection(connection);
    connectionRef.current = connection;
    
    return () => {
      connection.stop().catch(err => {
        // Silently handle stop errors
        console.debug('[SignalR] Error during connection stop:', err?.message);
      });
    };
  }, [tenant, onStatusUpdate]);

  return agentStatuses;
} 