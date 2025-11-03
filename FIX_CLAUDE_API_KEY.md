# Fix Claude API Key - Build #105 Debug Results

## Problem Identified
Build #105 debug logs show:
```
"apiKeyPreview": "sk-ant-api03-x7..."
"apiKeyLength": 108
"status": 401
"error": "invalid x-api-key"
```

**The API key is being loaded correctly but it's INVALID** - either:
1. Wrong/expired key
2. Key corrupted during EAS build injection
3. Key never properly set in EAS

## Solution: Update the API Key

### Step 1: Generate New Anthropic API Key
1. Go to: https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Name it: "GutCheck Production"
4. Copy the full key (should be ~150+ characters)

### Step 2: Update in EAS
Choose one method:

#### Method A: Via EAS Dashboard (Easiest)
1. Go to: https://expo.dev/accounts/justice_asibe/projects/gutcheck/settings/credentials
2. Click "Environment Variables"
3. Find `EXPO_PUBLIC_ANTHROPIC_API_KEY` under "Production"
4. Click "Edit" and paste the new key
5. Save

#### Method B: Via EAS CLI
```bash
eas secret:create --scope production --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value "sk-ant-api03-..."
```

Or if the secret already exists:
```bash
eas secret:delete --scope production --name EXPO_PUBLIC_ANTHROPIC_API_KEY
eas secret:create --scope production --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value "sk-ant-api03-..."
```

### Step 3: Build and Test
```bash
eas build --platform ios --profile production
```

After build completes:
```bash
eas submit --platform ios --latest --non-interactive
```

### Step 4: Test in TestFlight
1. Install the new build
2. Try a chat conversation
3. Check logs for API Key debugging output

Expected successful logs:
```
"apiKeyPreview": "sk-ant-api03-..." (should be longer)
"apiKeyLength": 150+ (should be 150+ characters)
"status": 200
```

## Verification Checklist

The API key should:
- ✅ Start with `sk-ant-api03-` (newer format)
- ✅ Be 150+ characters long
- ✅ Be active in Anthropic console
- ✅ Have billing enabled
- ✅ Not be truncated or missing characters

## Current Status
- ✅ Build #105: Debugging added
- ❌ API key: Invalid/wrong
- ⏳ Next: Generate new key and rebuild

