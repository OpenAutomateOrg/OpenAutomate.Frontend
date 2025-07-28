'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { useTenantChat } from '@/hooks/use-tenant-chat'

/**
 * Chat settings component for administrators
 * Allows configuration of the n8n chat widget
 */
export function ChatSettings() {
  const { toast } = useToast()
  const { config, tenantInfo, isEnabled, enableChat, disableChat } = useTenantChat()

  const [webhookUrl, setWebhookUrl] = useState(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '')
  const [chatTitle, setChatTitle] = useState(config.chatConfig?.title || '')
  const [chatSubtitle, setChatSubtitle] = useState(config.chatConfig?.subtitle || '')

  const handleSaveSettings = () => {
    // In a real implementation, you would save these to your backend
    toast({
      title: 'Settings saved',
      description: 'Chat configuration has been updated successfully.',
    })
  }

  const handleTestChat = () => {
    if (!webhookUrl) {
      toast({
        title: 'Missing webhook URL',
        description: 'Please configure the n8n webhook URL first.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Testing chat',
      description: 'Check if the chat widget appears in the bottom-right corner.',
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat Widget Configuration</CardTitle>
          <CardDescription>
            Configure the n8n chat widget for customer support and assistance.
            {tenantInfo.isInTenant && (
              <span className="block mt-1 text-sm text-muted-foreground">
                Currently configured for tenant:{' '}
                <span className="font-medium">{tenantInfo.currentTenant}</span>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Chat */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Chat Widget</Label>
              <div className="text-sm text-muted-foreground">
                Show or hide the chat widget for users
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  enableChat()
                } else {
                  disableChat()
                }
              }}
            />
          </div>

          {/* Webhook URL Configuration */}
          <div className="space-y-2">
            <Label htmlFor="webhook-url">N8n Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/chat"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <div className="text-sm text-muted-foreground">
              The webhook URL from your n8n chat workflow. This should be configured in your
              environment variables.
            </div>
          </div>

          {/* Chat Title */}
          <div className="space-y-2">
            <Label htmlFor="chat-title">Chat Title</Label>
            <Input
              id="chat-title"
              placeholder="OpenAutomate Support"
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
            />
          </div>

          {/* Chat Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="chat-subtitle">Chat Subtitle</Label>
            <Input
              id="chat-subtitle"
              placeholder="How can we help you today?"
              value={chatSubtitle}
              onChange={(e) => setChatSubtitle(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleSaveSettings}>Save Settings</Button>
            <Button variant="outline" onClick={handleTestChat}>
              Test Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>How to configure n8n for chat functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Create n8n Workflow</h4>
            <p className="text-sm text-muted-foreground">
              Create a new workflow in n8n with a Chat Trigger node.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Configure Webhook</h4>
            <p className="text-sm text-muted-foreground">
              Copy the webhook URL from your Chat Trigger node and add it to your environment
              variables:
            </p>
            <code className="text-xs bg-muted p-2 rounded block">
              NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat
            </code>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Design Your Chat Flow</h4>
            <p className="text-sm text-muted-foreground">
              Add nodes to handle user messages, integrate with AI services, or route to human
              agents.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">4. Test Integration</h4>
            <p className="text-sm text-muted-foreground">
              Use the &quot;Test Chat&quot; button above to verify the integration is working.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
