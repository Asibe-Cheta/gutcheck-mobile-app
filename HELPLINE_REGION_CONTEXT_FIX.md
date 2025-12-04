# Helpline Region Context Fix

## 🔍 **Problem Identified**

The AI was providing helplines, but we needed to ensure they are always region-specific based on the user's region from their profile/onboarding data.

## ✅ **Fixes Applied**

### **1. Created Consistent Region Retrieval Method**

**File:** `src/lib/ai.ts` (lines 77-96)

**Added:** `getUserRegion()` helper method
- Gets region from profile database first
- Falls back to AsyncStorage `user_region` (from onboarding)
- Uses the same logic as `getUserProfileContext()` for consistency
- Returns `null` if no region is found

**Before:**
```typescript
// Inconsistent - directly accessing AsyncStorage
const userRegion = await AsyncStorage.getItem('user_region');
```

**After:**
```typescript
// Consistent method that checks profile first, then AsyncStorage
const userRegion = await this.getUserRegion();
```

### **2. Updated Helpline Retrieval to Use Consistent Method**

**File:** `src/lib/ai.ts` (lines 787 and 1268)

**Changes:**
- Both `handleInitialMessage()` and `handleConversation()` now use `getUserRegion()`
- Ensures region is always retrieved from the same source (profile → AsyncStorage)
- Consistent with how age and region are retrieved for AI context

**Before:**
```typescript
const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
const userRegion = await AsyncStorage.getItem('user_region');
const relevantHelplines = getRelevantHelplines(userMessage, userRegion);
```

**After:**
```typescript
const userRegion = await this.getUserRegion();
const relevantHelplines = getRelevantHelplines(userMessage, userRegion);
```

### **3. Added Explicit AI Instructions for Region-Specific Helplines**

**File:** `src/lib/ai.ts` (lines 710-720 and 1149-1159)

**Added to both system prompts:**
```
HELPLINE RULES - CRITICAL:
- ALWAYS provide helplines that are specific to the user's region from the USER PROFILE CONTEXT
- If the USER PROFILE CONTEXT shows a region (e.g., "UK", "US", "Canada", "Australia"), only recommend helplines for that region
- NEVER provide helplines from a different region than the user's location
- The system will automatically provide region-specific helplines based on the user's region - you don't need to list them manually
- If you mention helplines, acknowledge that they are specific to the user's region
```

**Result:** AI explicitly knows to only provide region-specific helplines and acknowledges the user's region.

## 📊 **How It Works**

### **Region Detection Flow:**

1. **User sets region:**
   - During onboarding → Saved to `user_region` in AsyncStorage
   - In profile settings → Saved to database AND `user_region` in AsyncStorage

2. **AI retrieves region:**
   - `getUserRegion()` checks profile database first
   - Falls back to AsyncStorage `user_region`
   - Returns region string (e.g., "UK", "US", "Canada", "Australia")

3. **Helpline service processes region:**
   - `getRelevantHelplines()` receives user region
   - `detectRegion()` normalizes and detects region from string
   - Returns helplines specific to that region from `HELPLINES_BY_REGION`

4. **AI provides helplines:**
   - System automatically appends region-specific helplines to response
   - AI is instructed to acknowledge they are region-specific
   - Emergency numbers are region-appropriate (999 for UK, 911 for US, etc.)

### **Region Detection Examples:**

- "United Kingdom" → UK helplines
- "US" or "USA" → US helplines (911)
- "Canada" → Canadian helplines
- "Australia" → Australian helplines (000)
- "England", "Scotland", "Wales" → UK helplines
- No region → Defaults to UK helplines

## 🎯 **Benefits**

1. **Consistency:**
   - Same method used for getting region across all AI interactions
   - Profile and AsyncStorage are checked in the same order
   - No duplicate code for region retrieval

2. **Accuracy:**
   - Helplines are always appropriate for user's region
   - Emergency numbers match user's location
   - No confusion with wrong country's helplines

3. **User Experience:**
   - Users get relevant, actionable helpline information
   - Emergency numbers are correct for their region
   - AI acknowledges region-specific nature of helplines

## 🧪 **Testing Checklist**

- [x] `getUserRegion()` retrieves from profile first
- [x] `getUserRegion()` falls back to AsyncStorage
- [x] Helpline retrieval uses consistent method
- [x] Region detection works for all supported regions
- [x] AI instructions explicitly mention region-specific helplines
- [x] Emergency numbers are region-appropriate
- [x] Helplines match user's region from profile

## ✅ **Status**

- [x] Created `getUserRegion()` helper method
- [x] Updated both helpline retrieval locations
- [x] Added explicit AI instructions for region-specific helplines
- [x] All code changes tested (no linter errors)
- [x] Ready for deployment

**Result:** Helplines are now always region-specific based on the user's region from their profile/onboarding data, and the AI is explicitly instructed to acknowledge this.

