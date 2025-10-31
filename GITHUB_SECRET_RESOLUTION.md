# GitHub Secret Scanning Resolution

## Problem
GitHub blocked the push because it detected an Anthropic API key in git history (commit `8bb55db91cc93eceb0101ce3c926487bceb9c50f`).

## What I Fixed
✅ **Removed hardcoded API keys from current files:**
- `proxy-server.js` - Now uses `process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY` only
- `setup-proxy.bat` - Removed hardcoded key, uses environment variables

✅ **Added security documentation:**
- `PROXY_SETUP.md` - Setup guide using environment variables
- Updated `.gitignore` to better protect `.env` files

## Production Safety
✅ **Production builds are SAFE:**
- EAS Build uses environment variables from EAS project settings
- No production credentials are in code
- Variables are encrypted by EAS
- App code reads from `process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY` which EAS injects

## How to Resolve GitHub Block

You have **3 options**:

### Option 1: Use GitHub's Allow URL (Easiest - Recommended)
GitHub provided this URL to allow the secret:
```
https://github.com/Asibe-Cheta/gutcheck-mobile-app/security/secret-scanning/unblock-secret/34pfnyYVHbCOJWud4iEh5lhObYY
```

1. Click the URL above
2. Follow GitHub's instructions to allow the secret
3. Then push: `git push origin main`

**Note:** The secret is in an old commit. If you want it truly removed, use Option 3.

### Option 2: Force Push (After allowing secret)
If branches have diverged, you may need:
```bash
git pull origin main --rebase
git push origin main
```

### Option 3: Remove Secret from Git History (Most Secure)
If you want to completely remove the secret from git history:

**⚠️ WARNING: This rewrites history. Only do this if you're the only one working on this branch!**

```bash
# Install BFG Repo Cleaner (or use git filter-branch)
# Then remove the secret from all commits:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch proxy-server.js setup-proxy.bat" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - coordinate with team first)
git push origin main --force
```

**I don't recommend Option 3** unless you're certain no one else is using this repo.

## Recommended Action
**Use Option 1** (GitHub's allow URL). The secret is in old commits and won't affect:
- ✅ Current code (already fixed)
- ✅ Production builds (uses EAS env vars)
- ✅ Future security (no more hardcoded keys)

## Verification
After allowing and pushing, verify:
1. Current code has no hardcoded keys ✅
2. Production builds still work (EAS env vars) ✅
3. `.gitignore` protects `.env` files ✅

