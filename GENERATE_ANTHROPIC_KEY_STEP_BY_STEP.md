# How to Generate New Anthropic API Key - Step by Step

## Step 1: Log into Anthropic Console
1. Go to: **https://console.anthropic.com/**
2. Sign in with your Anthropic account

## Step 2: Navigate to API Keys
1. Click on **"Settings"** in the top navigation
2. Or go directly to: **https://console.anthropic.com/settings/keys**

## Step 3: Create New Key
1. Click the **"Create Key"** button (usually in the top right)
2. Give it a name: `GutCheck Production` or `GutCheck App`
3. Copy the key immediately (you can only see it once!)

**Important**: The key should:
- Start with `sk-ant-api03-`
- Be about 150+ characters long
- Look something like: `sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 4: Update in Expo/EAS

### Option A: Via Expo Dashboard (Recommended)
1. Go to: **https://expo.dev/accounts/justice_asibe/projects/gutcheck/settings/credentials**
2. Click **"Environment Variables"** tab
3. Look for **"Production"** environment
4. Find `EXPO_PUBLIC_ANTHROPIC_API_KEY`
5. Click **"Edit"** or the pencil icon
6. Paste your new API key
7. Click **"Save"**

### Option B: Via EAS CLI
```bash
# Delete the old key
eas secret:delete --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY

# Create the new key
eas secret:create --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value "sk-ant-api03-your-actual-key-here"
```

## Step 5: Rebuild Your App
```bash
eas build --platform ios --profile production --non-interactive
```

## Step 6: Submit to TestFlight
```bash
eas submit --platform ios --latest --non-interactive
```

## Step 7: Verify It Works
1. Install the new build from TestFlight
2. Open chat and send a test message
3. Check logs - you should see:
   - `"apiKeyLength": 150+` (not 108)
   - `"status": 200` (not 401)
   - Claude responds successfully

## Troubleshooting

### Can't find the Settings page?
- Make sure you're logged in
- Try this direct link: https://console.anthropic.com/settings/keys

### Don't have an Anthropic account?
1. Go to: https://console.anthropic.com/
2. Click "Sign Up"
3. Follow the registration process

### API key doesn't show up in Expo dashboard?
- Make sure you're looking at the correct project
- Check that you're in "Production" environment tab
- Try the EAS CLI method instead

### Need help with billing?
1. Anthropic uses credit-based billing
2. Go to: https://console.anthropic.com/settings/billing
3. Add payment method if needed

## Security Tips
- ✅ Never commit API keys to git
- ✅ Never share API keys publicly
- ✅ Rotate keys if compromised
- ✅ Use separate keys for dev/production if needed

