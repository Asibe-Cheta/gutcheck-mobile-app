# API Key Visibility Settings

## Choose: **Secret** ✅

When saving your Anthropic API key:

### ✅ **Secret** (Recommended)
- **Not readable** outside of EAS servers
- **Hidden** on website and in EAS CLI
- **Obfuscated** in logs
- **Safest** for API keys

### ⚠️ **Sensitive** (Not Recommended)
- Obfuscated in logs only
- Still visible on website and in EAS CLI
- Less secure

### ❌ **Plain text** (Not Recommended)
- **Visible everywhere** - website, CLI, logs
- **Not secure** for API keys
- Don't use this!

## Why Secret?

API keys are sensitive credentials that:
- Cost money when used
- Can be abused if exposed
- Should never be visible in logs or UI

**Always use "Secret" for API keys!**

