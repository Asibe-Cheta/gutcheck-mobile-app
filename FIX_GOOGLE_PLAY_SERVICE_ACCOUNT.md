# Fix Google Play Service Account Credentials for RevenueCat

## 🎯 Problem

Your RevenueCat dashboard shows:
- ❌ **"Credentials need attention"** error
- ❌ **"Could not check"** status on all Google Play products
- ❌ Three permission validation failures:
  - "Could not validate subscriptions API permissions"
  - "Could not validate inappproducts API permissions"
  - "Could not validate monetization API permissions"

## ✅ Solution: Create & Configure Google Play Service Account

RevenueCat needs a **Service Account JSON key file** from Google Cloud Console to access your Google Play Console data.

---

## Step 1: Create Service Account in Google Cloud Console

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Make sure you're logged in with the **same Google account** that owns your Google Play Console

2. **Select or Create a Project:**
   - If you don't have a project, click **"Select a project"** → **"New Project"**
   - Name it: `GutCheck RevenueCat` (or similar)
   - Click **"Create"**

3. **Navigate to Service Accounts:**
   - In the left sidebar, go to **"IAM & Admin"** → **"Service Accounts"**
   - Click **"+ CREATE SERVICE ACCOUNT"** button at the top

4. **Create the Service Account:**
   - **Service account name:** `revenuecat-gutcheck` (or similar)
   - **Service account ID:** Auto-filled (leave as is)
   - **Description:** `Service account for RevenueCat to access Google Play Console`
   - Click **"CREATE AND CONTINUE"**

