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
      .withAutomaticReconnect()
      .withServerTimeout(120000) // Increase server timeout to 2 minutes
      .build();

    // Register handler for connection closed events
    connection.onclose((error) => {
      if (error) {
        // Filter out server timeout errors from the console
        if (error.message && error.message.includes('Server timeout elapsed')) {
          // Silently handle server timeout errors - this is expected behavior
          console.debug('[SignalR] Connection timeout - will automatically reconnect');
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
      console.log('[SignalR] BotStatusUpdate received:', normalized);
      setAgentStatuses(prev => ({ ...prev, [normalized.botAgentId]: normalized }));
      if (onStatusUpdate) onStatusUpdate(normalized);
    });

    // Add error handling for connection start
    connection.start()
      .catch(err => {
        // Filter out known errors to prevent console noise
        if (err && err.message && !err.message.includes('Server timeout elapsed')) {
          console.error('[SignalR] Connection Error:', err);
        }
      });

    connectionRef.current = connection;
    return () => {
      connection.stop().catch(err => {
        // Silently handle stop errors
        console.debug('[SignalR] Error during connection stop:', err);
      });
    };
  }, [tenant, onStatusUpdate]);

  return agentStatuses;
} 