# RevenueCat Android Product Input Data

## Product Information for Google Play Products

Based on your Google Play Console, here are the exact values to enter in RevenueCat:

---

## Product 1: Premium Monthly

### In "Add product" Modal:

**Display name:**
```
Premium Monthly
```

**Product type:**
- Select: **Subscription** (already selected)

**Product identifier (after clicking "Import Products" or manual entry):**
```
com.gutcheck.app.premium.monthly
```

---

### In "Product type" Modal (if manual entry):

**Subscription:**
```
com.gutcheck.app.premium.monthly
```
*This is the subscription ID from Google Play Console*

**Base plan Id:**
```
base
```
*Google Play subscriptions typically use "base" as the default base plan ID. If you have a different base plan ID, check in Google Play Console:*
1. Go to the subscription product
2. Click on it
3. Look at the "Base plans" section
4. The base plan ID is usually "base" or "default" for standard subscriptions

**Backwards compatible:**
- ✅ **Check this box** (recommended)

---

## Product 2: Premium Yearly

### In "Add product" Modal:

**Display name:**
```
Premium Yearly
```

**Product type:**
- Select: **Subscription**

**Product identifier:**
```
com.gutcheck.app.premium.yearly
```

---

### In "Product type" Modal (if manual entry):

**Subscription:**
```
com.gutcheck.app.premium.yearly
```

**Base plan Id:**
```
base
```
*Same as monthly - typically "base" for Google Play subscriptions*

**Backwards compatible:**
- ✅ **Check this box** (recommended)

---

## Quick Reference Table

| Field | Premium Monthly | Premium Yearly |
|-------|----------------|---------------|
| **Display name** | `Premium Monthly` | `Premium Yearly` |
| **Product type** | Subscription | Subscription |
| **Product ID** | `com.gutcheck.app.premium.monthly` | `com.gutcheck.app.premium.yearly` |
| **Subscription** | `com.gutcheck.app.premium.monthly` | `com.gutcheck.app.premium.yearly` |
| **Base plan Id** | `base` | `base` |
| **Backwards compatible** | ✅ Checked | ✅ Checked |

---

## How to Find Base Plan ID (If "base" doesn't work)

If RevenueCat doesn't accept "base" as the base plan ID:

1. **Go to Google Play Console:**
   - Navigate to your subscription product
   - Click on "Premium Monthly" or "Premium Yearly"

2. **Check Base Plans Section:**
   - Look for "Base plans" tab or section
   - You should see a base plan listed
   - The ID is usually shown as "base", "default", or sometimes just the product ID

3. **Common Base Plan IDs:**
   - `base` (most common)
   - `default`
   - `p1m` (for monthly)
   - `p1y` (for yearly)
   - Sometimes it's the same as the product ID

4. **If you can't find it:**
   - Try leaving it blank (some RevenueCat versions allow this)
   - Or use the product ID itself: `com.gutcheck.app.premium.monthly`

---

## Recommended Approach: Use "Import Products"

**Instead of manual entry, use the "Import Products" button:**

1. Click **"Import Products"** button in the "Add product" modal
2. RevenueCat will automatically:
   - Connect to Google Play Console
   - Import all your subscriptions
   - Fill in all the fields automatically
   - Set the correct base plan IDs

**This is the easiest and most reliable method!**

---

## After Creating Products

Once both products are created in RevenueCat:

1. **Go to Entitlements:**
   - Product catalog → Entitlements → "GutCheck Premium"

2. **Attach Products:**
   - Click "Attach" in "Associated products" section
   - Select both Android products:
     - Premium Monthly (Google Play)
     - Premium Yearly (Google Play)

3. **Verify:**
   - You should now see 4 products total:
     - Premium Monthly (App Store) ✅
     - Premium Yearly (App Store) ✅
     - Premium Monthly (Google Play) ✅
     - Premium Yearly (Google Play) ✅

---

## Troubleshooting

### Problem: "Import Products" doesn't show Android products

**Solution:**
1. Verify Google Play is connected in RevenueCat:
   - Go to **Apps & providers**
   - Check "GutCheck App (Google Play)" is listed
   - If not, connect it first

2. Wait a few minutes for sync
3. Try refreshing the page
4. If still not working, use manual entry with the values above

### Problem: Base plan ID error

**Solution:**
1. Check Google Play Console for the exact base plan ID
2. Try common values: `base`, `default`, or leave blank
3. Contact RevenueCat support if none work

### Problem: Product ID already exists

**Solution:**
- This means the product already exists in RevenueCat
- Go to **Products** tab and find it
- Attach it directly to the entitlement (skip creation)

---

**Last Updated:** 2024-12-19
**Status:** Ready for product creation