5. **Skip Grant Access (for now):**
   - On "Grant this service account access to project" screen, click **"CONTINUE"** (we'll grant access in Google Play Console instead)

6. **Finish:**
   - Click **"DONE"**

---

## Step 2: Create & Download JSON Key

1. **Find Your Service Account:**
   - In the Service Accounts list, click on the service account you just created (`revenuecat-gutcheck`)

2. **Go to Keys Tab:**
   - Click the **"KEYS"** tab at the top

3. **Create New Key:**
   - Click **"ADD KEY"** → **"Create new key"**
   - Select **"JSON"** format
   - Click **"CREATE"**
   - **The JSON file will automatically download** to your computer (usually to Downloads folder)
   - **⚠️ IMPORTANT:** Save this file securely! You can only download it once.

---

## Step 3: Grant API Access in Google Play Console

Now you need to link this service account to your Google Play Console app.

1. **Go to Google Play Console:**
   - Visit: https://play.google.com/console
   - Select your **GutCheck** app

2. **Navigate to API Access:**
   - In the left sidebar, go to **"Setup"** → **"API access"**
   - (If you don't see "API access", you may need to enable it first)

3. **Link Service Account:**
   - Scroll down to **"Service accounts"** section
   - Click **"LINK SERVICE ACCOUNT"** button
   - In the popup:
     - **Service account email:** Copy the email from the JSON file you downloaded (looks like `revenuecat-gutcheck@your-project-id.iam.gserviceaccount.com`)
     - Or find it in Google Cloud Console → Service Accounts → Your service account
   - Click **"GRANT ACCESS"**

4. **Grant Required Permissions:**
   - A permissions dialog will appear
   - **✅ Check ALL THREE of these boxes:**
     - **"View financial data, orders, and cancellation survey responses"** (for subscriptions API)
     - **"Manage orders and subscriptions"** (for inappproducts API)
     - **"View app information and download bulk reports"** (for monetization API)
   - Click **"INVITE USER"** or **"ADD USER"**

5. **Verify Access:**
   - The service account should now appear in the "Service accounts" section
   - It should show **"Active"** status

---

## Step 4: Enable Required APIs in Google Cloud Console

Go back to Google Cloud Console to enable the necessary APIs:

1. **Enable Google Play Android Developer API:**
   - In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
   - Search for: **"Google Play Android Developer API"**
   - Click on it
   - Click **"ENABLE"** button

2. **Verify APIs are Enabled:**
   - Go to **"APIs & Services"** → **"Enabled APIs"**
   - You should see **"Google Play Android Developer API"** listed

---

## Step 5: Upload JSON to RevenueCat

1. **Open the JSON File:**
   - Find the downloaded JSON file (usually in Downloads folder)
   - Open it with a text editor (TextEdit on Mac, Notepad on Windows)
   - **Copy the ENTIRE contents** (it should look like this):

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "revenuecat-gutcheck@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

2. **Paste into RevenueCat:**
   - Go to RevenueCat dashboard: https://app.revenuecat.com
   - Navigate to: **"Apps & providers"** → **"GutCheck App (Play Store)"**
   - Scroll down to **"Service Account Credentials"** section
   - Find the **"Service Account Credentials JSON"** text area
   - **Paste the ENTIRE JSON content** into this text area
   - Click **"Save changes"** button

3. **Wait for Validation:**
   - RevenueCat will automatically validate the credentials
   - This may take 30-60 seconds
   - The red error should disappear and show **"Credentials validated"** or similar
   - Refresh the page if needed

---

## Step 6: Verify Products Status

After uploading the JSON:

1. **Go to Product Catalog:**
   - Navigate to **"Product catalog"** → **"Products"** tab
   - Look at your **"GutCheck App (Play Store)"** products

2. **Check Status:**
   - The **"Could not check"** status should change to **"Approved"** ✅
   - Products should now sync properly

---

## Troubleshooting

### Problem: "Could not validate subscriptions API permissions"

**Solution:**
- Make sure you checked **"View financial data, orders, and cancellation survey responses"** in Google Play Console
- Make sure you enabled **"Google Play Android Developer API"** in Google Cloud Console
- Wait 5-10 minutes for permissions to propagate

### Problem: "Could not validate inappproducts API permissions"

**Solution:**
- Make sure you checked **"Manage orders and subscriptions"** in Google Play Console
- Verify the service account email is correct

### Problem: "Could not validate monetization API permissions"

**Solution:**
- Make sure you checked **"View app information and download bulk reports"** in Google Play Console
- This permission may require additional approval (wait 24 hours if needed)

### Problem: JSON file is invalid or corrupted

**Solution:**
- Make sure you copied the **ENTIRE JSON file** including opening `{` and closing `}`
- Don't add or remove any characters
- Make sure there are no extra spaces or line breaks
- Try downloading the JSON key again from Google Cloud Console

### Problem: "Service account not found" in Google Play Console

**Solution:**
- Make sure you're using the **same Google account** for both Google Cloud Console and Google Play Console
- Check the service account email is correct
- The service account email format is: `service-account-name@project-id.iam.gserviceaccount.com`

---

## 🎉 Expected Result

After completing these steps:

- ✅ **Service Account Credentials:** "Credentials validated" (green checkmark)
- ✅ **Products Status:** All Google Play products show "Approved" status
- ✅ **Product Sync:** Products sync automatically from Google Play Console
- ✅ **Subscription Validation:** RevenueCat can validate subscription purchases

---

## 📝 Notes

- The service account JSON file is **sensitive** - don't share it publicly or commit it to git
- You can regenerate the JSON key if needed, but you'll need to upload it again to RevenueCat
- The JSON key doesn't expire, but you can rotate it for security purposes
- RevenueCat needs these permissions to:
  - Sync product data from Google Play Console
  - Validate subscription purchases
  - Generate revenue reports

---

## Next Steps After Fixing

1. **Clean up old products (optional):**
   - The Nov 3rd product (`com.gutcheck.app.premium.monthly:monthly`) can't be deleted if there are active subscriptions
   - You can leave it (it won't affect functionality)
   - Or contact RevenueCat support to remove it if you're certain there are no active subscriptions

2. **Test subscriptions:**
   - Build a test version of your app
   - Test subscription purchase flow
   - Verify purchases appear in RevenueCat dashboard

3. **Continue with Google Play production:**
   - Complete your 14-day testing period
   - Apply for production access
   - Submit your app for review

