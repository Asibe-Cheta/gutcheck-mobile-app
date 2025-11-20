# AI Chat - Quick Reference Guide

## 🚀 Quick Start

### Current Configuration
```typescript
Model: claude-sonnet-4-5-20250929
Max Tokens: 2000
Temperature: 0.3
API Endpoint: https://api.anthropic.com/v1/messages
```

---

## 📝 Common Tasks

### Send a Message
```typescript
import { useAnalysisStore } from '@/lib/stores/analysisStore';

const { handleConversation } = useAnalysisStore();

const response = await handleConversation(
  "User message here",
  conversationState,
  conversationHistory,
  false, // hasImage
  undefined // imageData
);
```

### Send with Image
```typescript
const response = await handleConversation(
  "Analyze this screenshot",
  conversationState,
  conversationHistory,
  true, // hasImage
  "file:///path/to/image.jpg" // imageData
);
```

### Start New Conversation
```typescript
import { useConversationStore } from '@/lib/stores/conversationStore';

const { startNewConversation } = useConversationStore();
startNewConversation();
```

---

## 🔧 Configuration

### Add/Update API Key
```bash
# Create new secret
eas secret:create --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value YOUR_KEY

# List secrets
eas secret:list

# Delete secret
eas secret:delete --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY
```

### Change Model
Edit `src/lib/ai.ts`:
```typescript
constructor() {
  this.config = {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929', // Change this
    max_tokens: 2000,
    temperature: 0.3,
  };
}
```

---

## 🐛 Debugging

### Check API Key
```typescript
import Constants from 'expo-constants';
console.log('API Key present:', !!Constants.expoConfig?.extra?.EXPO_PUBLIC_ANTHROPIC_API_KEY);
```

### View Error Details
Check console for:
```
[AI] API key is missing!
Claude API Error: {...}
Error details: {...}
```

### Test API Key (curl)
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "test"}]
  }'
```

---

## ⚠️ Common Errors

### Error: `API key is not configured`
**Fix**: Set EAS secret and rebuild
```bash
eas secret:create --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value YOUR_KEY
eas build --platform ios --profile production
```

### Error: `404 not_found_error: model`
**Fix**: Update model name in `src/lib/ai.ts` constructor

### Error: `401 Unauthorized`
**Fix**: Regenerate API key at https://console.anthropic.com

### Error: `Request timeout`
**Fix**: Increase timeout in `getDirectClaudeResponse()`:
```typescript
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s
```

---

## 📊 Key Files

| File | Purpose |
|------|---------|
| `src/lib/ai.ts` | Core AI service |
| `src/app/chat.tsx` | Chat UI |
| `src/lib/stores/conversationStore.ts` | Conversation state |
| `src/lib/stores/analysisStore.ts` | Analysis logic |
| `app.config.js` | Environment config |

---

## 🔑 Available Models (Anthropic)

| Model | Identifier | Speed | Cost |
|-------|-----------|-------|------|
| Sonnet 4.5 | `claude-sonnet-4-5-20250929` | Medium | $3/$15 |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | Fast | $1/$5 |

*Prices per million tokens (input/output)*

---

## 📱 Testing Flow

1. Build app: `eas build --platform ios --profile production`
2. Submit: `eas submit --platform ios --latest`
3. Wait for TestFlight (5-10 min)
4. Open app → Start chat
5. Send message: "Someone made me feel guilty"
6. Verify AI responds correctly

---

## 💡 Tips

- Always rebuild after changing API keys
- Test with simple messages first
- Check logs for error details
- Use the error message screenshot for debugging
- Monitor Anthropic API status at https://status.anthropic.com

---

## 📞 Support

- Docs: https://docs.anthropic.com
- Email: support@mygutcheck.org
- GutCheck: https://mygutcheck.org

---

*Last Updated: November 20, 2024 | Build 180*

