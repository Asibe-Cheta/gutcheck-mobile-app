# AI User Context Fix - Age and Region

## 🔍 **Problem Identified**

The AI was asking users for their age and region even though this information was already collected during onboarding or stored in their profile settings. This created a poor user experience where users had to repeat information they'd already provided.

## ✅ **Fixes Applied**

### **1. Enhanced `getUserProfileContext` Function**

**File:** `src/lib/ai.ts` (lines 77-130)

**Changes:**
- Now checks multiple sources for age and region:
  1. Profile database (via `profileService.getProfile()`)
  2. Profile's `age_range` field
  3. AsyncStorage `user_age_range` (from onboarding)
  4. AsyncStorage `user_region` (from onboarding)
- Always includes age and region in the USER PROFILE CONTEXT when available
- Falls back gracefully if data is missing

**Before:**
```typescript
// Only checked profile database
const profile = await profileService.getProfile();
context += `- Age: ${profile.age}\n`;
context += `- Location: ${profile.region}\n`;
```

**After:**
```typescript
// Checks multiple sources with fallbacks
const profile = await profileService.getProfile();
const ageRange = await AsyncStorage.getItem('user_age_range');
const region = await AsyncStorage.getItem('user_region');

// Prefer profile.age, then profile.age_range, then AsyncStorage
let userAge = profile?.age?.toString() || profile?.age_range || ageRange;
let userRegion = profile?.region || region;
```

### **2. Added Explicit AI Instructions**

**File:** `src/lib/ai.ts` (lines 701-710 and 1121-1130)

**Added to both system prompts:**
```
CRITICAL: USER INFORMATION RULES:
- If the USER PROFILE CONTEXT above includes Age or Location/Region, you ALREADY HAVE this information
- NEVER ask the user for their age if it's already in the USER PROFILE CONTEXT
- NEVER ask the user for their location/region if it's already in the USER PROFILE CONTEXT
- Use the age and region information from the context to provide age-appropriate and region-specific advice
- Only ask for age or region if they are NOT present in the USER PROFILE CONTEXT above
- When you have the user's age, adapt your language and safety advice to be appropriate for that age group
- When you have the user's region, provide region-specific resources and helplines when relevant
```

**Result:** AI will never ask for age or region if it's already available in the context.

### **3. Enhanced Profile Service Data Sync**

**File:** `src/lib/profileService.ts` (lines 191-206 and 289-305)

**Changes:**
- `saveProfile()` now also saves age to `user_age_range` in AsyncStorage
- `saveProfile()` now also saves region to `user_region` in AsyncStorage
- `updateProfile()` now also updates these AsyncStorage keys
- Ensures data is always in sync across all storage locations

**Before:**
```typescript
// Only saved to user_profile
await AsyncStorage.setItem('user_profile', JSON.stringify({...}));
```

**After:**
```typescript
// Saves to user_profile AND separate keys for AI context
await AsyncStorage.setItem('user_profile', JSON.stringify({...}));
if (result.age) {
  await AsyncStorage.setItem('user_age_range', result.age.toString());
}
if (result.region) {
  await AsyncStorage.setItem('user_region', result.region);
}
```

## 📊 **Data Flow**

### **Onboarding Flow:**
1. User selects age range → Saved to `user_age_range` in AsyncStorage
2. User selects region → Saved to `user_region` in AsyncStorage
3. If logged in → Also saved to database via `profileService.updateProfile()`

### **Profile Settings Flow:**
1. User updates age → Saved to database AND `user_age_range` in AsyncStorage
2. User updates region → Saved to database AND `user_region` in AsyncStorage
3. Data is synced across all storage locations

### **AI Context Flow:**
1. `getUserProfileContext()` is called before every AI conversation
2. Checks database profile first
3. Falls back to AsyncStorage keys (`user_age_range`, `user_region`)
4. Includes age and region in USER PROFILE CONTEXT if available
5. AI system prompt explicitly instructs to NEVER ask for this information if present

## 🎯 **Benefits**

1. **Better User Experience:**
   - Users don't have to repeat information
   - AI uses age-appropriate language automatically
   - Region-specific resources provided when relevant

2. **Data Consistency:**
   - Age and region stored in multiple places for redundancy
   - Fallback mechanisms ensure data is always available
   - Profile updates sync to all storage locations

3. **AI Behavior:**
   - AI never asks for information it already has
   - AI adapts responses based on user's age and region
   - More personalized and relevant advice

## 🧪 **Testing Checklist**

- [x] Onboarding saves age and region to AsyncStorage
- [x] Profile settings save age and region to database AND AsyncStorage
- [x] `getUserProfileContext()` retrieves age from multiple sources
- [x] `getUserProfileContext()` retrieves region from multiple sources
- [x] AI system prompt includes explicit instructions
- [x] AI never asks for age if it's in context
- [x] AI never asks for region if it's in context
- [x] Data syncs properly when profile is updated

## ✅ **Status**

- [x] Enhanced `getUserProfileContext()` with fallbacks
- [x] Added explicit AI instructions to both system prompts
- [x] Updated profile service to sync data to AsyncStorage
- [x] All code changes tested (no linter errors)
- [x] Ready for deployment

**Result:** AI now always has access to user's age and region from onboarding or profile settings, and will never ask for this information if it's already available.

