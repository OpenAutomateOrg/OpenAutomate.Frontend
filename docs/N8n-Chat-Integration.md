# N8n Chat Integration for OpenAutomate

## Overview

This document describes the integration of n8n chat functionality into the OpenAutomate frontend. The chat widget provides users with support and assistance directly within the application with full business context integration.

## Features

- 🎨 **Theme Integration**: Automatically adapts to light/dark theme
- 🔧 **Configurable**: Full n8n chat configuration support
- 📱 **Responsive**: Works on desktop and mobile devices
- 🎯 **User-Aware**: Personalized greeting and context based on authenticated user
- 🏢 **Tenant-Aware**: Automatically includes tenant context in conversations
- ⚡ **Performance**: Lazy-loaded, doesn't impact initial page load
- 🛡️ **TypeScript**: Fully typed for better development experience
- 🌍 **Internationalization**: Built-in i18n support
- 📧 **Rich Context**: Passes user, tenant, and business context directly in message payload

## Quick Setup

### 1. Environment Configuration

Add your n8n webhook URL to your environment variables:

```env
# .env.local
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat
```

### 2. N8n Workflow Setup

1. Create a new workflow in n8n
2. Add a **Chat Trigger** node
3. Configure your chat flow (AI integration, human handoff, etc.)
4. Copy the webhook URL from the Chat Trigger node
5. Add it to your environment variables

### 3. Verification

The chat widget will automatically appear in the bottom-right corner when:

- User is authenticated
- User is within a tenant context (on `/[tenant]/*` routes)
- Webhook URL is configured
- Chat is enabled (default: true)

## Enhanced Configuration

### Complete Chat Configuration Options

The chat widget now supports all n8n chat options with OpenAutomate business context:

```tsx
interface TenantChatConfig {
  webhookUrl?: string
  enabled?: boolean
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  chatConfig?: {
    // Window configuration
    width?: string // Default: '420px'
    height?: string // Default: '650px'

    // n8n chat specific options
    mode?: 'window' | 'fullscreen' // Default: 'window'
    chatInputKey?: string // Default: 'chatInput'
    chatSessionKey?: string // Default: 'sessionId'
    loadPreviousSession?: boolean // Default: true
    metadata?: Record<string, any> // Rich business context
    showWelcomeScreen?: boolean // Default: false
    defaultLanguage?: string // Default: 'en'
    initialMessages?: string[] // Personalized welcome messages
    i18n?: Record<
      string,
      {
        // Full internationalization
        title: string
        subtitle: string
        footer: string
        getStarted: string
        inputPlaceholder: string
        closeButtonTooltip: string
      }
    >
    // Webhook configuration
    webhookConfig?: {
      method?: 'POST' | 'GET'
      headers?: Record<string, string>
    }
  }
}
```

### Enhanced Payload Structure

The chat now sends a clean, minimal payload with only the essential fields to n8n:

```json
{
  "sessionId": "f4d626c289cc4d4b87b41e17ccfd0aab",
  "action": "sendMessage",
  "chatInput": "what is the available tools"
}
```

This approach provides:

- **Clean Structure**: Only the three essential fields n8n needs
- **No Context Pollution**: User messages remain exactly as typed
- **Standard Format**: Normal n8n Chat Trigger payload format
- **Simple Processing**: Direct access to user input without parsing

### Accessing Data in N8n Workflows

In your n8n Chat Trigger node, you can access the data directly:

```javascript
// Get the user's message exactly as they typed it
const userMessage = $json.chatInput

// Get session for conversation continuity
const sessionId = $json.sessionId

// Action is always "sendMessage" for chat messages
const action = $json.action
```

### Example N8n Workflow Configurations

#### 1. Simple AI Assistant

```json
{
  "nodes": [
    {
      "name": "Chat Trigger",
      "type": "@n8n/n8n-nodes-langchain.chatTrigger"
    },
    {
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "parameters": {
        "agent": "conversationalAgent",
        "promptType": "define",
        "text": "You are an AI assistant for OpenAutomate. Help users with their questions.\n\nUser message: {{ $json.chatInput }}\nSession: {{ $json.sessionId }}"
      }
    }
  ]
}
```

#### 2. Echo Bot with Session Tracking

