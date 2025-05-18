import { useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
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
    'Transport disconnected'
  ];
  
  return expectedErrors.some(errorText => message.includes(errorText));
};

export function useAgentStatus(
  tenant: string,
  onStatusUpdate?: (update: AgentStatusUpdate) => void
) {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatusUpdate>>({});
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!tenant) return;
    const hubUrl = `/${tenant}/hubs/botagent`;
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getAuthToken() || ''
      })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          // Custom retry policy with exponential backoff
          const delayMs = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          return delayMs;
        }
      })
      .withServerTimeout(120000) // Increase server timeout to 2 minutes
      .build();

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

    // Add error handling for connection start
    connection.start()
      .catch(err => {
        // Filter out known errors to prevent console noise
        if (err && err.message && !isExpectedSignalRError(err.message)) {
          console.error('[SignalR] Connection Error:', err);
        } else {
          console.debug('[SignalR] Expected connection issue (suppressed):', err?.message);
        }
      });

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