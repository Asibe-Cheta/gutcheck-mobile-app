# EXPO_PUBLIC_ Visibility Rules

## Important Rule
**Variables starting with `EXPO_PUBLIC_` CANNOT be "Secret"!**

## Why?
`EXPO_PUBLIC_` variables are:
- Compiled into your app bundle
- Visible in plain text in the compiled app
- Accessible to anyone who downloads your app

## What to Use Instead

### For `EXPO_PUBLIC_` variables:
- ✅ **Sensitive** - Obfuscated in logs, visible in UI and CLI
- ⚠️ **Plain text** - Visible everywhere (least secure)

### ❌ **Secret** - NOT ALLOWED for `EXPO_PUBLIC_` variables!

## The Trade-off

**This is normal and expected!** 

`EXPO_PUBLIC_` variables are inherently public because they're bundled into your app. This is how Expo/React Native works.

### Why It's Usually Okay:
1. API keys with proper rate limiting
2. Public keys (not private keys)
3. Keys scoped to your app's domain
4. RevenueCat, Supabase, etc. are designed for client-side use

### Best Practices:
- ✅ Use "Sensitive" to hide from logs
- ✅ Monitor API usage
- ✅ Set up rate limiting in your API
- ✅ Rotate keys periodically
- ✅ Use separate keys for dev/production

## Fix for Your Case
Change your `EXPO_PUBLIC_ANTHROPIC_API_KEY` to:
- **"Sensitive"** visibility

Then save and rebuild!