```json
{
  "nodes": [
    {
      "name": "Chat Trigger",
      "type": "@n8n/n8n-nodes-langchain.chatTrigger"
    },
    {
      "name": "Process Message",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "const userMessage = $input.item.json.chatInput;\nconst sessionId = $input.item.json.sessionId;\n\nreturn [{\n  json: {\n    response: `You said: \"${userMessage}\" (Session: ${sessionId})`\n  }\n}];"
      }
    }
  ]
}
```

#### 3. Help Desk with Response Routing

```json
{
  "nodes": [
    {
      "name": "Chat Trigger",
      "type": "@n8n/n8n-nodes-langchain.chatTrigger"
    },
    {
      "name": "Check Intent",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.chatInput.toLowerCase() }}",
              "operation": "contains",
              "value2": "help"
            }
          ]
        }
      }
    },
    {
      "name": "Help Response",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "parameters": {
        "agent": "conversationalAgent",
        "promptType": "define",
        "text": "Provide helpful assistance for: {{ $json.chatInput }}"
      }
    },
    {
      "name": "General Response",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "parameters": {
        "agent": "conversationalAgent",
        "promptType": "define",
        "text": "Provide a general response to: {{ $json.chatInput }}"
      }
    }
  ]
}
```

## Business Context Integration

The chat automatically includes rich business context in every conversation:

```javascript
// Additional metadata available in the metadata field
{
  tenant: "fpt-education",           // Current tenant slug
  userId: "user-123",                // User ID
  userEmail: "john.doe@company.com", // User email
  userName: "John Doe",              // Full user name
  userRole: 0,                       // System role (User=0, Admin=1)
  timestamp: "2025-01-01T12:00:00Z", // Request timestamp
  platform: "openAutomate",         // Platform identifier
  source: "frontend-chat",           // Source identifier
  hasToken: true                     // Whether JWT token is available
}
```

### Personalized User Experience

- **Dynamic Greetings**: "Hi John! 👋" with user's actual name
- **Tenant-Specific Support**: Context-aware assistance for each organization
- **Context-Aware Messages**: Welcome messages mention automation workflows
- **Business-Focused Placeholder**: "Ask about automation, or anything else..."

## Architecture

### Components

```
src/components/chat/
├── n8n-chat.tsx          # Core chat component with payload modification
├── chat-wrapper.tsx      # Tenant-aware integration wrapper
└── chat-settings.tsx     # Admin configuration interface
```

### Hooks

```
src/hooks/
├── use-n8n-chat.ts       # General chat state management (deprecated)
└── use-tenant-chat.ts    # Enhanced tenant-aware chat hook (recommended)
```

### Styles

```
src/styles/
└── chat.css              # Custom styling and OpenAutomate theme integration
```

## Component Usage

### Automatic Integration (Recommended)

The chat is automatically included in the tenant-specific layout:

```tsx
// Already integrated in src/app/[tenant]/layout.tsx
import { ChatProvider } from '@/components/chat/chat-wrapper'

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <TenantGuard>
      <ChatProvider>
        <div className="[--header-height:calc(theme(spacing.14))]">{children}</div>
      </ChatProvider>
    </TenantGuard>
  )
}
```

### Manual Integration with Full Configuration

```tsx
import { N8nChat } from '@/components/chat/n8n-chat'

export function CustomChatImplementation() {
  return (
    <N8nChat
      webhookUrl="https://your-n8n-instance.com/webhook/chat"
      enabled={true}
      position="bottom-right"
      chatConfig={{
        width: '450px',
        height: '700px',
        mode: 'window',
        loadPreviousSession: true,
        showWelcomeScreen: false,
        metadata: {
          customContext: 'additional-business-data',
        },
        webhookConfig: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Header': 'value',
          },
        },
        initialMessages: [
          'Welcome to support!',
          'How can I help you with your automation workflows?',
        ],
        i18n: {
          en: {
            title: 'Custom Support',
            subtitle: "We're here to help",
            footer: 'Powered by OpenAutomate',
            getStarted: 'Start Chat',
            inputPlaceholder: 'Type your message...',
            closeButtonTooltip: 'Close chat window',
          },
        },
      }}
    />
  )
}
```

### Using the Enhanced Tenant-Aware Hook

```tsx
import { useTenantChat } from '@/hooks/use-tenant-chat'

