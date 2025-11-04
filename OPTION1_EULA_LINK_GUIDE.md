# Option 1: Add Terms of Use Link to App Description - Step by Step Guide

This is the **easiest and recommended** method to satisfy Apple's EULA requirement.

---

## ✅ What You Need to Do

Add `Terms of Use: https://mygutcheck.org/terms` to your **App Description** field in App Store Connect.

---

## 📍 Step-by-Step Instructions

### **Step 1: Navigate to Your App Version Page**

1. Go to **App Store Connect**: https://appstoreconnect.apple.com
2. Click **"My Apps"** in the top menu
3. Select **"GutCheck App"**
4. In the **left sidebar**, under **"App Store"**, click **"App Store"**
5. Click on your app version: **"1.0 Prepare for Submission"** or **"1.0 Rejected"**

### **Step 2: Find the Description Field**

On the app version page, scroll down until you see:
- **"App Information"** section
- **"Description"** field (large text area)
- This is where your current description text is

### **Step 3: Update Your Description**

Your current description probably looks something like:
```
Your private space to decode everyday interactions, a second check to your instincts. Get evidence-based analysis of manipulation, bullying, blackmail, sextortion, grooming and predatory patterns with complete anonymity.
```

**Add the following to the END of your description:**

```
Your private space to decode everyday interactions, a second check to your instincts. Get evidence-based analysis of manipulation, bullying, blackmail, sextortion, grooming and predatory patterns with complete anonymity.

---

PREMIUM SUBSCRIPTION REQUIRED:

The following features require a Premium subscription:
• Unlimited AI conversations with your AI companion
• Image and document analysis  
• Advanced pattern recognition
• Personalized safety guidance
• Priority support

Free Features:
• Basic relationship insights
• Safety awareness resources

Start with a 7-day free trial, then choose:
• Monthly: £9.92/month
• Yearly: £98.55/year (Save 17%)

Cancel anytime. No hidden fees.

---

Terms of Use: https://mygutcheck.org/terms
```

### **Step 4: Save Your Changes**

1. Scroll to the **top** of the page
2. Click the **"Save"** button in the top right corner
3. Wait for confirmation that changes are saved

### **Step 5: Verify**

1. Scroll back down to the Description field
2. Make sure the link `https://mygutcheck.org/terms` is visible at the bottom
3. Verify it's properly formatted (not cut off)

---

## ✅ Checklist

Before resubmitting, verify:

- [ ] Terms of Use link added to Description: `https://mygutcheck.org/terms`
- [ ] Paid content clearly labeled (Premium Subscription Required section)
- [ ] Free features listed separately
- [ ] Pricing information included
- [ ] 7-day free trial mentioned
- [ ] Changes saved successfully

---

## 🎯 Why This Works

According to Apple's requirements:
- ✅ **App Binary:** You already have the link in `subscription.tsx` (done)
- ✅ **Metadata:** Adding link to Description satisfies the requirement
- ✅ **Standard EULA:** You're using Apple's default EULA (no changes needed)
- ✅ **Both requirements met:** Link in binary + link in metadata = compliant

---

## 📝 Complete Description Template

Here's a complete template you can use:

```
Your private space to decode everyday interactions, a second check to your instincts. Get evidence-based analysis of manipulation, bullying, blackmail, sextortion, grooming and predatory patterns with complete anonymity.

---

PREMIUM SUBSCRIPTION REQUIRED:

The following features require a Premium subscription:
• Unlimited AI conversations with your AI companion
• Image and document analysis  
• Advanced pattern recognition
• Personalized safety guidance
• Priority support

Free Features:
• Basic relationship insights
• Safety awareness resources

Start with a 7-day free trial, then choose:
• Monthly: £9.92/month
• Yearly: £98.55/year (Save 17%)

Cancel anytime. No hidden fees.

---

Terms of Use: https://mygutcheck.org/terms
```

---

## 🚀 Next Steps

After saving your description:

1. ✅ **Description updated** - Done (once you complete steps above)
2. ✅ **Promotional Text** - Should be under 170 characters (you already fixed this)
3. 🔄 **Rebuild app** (if needed) - The binary already has the link
4. 📤 **Resubmit for review** - In App Store Connect, click "Add for Review"

---

## ❓ Troubleshooting

**Q: The Description field won't save?**  
A: Make sure you clicked "Save" at the top of the page, not just scrolled. Some browsers require you to be at the top.

**Q: Can I put the link somewhere else?**  
A: Yes, but it must be in the Description field. You can put it at the top, middle, or bottom - just make sure it's visible.

**Q: Do I need to rebuild the app?**  
A: No! The link in the description is metadata, not code. Just save and resubmit.

---

## ✅ You're Done!

Once you've added the link to the Description and saved, you've completed Option 1. Apple's requirement for Terms of Use link in metadata is satisfied.
