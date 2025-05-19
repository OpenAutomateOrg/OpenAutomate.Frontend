# Real-Time Agent Status Updates in OpenAutomate Frontend

## Overview
This document describes how to implement real-time agent status updates in the OpenAutomate frontend using SignalR. The goal is for the agent list and detail pages to instantly reflect status changes (Available, Busy, Disconnected) for all agents in a tenant, without requiring manual refresh or polling.

- **Backend:** Uses a SignalR hub (`BotAgentHub.cs`) to broadcast status changes to all clients in a tenant.
- **Frontend:** Uses Next.js (React) to connect to the SignalR hub and update the UI in real time.

---

## Architecture

```mermaid
graph TD
    subgraph Backend
        A[BotAgentHub.cs (SignalR Hub)]
        B[BotAgentService]
    end
    subgraph Frontend
        C[Next.js/React]
        D[Custom useAgentStatus hook]
        E[Agent List/Detail Page]
    end
    A -- broadcasts status --> C
    C -- updates UI --> E
    D -- manages connection --> C
    B -- updates status --> A
```

- **BotAgentHub.cs**: Receives status updates from agents and broadcasts them to all clients in the tenant group.
- **Frontend**: Subscribes to status updates via SignalR and updates the UI accordingly.

---

## Backend: How Status is Broadcast

- When an agent connects/disconnects or sends a status update, `BotAgentHub` broadcasts a message to all clients in the tenant group:
  - `BotStatusChanged`: When an agent connects/disconnects
  - `BotStatusUpdate`: When an agent's status changes (Available, Busy, Disconnected)

**Relevant code in `BotAgentHub.cs`:**
```csharp
// On agent status update
await Clients.Group($"tenant-{_tenantContext.CurrentTenantId}").SendAsync(
    "BotStatusUpdate", new {
        BotAgentId = botAgent.Id,
        BotAgentName = botAgent.Name,
        Status = botAgent.Status,
        ExecutionId = executionId,
        Timestamp = DateTime.UtcNow
    });
```

---

## Frontend: Connecting to the SignalR Hub

### 1. Install SignalR Client
```bash
npm install @microsoft/signalr
```

### 2. Create a Custom React Hook: `useAgentStatus`
This hook manages the SignalR connection and agent status state for a tenant.

```tsx
import { useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';

export interface AgentStatusUpdate {
  BotAgentId: string;
  BotAgentName: string;
  Status: string;
  ExecutionId?: string;
  Timestamp: string;
}

export function useAgentStatus(tenant: string) {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatusUpdate>>({});
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const hubUrl = `/${tenant}/hubs/botagent`;
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    connection.on('BotStatusUpdate', (update: AgentStatusUpdate) => {
      setAgentStatuses(prev => ({ ...prev, [update.BotAgentId]: update }));
    });

    connection.start()
      .catch(err => console.error('SignalR Connection Error:', err));

    connectionRef.current = connection;
    return () => {
      connection.stop();
    };
  }, [tenant]);

  return agentStatuses;
}
```

### 3. Integrate with Agent Page
In your agent list or detail page (e.g., `src/components/agent/agent.tsx` or `agentDetail.tsx`):

```tsx
import { useAgentStatus } from '@/hooks/useAgentStatus';

const tenant = /* get from router or context */;
const agentStatuses = useAgentStatus(tenant);

// Example: Render agent list with real-time status
agents.map(agent => (
  <div key={agent.id}>
    <span>{agent.name}</span>
    <span>{agentStatuses[agent.id]?.Status ?? agent.status}</span>
  </div>
));
```

---

## Best Practices
- **Connection Management:** Use `.withAutomaticReconnect()` for resilience.
- **Tenant Isolation:** Always connect to the correct tenant hub URL (e.g., `/acme-corp/hubs/botagent`).
- **State Sync:** On initial page load, fetch the current agent list/status from the API, then apply real-time updates from SignalR.
- **Cleanup:** Always stop the SignalR connection on component unmount.
- **Error Handling:** Log and handle connection errors gracefully.

---

## Required Configuration
- **Proxy (Next.js Dev):** If using a local dev server, proxy `/[tenant]/hubs/botagent` to your backend API. See `docs/NextJS-Proxy-Rules.md` and `ReverseProxySignalRImplementation.md`.
- **CORS:** Ensure your backend SignalR hub allows connections from your frontend domain.
- **Authentication:** If your hub requires auth, pass tokens via headers or query string as needed.

---

## Scalability & Reliability
- **SignalR Scaling:** For production, use a backplane (e.g., Redis) if you have multiple backend instances.
- **Connection Limits:** Monitor and tune SignalR server settings for expected client load.
- **Reconnect Logic:** Use `.withAutomaticReconnect()` and handle reconnection events in the UI if needed.

---

## References
- **Backend Hub:** `OpenAutomate.Backend/OpenAutomate.API/Hubs/BotAgentHub.cs`
- **Frontend Agent Page:** `src/components/agent/agent.tsx`, `agentDetail.tsx`
- **Custom Hook Example:** `src/hooks/useAgentStatus.ts`
- **Proxy Config:** `docs/NextJS-Proxy-Rules.md`, `docs/ReverseProxySignalRImplementation.md`

---

## Troubleshooting
- **No Updates?** Check browser console for SignalR errors. Ensure correct hub URL and CORS/proxy config.
- **Multiple Tenants:** Each tenant should connect to their own hub URL for isolation.
- **Status Out of Sync?** Ensure backend always broadcasts on status change and frontend merges updates into state.

---

## Summary
With this setup, your agent list and detail pages will always show the latest status for all agents in a tenant, in real time, with no manual refresh or polling required. 