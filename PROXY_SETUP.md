# Proxy Server Setup Guide

## Important Security Notice

**Never commit API keys to Git!** This repo uses environment variables for all sensitive credentials.

## Local Development Setup

### For Local Proxy Server (proxy-server.js)

1. **Create a `.env` file** in the project root (already gitignored):
   ```
   EXPO_PUBLIC_ANTHROPIC_API_KEY=your-api-key-here
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install express cors
   ```

3. **Run the proxy server**:
   ```bash
   node proxy-server.js
   ```

4. **Start your Expo app** pointing to the proxy (if needed)

### For setup-proxy.bat (Windows)

This script is for one-time setup. It no longer sets the API key - you should:
1. Create a `.env` file with your API key
2. Or set the environment variable manually before running the proxy

## Production Builds

**Production builds use EAS environment variables automatically** - no configuration needed!

- EAS Build pulls environment variables from your EAS project settings
- Variables are encrypted and never exposed in the repo
- The app code reads from `process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY` which EAS injects

## Security Checklist

- ✅ No API keys in source code
- ✅ `.env` files are gitignored
- ✅ Production uses EAS environment variables
- ✅ Proxy server reads from environment variables only

## Troubleshooting

### "API key not configured" error

**Local Development:**
- Check that `.env` file exists and contains `EXPO_PUBLIC_ANTHROPIC_API_KEY`
- Restart the proxy server after creating `.env`

**Production:**
- Verify EAS environment variables are set in your EAS project
- Check that variables are marked as "Plain text" or "Sensitive" as needed
- Ensure the build profile uses the correct environment

