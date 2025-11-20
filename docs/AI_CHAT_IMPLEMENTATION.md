# GutCheck AI Chat Implementation

## Overview

GutCheck uses Anthropic's Claude Sonnet 4.5 AI model to provide intelligent, empathetic conversations that help users identify manipulation patterns, red flags, and get guidance on difficult social situations.

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Chat Screen                          │
│                      (src/app/chat.tsx)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Analysis Store                           │
│             (src/lib/stores/analysisStore.ts)               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Service (Core)                         │
│                   (src/lib/ai.ts)                           │
│                                                             │
│  • handleConversation()                                     │
│  • getDirectClaudeResponse()                                │
│  • getConversationalResponse()                              │
│  • analyzeWithAnthropic()                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 Anthropic Claude API                        │
│              https://api.anthropic.com                      │
│                Model: claude-sonnet-4-5-20250929            │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. **Conversational AI**
- Real-time chat with Claude Sonnet 4.5
- Context-aware responses based on conversation history
- Empathetic, direct, and analytical tone
- Identifies manipulation patterns and red flags

### 2. **Multi-Modal Support**
- Text messages
- Image analysis (screenshots of conversations)
- Document analysis (PDFs)

### 3. **Conversation State Management**
- Tracks conversation stages: `initial`, `gathering`, `analysis`, `support`
- Maintains conversation history
- Persists chats to local database

### 4. **Crisis Detection**
- Identifies crisis situations
- Recommends relevant helplines based on user region
- Provides immediate danger warnings

### 5. **Typing Animation**
- Simulates natural typing for AI responses
- Enhances user experience

---

## API Configuration

### Model Details

```typescript
{
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2000,
  temperature: 0.3
}
```

### API Endpoint

```
POST https://api.anthropic.com/v1/messages
```

### Headers

```typescript
{
  'x-api-key': EXPO_PUBLIC_ANTHROPIC_API_KEY,
  'Content-Type': 'application/json',
  'anthropic-version': '2023-06-01'
}
```

### Request Body Format

```typescript
{
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1000,
  temperature: 0.7,
  system: '...system prompt...',
  messages: [
    { role: 'user', content: 'User message' },
    { role: 'assistant', content: 'AI response' },
    ...
  ]
}
```

---

## Environment Variables

### Required Variables

Add to EAS secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value YOUR_API_KEY
```

### Configuration in `app.config.js`

```javascript
extra: {
  EXPO_PUBLIC_ANTHROPIC_API_KEY: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  ...
}
```

### Accessing in Code

```typescript
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_ANTHROPIC_API_KEY;
```

---

## Key Functions

### `handleConversation()`

**Purpose**: Main entry point for chat interactions

**Parameters**:
- `userMessage`: string - The user's input
- `conversationState`: ConversationState - Current conversation state
- `conversationHistory`: string[] - Previous messages
- `hasImage`: boolean - Whether an image is attached
- `imageData`: string | undefined - Base64 image data

**Returns**: `Promise<ConversationResponse>`

```typescript
{
  response: string,       // AI's response text
  nextStage: string,     // Next conversation stage
  shouldAnalyze?: boolean // Whether to trigger analysis
}
```

---

### `getDirectClaudeResponse()`

**Purpose**: Sends messages to Claude API with full conversation context

**Features**:
- Handles multi-turn conversations
- Supports image/document attachments
- Converts local file URIs to base64
- 15-second timeout for faster responses
- Comprehensive error logging

---

### `getConversationalResponse()`

**Purpose**: Simpler API call for single-turn interactions

**Use Cases**:
- Quick responses
- Simple prompts
- No conversation history needed

---

## System Prompts

### Main System Prompt Structure

```
You are GutCheck, a sharp and insightful relationship companion...

Your approach:
- Be DIRECT and ANALYTICAL
- Identify red flags and manipulation patterns immediately
- Give specific, actionable advice
- Challenge people when they're rationalizing bad behavior
- Be empathetic but firm

STRUCTURE your responses:
1. IMMEDIATE ASSESSMENT (1-2 sentences)
2. RED FLAGS (bullet points)
3. LIKELY SCENARIOS (2-3 possibilities)
4. RECOMMENDED ACTION STEPS (specific steps)
5. REALITY CHECK (1 sentence)

