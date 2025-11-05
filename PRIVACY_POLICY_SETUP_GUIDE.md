# Privacy Policy Setup Guide - App Store Connect

## ✅ What Apple Requires

According to [Apple's Developer Program License Agreement](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/#S2), apps offering auto-renewable subscriptions must include:

1. **In the App Binary:** Functional links to both Privacy Policy and Terms of Use (EULA)
2. **In App Store Connect Metadata:** 
   - Privacy Policy URL in the dedicated Privacy Policy field
   - Terms of Use (EULA) link in the App Description or EULA field

---

## 📍 Step-by-Step: Add Privacy Policy URL to App Store Connect

### **Step 1: Navigate to App Information**

1. Go to **App Store Connect**: https://appstoreconnect.apple.com
2. Click **"My Apps"** in the top menu
3. Select **"GutCheck App"**
4. In the **left sidebar**, click **"App Information"** (under "App Store")

### **Step 2: Find the Privacy Policy URL Field**

On the App Information page, scroll down to find:
- **"Privacy Policy URL"** field
- This is a dedicated field specifically for the privacy policy link
- It should be near the top of the form, below the app name and category

### **Step 3: Enter Privacy Policy URL**

1. Click in the **"Privacy Policy URL"** field
2. Enter: `https://mygutcheck.org/privacy`
3. Make sure there are no extra spaces before or after the URL

### **Step 4: Save Changes**

1. Scroll to the **top** or **bottom** of the page
2. Click the **"Save"** button
3. Wait for confirmation that changes are saved

---

## ✅ Verify Both Requirements Are Met

### **In-App Binary (Already Done ✅)**
- ✅ Privacy Policy link added to `src/app/subscription.tsx`
- ✅ Terms of Use link added to `src/app/subscription.tsx`
- ✅ Both links are functional and open in browser

### **App Store Connect Metadata (You Need to Complete)**
- [ ] Privacy Policy URL added to the Privacy Policy URL field: `https://mygutcheck.org/privacy`
- [ ] Terms of Use link added to App Description: `Terms of Use (EULA): https://mygutcheck.org/terms`

---

## 📝 Quick Checklist

Before submitting your next build:

- [ ] Privacy Policy URL field in App Store Connect: `https://mygutcheck.org/privacy`
- [ ] Terms of Use link in App Description: `Terms of Use (EULA): https://mygutcheck.org/terms`
- [ ] Both links are accessible and working on your website
- [ ] Privacy Policy page exists at `https://mygutcheck.org/privacy`
- [ ] Terms of Use page exists at `https://mygutcheck.org/terms`
- [ ] Changes saved in App Store Connect

---

## 🔗 Reference Links

- **Apple's Requirements:** https://developer.apple.com/support/terms/apple-developer-program-license-agreement/#S2
- **App Store Connect:** https://appstoreconnect.apple.com
- **Your Privacy Policy:** https://mygutcheck.org/privacy
- **Your Terms of Use:** https://mygutcheck.org/terms

---

## 📌 Important Notes

1. **Privacy Policy URL Field:** This is a separate, dedicated field in App Store Connect. It's not the same as adding it to the description.

2. **Both Links Required:** Apple requires BOTH links:
   - Privacy Policy (in Privacy Policy URL field + in app binary)
   - Terms of Use (in App Description + in app binary)

3. **Links Must Be Functional:** Make sure both URLs are accessible and load properly in a browser before submitting.

4. **No Changes Needed to Code:** The code changes are already complete. You just need to update the App Store Connect metadata.