export function ChatStatus() {
  const { config, tenantInfo, isEnabled, toggleChat } = useTenantChat()

  return (
    <div className="space-y-4">
      <div>
        <h3>Chat Status</h3>
        <p>Tenant: {tenantInfo.tenantDisplayName || 'None'}</p>
        <p>In Tenant Context: {tenantInfo.isInTenant ? 'Yes' : 'No'}</p>
        <p>Chat Enabled: {isEnabled ? 'Yes' : 'No'}</p>
      </div>

      <div>
        <h3>Current Configuration</h3>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </div>

      <button onClick={toggleChat}>{isEnabled ? 'Disable' : 'Enable'} Chat</button>
    </div>
  )
}
```

## Admin Configuration

```tsx
import { ChatSettings } from '@/components/chat/chat-settings'

export function AdminPanel() {
  return (
    <div className="admin-panel">
      <h1>Chat Configuration</h1>
      <ChatSettings />
    </div>
  )
}
```

## TypeScript Support

The implementation is fully typed for better development experience:

```tsx
// Full type definitions ensure proper usage
const config: TenantChatConfig = useTenantChat().config
```

## Security Considerations

### Data Privacy

- User context is passed securely through request payload
- No sensitive data stored in client-side code
- Backend validation required in n8n workflow
- GDPR/privacy compliant context passing

### Authentication

- Chat only appears for authenticated users
- Tenant context ensures data isolation
- Business context validates user permissions

## Performance Optimizations

- **Lazy Loading**: Chat library loaded only when needed
- **Dynamic Imports**: n8n chat imported client-side only
- **Memoized Configuration**: Configuration cached based on user/tenant
- **Conditional Rendering**: Chat widget only renders when enabled
- **Payload Interception**: Minimal overhead for context injection

## Troubleshooting

### Common Issues

1. **Chat not appearing**

   - Check user authentication status
   - Verify tenant context (must be on `/[tenant]/*` route)
   - Confirm webhook URL is configured
   - Check browser console for errors

2. **Context not reaching n8n**

   - Verify payload structure in browser network tab
   - Check n8n workflow Chat Trigger configuration
   - Test with simple workflow to isolate issues
   - Ensure proper field access in n8n expressions

3. **Styling issues**
   - Ensure chat.css is imported
   - Check CSS variable overrides
   - Verify theme integration

### Debug Mode

Enable debug mode to see payload structure:

```javascript
// Check browser console for this log
console.log('Modified payload sent to n8n:', modifiedPayload)
```

### Testing Payload Structure

Create a simple n8n workflow to test payload reception:

```json
{
  "nodes": [
    {
      "name": "Chat Trigger",
      "type": "@n8n/n8n-nodes-langchain.chatTrigger"
    },
    {
      "name": "Debug",
      "type": "n8n-nodes-base.noOp",
      "parameters": {},
      "executeOnce": false
    }
  ]
}
```

Check the Debug node output to see the complete payload structure.

## Migration Guide

### To Clean Three-Field Payload

**Previous Implementation (Query Parameters):**

```
URL: https://webhook.com/chat?tenant=fpt-education&email=user@domain.com
```

**Previous Implementation (Separate Payload Fields):**

```json
{
  "chatInput": "user message",
  "tenant-slug": "fpt-education",
  "email": "user@domain.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Current Implementation (Clean Three Fields):**

```json
{
  "sessionId": "abc123",
  "action": "sendMessage",
  "chatInput": "user message"
}
```

### Updating N8n Workflows

**Old way (query parameters):**

```javascript
const tenant = $request.query.tenant
const email = $request.query.email
const userMessage = $request.query.message
```

**Old way (separate payload fields):**

```javascript
const tenant = $json['tenant-slug']
const email = $json.email
const token = $json.token
const userMessage = $json.chatInput
```

**New way (clean payload):**

```javascript
// Direct access to clean fields
const userMessage = $json.chatInput
const sessionId = $json.sessionId
const action = $json.action
```

## Next Steps

- Consider implementing webhook middleware for additional payload customization
- Add support for custom business context fields
- Implement chat analytics and user tracking
- Add support for file uploads and rich media
- Integrate with OpenAutomate's notification system

## API Reference

### useTenantChat Hook

```

```
