# Claude API Debug Next Steps

## Current Status
Build #105 has been submitted with enhanced API key debugging logs.

## What to Do Next

### 1. Wait for Build #105 to Process
- Check TestFlight: https://appstoreconnect.apple.com/apps/6754253217/testflight/ios
- Usually takes 5-10 minutes

### 2. Test a Chat Conversation
- Open Build #105 in TestFlight
- Try to have a conversation
- Capture the logs

### 3. Look for These New Logs

You should see:
```
[LOG] API Key debugging: {
  hasProcessEnv: true/false,
  hasConstants: true/false,
  apiKeyPresent: true/false,
  apiKeyPreview: "sk-ant-xxxxx..." or "MISSING"
}
```

And if an error occurs:
```
[LOG] Claude API Error: {
  status: 401,
  errorText: "...",
  apiKeyPresent: true/false,
  apiKeyLength: X,
  apiKeyPreview: "...",
  isWeb: true/false,
  apiUrl: "https://api.anthropic.com/..."
}
```

### 4. Possible Scenarios

#### Scenario A: API Key Missing
```
apiKeyPresent: false
hasConstants: false
```
**Solution**: Check EAS environment variables

#### Scenario B: API Key Present but Wrong Format
```
apiKeyPresent: true
apiKeyPreview: "sk-ant-xxxxx..." (wrong)
```
**Expected**: Should start with `sk-ant-api03-` for newer Anthropic keys
**Solution**: Update the API key in EAS environment variables

#### Scenario C: API Key Expired/Invalid
```
apiKeyPresent: true
apiKeyPreview: "sk-ant-api03-xxxxx..." (correct format)
status: 401
```
**Solution**: Generate a new API key from Anthropic dashboard and update in EAS

#### Scenario D: Constants Not Loading
```
hasProcessEnv: true
hasConstants: false
```
**Solution**: Check app.config.js configuration

## How to Check Your Current API Key

### Via EAS CLI (Recommended)
1. Go to: https://expo.dev/accounts/justice_asibe/projects/gutcheck/settings/credentials
2. Check environment variables for `EXPO_PUBLIC_ANTHROPIC_API_KEY`
3. Verify it starts with `sk-ant-api03-`

### Via Anthropic Dashboard
1. Go to: https://console.anthropic.com/settings/keys
2. Check if your key is still active
3. If expired, generate a new one
4. Update in EAS environment variables

## Quick Fix Command (If Needed)

If the API key is wrong in EAS:
```bash
eas secret:create --scope production --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value "sk-ant-api03-..."
```

Or use the dashboard:
1. Go to https://expo.dev/accounts/justice_asibe/projects/gutcheck/settings/credentials
2. Click "Environment Variables"
3. Select "Production" environment
4. Update `EXPO_PUBLIC_ANTHROPIC_API_KEY`

## Expected Valid API Key Format
- Old format: `sk-ant-xxxxx` (might work)
- New format: `sk-ant-api03-xxxxx` (preferred)

Keys should be ~150+ characters long.