HANDLING OFF-TOPIC QUESTIONS:
- Be kind and professional
- Briefly provide a helpful answer
- Gently redirect to core purpose
```

---

## Conversation Stages

### 1. **Initial** (`initial`)
- First interaction with user
- Gathering basic information
- Building rapport

### 2. **Gathering** (`gathering`)
- Collecting more context
- Asking clarifying questions
- Understanding the situation

### 3. **Analysis** (`analysis`)
- Providing pattern analysis
- Identifying red flags
- Explaining manipulation tactics

### 4. **Support** (`support`)
- Offering actionable advice
- Providing resources
- Follow-up and encouragement

---

## Error Handling

### API Key Validation

```typescript
if (!apiKey) {
  console.error('[AI] API key is missing!', {
    expoConfigPresent: !!Constants.expoConfig,
    extraPresent: !!Constants.expoConfig?.extra,
    allExtraKeys: Constants.expoConfig?.extra ? Object.keys(Constants.expoConfig.extra) : [],
  });
  throw new Error('API key is not configured.');
}
```

### HTTP Error Handling

```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error('Claude API Error:', {
    status: response.status,
    statusText: response.statusText,
    errorText: errorText,
    model: this.config.model,
  });
  throw new Error(`Anthropic API ${response.status}: ${errorText.substring(0, 300)}`);
}
```

### User-Facing Error Messages

```typescript
catch (error: any) {
  const errorMessage = error?.message || String(error);
  const debugMessage = `Connection Error: ${errorMessage.substring(0, 200)}
  
Please screenshot this message and contact support.`;
  
  return {
    response: debugMessage,
    nextStage: 'initial'
  };
}
```

---

## Image/Document Processing

### Supported Formats

- **Images**: JPEG, PNG, WebP, GIF
- **Documents**: PDF

### Processing Flow

1. **Local File URI**: `file:///path/to/image.jpg`
2. **Fetch File**: Convert to ArrayBuffer
3. **Detect Media Type**: Check file signature (magic numbers)
4. **Convert to Base64**: Encode for API transmission
5. **Add to Message**: Attach to user message in API request

### Example

```typescript
const { base64, mediaType, contentType } = await convertFileToBase64(fileUri);

const messageWithImage = {
  role: 'user',
  content: [
    { type: 'text', text: userMessage },
    { 
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: base64
      }
    }
  ]
};
```

---

## State Management (Zustand)

### Conversation Store

**Location**: `src/lib/stores/conversationStore.ts`

**State**:
```typescript
{
  conversationState: ConversationState,
  conversationHistory: Message[],
  currentChatId: string | null
}
```

**Actions**:
- `addUserMessage()`: Add user message to history
- `addAssistantResponse()`: Add AI response to history
- `updateConversationState()`: Update current stage
- `startNewConversation()`: Reset conversation
- `loadConversation()`: Load saved chat

### Analysis Store

**Location**: `src/lib/stores/analysisStore.ts`

**Key Action**:
```typescript
handleConversation: async (
  userMessage: string,
  conversationState: ConversationState,
  conversationHistory: string[],
  hasImage?: boolean,
  imageData?: string
) => Promise<ConversationResponse>
```

---

## Chat History Persistence

### Database Schema

```typescript
interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  conversation_history: Message[];
  conversation_state: ConversationState;
}
```

### Save Chat

```typescript
await saveChat({
  title: firstMessage.substring(0, 50),
  conversationHistory,
  conversationState
});
```

### Load Chat

```typescript
const chat = await getChatById(chatId);
if (chat) {
  loadConversation(
    chat.conversation_history,
    chat.conversation_state
  );
}
```

---

## UI Components

### Chat Screen Layout

```
┌─────────────────────────────────────┐
│         Header (Back, Title)        │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────┐       │
│   │  User Message (Blue)    │       │
│   └─────────────────────────┘       │
│                                     │
│       ┌─────────────────────────┐   │
│       │ AI Response (Dark)      │   │
│       └─────────────────────────┘   │
│                                     │
│   ┌─────────────────────────┐       │
│   │  User Message           │       │
│   └─────────────────────────┘       │
│                                     │
│       [Typing Indicator...]         │
│                                     │
├─────────────────────────────────────┤
│  [+]  Type your message...    [→]  │
└─────────────────────────────────────┘
```

### Typing Animation

```typescript
const simulateTyping = async (
  text: string,
  onUpdate: (partial: string) => void
) => {
  const words = text.split(' ');
  let currentText = '';
  
  for (let i = 0; i < words.length; i++) {
    currentText += (i > 0 ? ' ' : '') + words[i];
    onUpdate(currentText);
    await new Promise(resolve => setTimeout(resolve, 30));
  }
};
```

---

## Testing

### Manual Testing Checklist

