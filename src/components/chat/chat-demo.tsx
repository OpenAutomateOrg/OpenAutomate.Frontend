'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatWrapper } from './chat-wrapper'

/**
 * Demo component to test the chat typing indicator functionality
 * This component provides a way to test the chat without needing a full n8n setup
 */
export function ChatDemo() {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat Typing Indicator Demo</CardTitle>
          <CardDescription>
            Test the chat typing indicator functionality. When you send a message, 
            you should see a "Assistant is typing..." indicator with animated dots 
            while waiting for the response.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={() => setIsVisible(!isVisible)}
              variant="outline"
            >
              {isVisible ? 'Hide' : 'Show'} Chat
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">How to Test:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Make sure the chat widget is visible (orange chat button in bottom-right)</li>
              <li>Click the chat button to open the chat window</li>
              <li>Type a message and press Enter or click Send</li>
              <li>You should see "Assistant is typing..." with animated dots</li>
              <li>The indicator will disappear when the response arrives or after 30 seconds</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Features:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Typing indicator appears immediately when sending a message</li>
              <li>Animated dots show processing activity</li>
              <li>Indicator disappears when response is received</li>
              <li>30-second timeout prevents indicator from staying forever</li>
              <li>Matches chat theme (light/dark mode)</li>
              <li>Smooth fade-in animation</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Technical Details:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Intercepts fetch requests to n8n webhook</li>
              <li>Shows typing indicator on message send</li>
              <li>Hides indicator on response or error</li>
              <li>Uses CSS animations for smooth effects</li>
              <li>Automatically scrolls to show indicator</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Chat component */}
      {isVisible && <ChatWrapper />}
    </div>
  )
}
