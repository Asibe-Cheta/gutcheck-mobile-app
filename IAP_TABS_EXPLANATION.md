# App Store Connect: In-App Purchases vs Subscriptions Tabs

## Two Different Tabs for Different Product Types

### 1. "In-App Purchases" Tab ❌ (NOT for subscriptions)
- **Purpose**: For one-time purchases
- **Available Types**:
  - **Consumable**: Items that can be purchased multiple times (coins, lives, etc.)
  - **Non-Consumable**: One-time purchases (remove ads, unlock feature)
  - **Non-Renewing Subscription**: Subscription-like but doesn't auto-renew (user must manually renew)
- **Use Case**: Games, utilities, one-time features
- **Your Status**: You DON'T need to use this tab

### 2. "Subscriptions" Tab ✅ (CORRECT for your app)
- **Purpose**: For recurring subscriptions that auto-renew
- **Product Type**: Auto-Renewable Subscriptions
- **Use Case**: Monthly/yearly subscriptions (like yours)
- **Your Status**: ✅ Already correctly set up here!

## What You Need to Do

### ✅ Already Done (Correct):
- Subscriptions tab: "Premium Monthly" and "Premium Yearly" 
- Both are Auto-Renewable Subscriptions
- Product IDs match code: `com.gutcheck.app.premium.monthly` and `com.gutcheck.app.premium.yearly`

### ❌ Do NOT Create in "In-App Purchases" Tab:
- You don't need Consumable or Non-Consumable products
- The "In-App Purchases" tab is for different use cases
- Creating products here would confuse things

## Why There's Confusion

Earlier, we saw products listed as "Non-Consumable" in the "In-App Purchases" tab. Those are **different products** from your subscriptions. You can:

1. **Ignore them** if they're old/unused
2. **Delete them** if they're not needed
3. **Leave them** if you plan to use them for other features

But for your subscription app, you **only need the Subscriptions tab**, which is already set up correctly!

## Summary

- ✅ **Subscriptions Tab**: Use this for your monthly/yearly subscriptions (ALREADY DONE)
- ❌ **In-App Purchases Tab**: Don't create anything here for subscriptions
- 🔧 **Action Needed**: Complete "Missing Metadata" in Subscriptions tab, then wait for approval

## Next Steps

1. ✅ Product IDs updated in code to match subscriptions
2. ⏳ Complete metadata in Subscriptions tab (remove "Missing Metadata" status)
3. ⏳ Wait for Apple approval
4. ⏳ Rebuild app and test IAP

You're on the right track! Just focus on the Subscriptions tab.