- [ ] Send a simple text message
- [ ] Send a message about manipulation/red flags
- [ ] Upload and analyze a screenshot
- [ ] Upload and analyze a PDF document
- [ ] Test off-topic questions (should redirect)
- [ ] Test crisis scenarios (should show helplines)
- [ ] Verify conversation history persists
- [ ] Load a saved chat from history
- [ ] Test error scenarios (airplane mode)

### Test Messages

1. **Basic**: "Someone made me feel guilty"
2. **Manipulation**: "They said I'm crazy for thinking that way"
3. **Gaslighting**: "He keeps telling me things never happened"
4. **Crisis**: "They're threatening me if I leave"
5. **Off-topic**: "What's 2+2?" (should redirect)

---

## Troubleshooting

### Issue: "API key is not configured"

**Solution**:
1. Verify API key in EAS secrets: `eas secret:list`
2. Rebuild app to inject new secrets
3. Check `Constants.expoConfig.extra` in logs

### Issue: Model not found (404 error)

**Solution**:
1. Verify model name: `claude-sonnet-4-5-20250929`
2. Check Anthropic documentation for latest models
3. Test API key with curl:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Issue: Timeout errors

**Solution**:
- Increase timeout in `getDirectClaudeResponse()` (currently 15s)
- Check user's internet connection
- Verify Anthropic API status

### Issue: Images not being analyzed

**Solution**:
1. Check file URI format: `file:///...`
2. Verify base64 conversion in logs
3. Check media type detection
4. Ensure image is included in API request body

---

## Performance Optimization

### Response Time
- Target: < 3 seconds for typical responses
- Timeout: 15 seconds maximum
- Uses `AbortController` for cancellation

### Token Usage
- `max_tokens`: 2000 (configurable)
- Average response: ~500 tokens
- Cost per message: ~$0.003 (Sonnet 4.5)

### Caching
- Conversation history cached in memory (Zustand)
- Chats persisted to AsyncStorage
- No caching of API responses (real-time analysis)

---

## Security

### API Key Protection
- ✅ Stored in EAS secrets (not in code)
- ✅ Never logged in production
- ✅ Accessed via `Constants.expoConfig.extra`
- ✅ Not exposed to client-side

### Data Privacy
- User messages stored locally
- No data sent to third parties (except Anthropic)
- Chat history encrypted at rest
- Anonymous user IDs

### Content Safety
- System prompt includes age-appropriate guidelines
- Crisis detection with helpline recommendations
- Inappropriate content filtering in system prompt

---

## Future Enhancements

### Planned Features
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Conversation summaries
- [ ] Pattern tracking over time
- [ ] Export conversations as PDF
- [ ] Offline mode with cached responses
- [ ] Real-time streaming responses

### Model Upgrades
- Monitor for new Claude models
- A/B test different models
- Fine-tuning for specific use cases

---

## Monitoring & Analytics

### Key Metrics to Track
- Response time (avg, p95, p99)
- API error rate
- User engagement (messages per session)
- Conversation completion rate
- Crisis detection frequency

### Logging

```typescript
console.log('[AI_SERVICE]', {
  action: 'send_message',
  messageLength: userMessage.length,
  hasImage: !!imageData,
  responseTime: Date.now() - startTime,
  model: this.config.model
});
```

---

## Cost Estimation

### Anthropic Pricing (Claude Sonnet 4.5)
- Input: $3 per million tokens
- Output: $15 per million tokens

### Average Message Cost
- User input: ~50 tokens = $0.00015
- AI response: ~500 tokens = $0.0075
- **Total per message: ~$0.008**

### Monthly Estimate (1000 active users)
- 5 messages per user per month = 5000 messages
- 5000 × $0.008 = **$40/month**

---

## Support

### Documentation
- Anthropic Docs: https://docs.anthropic.com
- Expo Docs: https://docs.expo.dev
- React Native: https://reactnavigation.org

### Contact
- Support Email: support@mygutcheck.org
- Website: https://mygutcheck.org

---

## Changelog

### Build 180 (Current)
- ✅ Fixed: Updated to Claude Sonnet 4.5 model
- ✅ Fixed: API key validation before requests
- ✅ Fixed: Detailed error logging for debugging
- ✅ Added: Crisis detection with helplines
- ✅ Added: Image/document analysis support

### Build 153 (Last Known Working)
- ✅ Basic chat functionality
- ✅ Conversation history
- ✅ Pattern analysis

---

## License

Proprietary - GutCheck App © 2024

---

*Last Updated: November 20, 2024*
*Build Version: 180*
*Claude Model: claude-sonnet-4-5-20250929*

