# How to Add Custom EULA in App Store Connect

Based on [Apple's documentation](https://developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement), here are your options:

## 📋 Two Options for Terms of Use (EULA)

### **Option 1: Use Standard Apple EULA + Link in Description** (Easiest)

**What Apple Requires:**
- If using standard EULA: Add link to your Terms of Use in the **App Description**

**Steps:**
1. Keep using Apple's standard EULA (default)
2. Add this to your **App Description** field:
   ```
   Terms of Use: https://mygutcheck.org/terms
   ```
3. This satisfies Apple's requirement since the link is in metadata

**Pros:** ✅ Quick and easy  
**Cons:** Users have to scroll to see Terms link

---

### **Option 2: Use Custom EULA in App Store Connect** (More Control)

**What Apple Requires:**
- Paste the **full text** of your Terms of Use directly into App Store Connect
- This makes the EULA available directly on the App Store page

**Steps:**

1. **Navigate to App Information:**
   - Go to App Store Connect → My Apps → GutCheck App
   - In the **left sidebar**, under **"General"**, click **"App Information"**
   - (This is different from "iOS App Version 1.0" page)

2. **Find License Agreement Section:**
   - Scroll down to find **"General Information"** section
   - Look for **"License Agreement"** field
   - You'll see it currently says "Standard Apple Terms of Use (EULA)" or similar

3. **Edit License Agreement:**
   - Click the **"Edit"** button next to "License Agreement"
   - A dialog will appear

4. **Select Custom EULA:**
   - Select the option: **"Apply a custom EULA to all chosen countries or regions"**
   - A large text field will appear

5. **Paste Your Terms of Use:**
   - **Important:** You need to copy the **full text** from your website: `https://mygutcheck.org/terms`
   - Paste the entire text into the "Custom License Agreement" field
   - **Note:** Only plain text is accepted (HTML tags are stripped)
   - Line breaks are preserved, but formatting is minimal

6. **Select Countries/Regions:**
   - In the "Countries or Regions" section below
   - Select all countries where you want your custom EULA to apply
   - (You can select multiple or all)

7. **Save:**
   - Click **"Done"** in the dialog
   - Click **"Save"** at the top right of the App Information page

**Pros:** ✅ Terms directly visible on App Store page  
**Cons:** ⚠️ Requires copying full text, less flexible for updates

---

## 🎯 Recommended Approach

**For your situation, I recommend Option 1** because:
- ✅ You already have the link in your app binary (`subscription.tsx`)
- ✅ Just need to add link to App Description (already planned)
- ✅ Easier to maintain (update your website, not App Store Connect)
- ✅ Still satisfies Apple's requirement

**However, if you want the EULA directly on the App Store page**, use Option 2.

---

## 📝 What Text to Copy (for Option 2)

If choosing Option 2, you need to copy the full text from:
- **Source:** `https://mygutcheck.org/terms`
- **Important:** Copy only the text content (remove HTML formatting if copying from source)
- The text should include:
  - All section headings
  - All terms and conditions
  - Contact information
  - Last updated date

---

## ✅ After Setting Up

Whichever option you choose, verify:
- [ ] Link is in App Description (if Option 1) OR Custom EULA is set (if Option 2)
- [ ] Link works in app binary (already done in `subscription.tsx`)
- [ ] Save all changes in App Store Connect
- [ ] Resubmit app for review

---

## 🔗 References

- [Apple's Custom EULA Guide](https://developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement)
- [Standard Apple EULA](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/)
