# Chat Typing Indicator Implementation

## Overview

The chat typing indicator provides visual feedback to users when the AI assistant is processing their message. It shows an animated "Assistant is typing..." message with bouncing dots while waiting for the response from the n8n webhook.

## Features

- **Immediate Response**: Shows typing indicator as soon as a message is sent
- **Animated Dots**: Three bouncing dots indicate active processing
- **Theme Integration**: Matches the current chat theme (light/dark mode)
- **Auto-cleanup**: Automatically removes indicator when response arrives
- **Timeout Protection**: 30-second timeout prevents indicator from staying forever
- **Smooth Animations**: Fade-in effect for better user experience

## Implementation Details

### Core Components

1. **State Management**: Uses React state to track typing status
2. **Fetch Interception**: Intercepts n8n webhook requests to trigger indicators
3. **DOM Manipulation**: Dynamically injects typing indicator into chat UI
4. **CSS Animations**: Provides smooth visual effects

### Key Files Modified

- `src/components/chat/n8n-chat.tsx` - Main implementation
- `src/components/chat/chat-demo.tsx` - Demo component for testing

### How It Works

1. **Message Send**: When user sends a message, `handleTypingStart()` is called
2. **Indicator Injection**: Typing indicator is injected into the chat DOM
3. **Response Handling**: When response arrives, `handleTypingEnd()` is called
4. **Cleanup**: Indicator is removed and timeout is cleared

## Usage

The typing indicator is automatically enabled for all chat instances. No additional configuration is required.

### Testing

Use the `ChatDemo` component to test the functionality:

```tsx
import { ChatDemo } from '@/components/chat/chat-demo'

export function TestPage() {
  return <ChatDemo />
}
```

## Technical Implementation

### Fetch Interception

```typescript
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  // Show typing indicator when sending message
  if (onTypingStart && originalChatInput.trim()) {
    onTypingStart()
  }

  try {
    const response = await originalFetch(input, modifiedOptions)
    // Hide typing indicator when response received
    if (onTypingEnd) {
      onTypingEnd()
    }
    return response
  } catch (error) {
    // Hide typing indicator on error
    if (onTypingEnd) {
      onTypingEnd()
    }
    throw error
  }
}
```

### DOM Injection

The typing indicator is dynamically created and injected into the chat container:

```typescript
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
```

### CSS Animations

```css
.typing-indicator-dots span {
  animation: typingDot 1.4s infinite ease-in-out;
}

@keyframes typingDot {
  0%,
  60%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  30% {
    opacity: 1;
    transform: scale(1.2);
  }
}
```

## Customization

### Styling

The typing indicator uses CSS custom properties that match the chat theme:

- `--chat--message--bot--background`: Background color
- `--chat--message--bot--color`: Text color

### Timeout Duration

The default timeout is 30 seconds. To modify:

```typescript
typingTimeoutRef.current = setTimeout(() => {
  setIsTyping(false)
}, 30000) // Change this value
```

### Message Text

To customize the typing message, modify the innerHTML in the injection function:

```typescript
<div class="typing-indicator-text">Your custom message</div>
```

## Troubleshooting

### Indicator Not Showing

1. Check if n8n webhook URL is configured
2. Verify chat is enabled and loaded
3. Ensure message is not empty

### Indicator Not Disappearing

1. Check network connectivity
2. Verify n8n webhook is responding
3. Check browser console for errors

### Styling Issues

1. Verify CSS custom properties are set
2. Check for conflicting styles
3. Ensure theme is properly applied

## Browser Compatibility

- Modern browsers with ES6+ support
- CSS custom properties support required
- Fetch API support required

## Performance Considerations

- Minimal DOM manipulation
- Efficient CSS animations
- Automatic cleanup prevents memory leaks
- Timeout prevents indefinite indicators
