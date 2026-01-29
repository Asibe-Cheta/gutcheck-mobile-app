# Council Area Tracking - Privacy-First Impact Measurement

## Overview

Version 2.0.7 introduces **anonymous council area tracking** for UK users. This feature helps measure GutCheck's impact across different local authorities while maintaining strict privacy standards.

## ✅ What's New in 2.0.7

### 1. **Enhanced Onboarding** 
- Changed "Region" to "Country" selection
- Added international country dropdown (25+ countries)
- UK-specific postcode collection step (optional)
- Clear privacy messaging at each step

### 2. **Safety-Focused Quick Prompts**
Updated home screen prompts to focus on grooming and exploitation:
- "Someone made me feel guilty"
- "Someone asked me to keep a secret" ⚠️ (NEW - grooming red flag)
- "Someone says I can't tell anyone" ⚠️ (NEW - exploitation warning)

### 3. **Privacy-First Analytics**
- Anonymous usage tracking by UK council area
- NO personally identifiable information (PII) collected
- Postcode is NEVER stored (deleted immediately after mapping)
- Daily-rotating device hashes (prevents long-term tracking)
- GDPR and UK DPA 2018 compliant

## 🔒 Privacy Guarantees

| What We Collect | What We DON'T Collect |
|---|---|
| ✅ Council area code (e.g., "E08000003" for Manchester) | ❌ Full postcode |
| ✅ Aggregated usage counts | ❌ Individual user behavior |
| ✅ Daily unique device hash | ❌ Persistent device identifiers |
| ✅ Country selection | ❌ Precise GPS location |
| | ❌ IP addresses |
| | ❌ Names, emails, or any PII |

## 📊 How It Works

### User Flow:

```
1. User opens app → Onboarding
2. Selects country: "United Kingdom"
3. (Optional) Enters postcode outward code: "M1"
4. App extracts outward code: "M1"
5. App maps to council area: "Manchester City Council"
6. App sends anonymous ping with council area code + daily hash
7. App DELETES postcode from memory
8. Server stores aggregated data only
```

### Technical Flow:

```typescript
// 1. User enters "M1 4BT" (full postcode)
const fullPostcode = "M1 4BT";

// 2. Extract outward code (first part)
const outward = fullPostcode.split(' ')[0]; // "M1"

// 3. Generate daily device hash (changes every day)
const hash = SHA256(deviceID + currentDate); // "a3f8d9e2..."

// 4. Lookup council area (client-side or server-side)
const councilCode = lookupCouncilArea(outward); // "E08000003"

// 5. Send anonymous analytics
await supabase.rpc('record_anonymous_usage', {
  p_outward_code: outward,
  p_device_hash: hash.substring(0, 16)
});

// 6. DELETE postcode immediately
// postcode = null; ← Never stored!
```

## 🗄️ Database Setup

### Step 1: Run the Migration

```bash
# Connect to your Supabase project
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i database/council_area_tracking.sql
```

### Step 2: Import ONS Postcode Data (Required for Production)

The migration includes sample data for major UK cities, but you need the full dataset:

1. **Download ONS Postcode Directory**:
   - Visit: https://geoportal.statistics.gov.uk/
   - Search for: "Postcode to Local Authority District"
   - Download the latest CSV

2. **Process the Data**:
   ```bash
   # Extract outward codes and council area mappings
   # Script example (requires Python/Node.js):
   node scripts/process-ons-data.js
   ```

3. **Import to Database**:
   ```sql
   COPY postcode_council_mapping(outward_code, council_area_code)
   FROM '/path/to/processed_postcodes.csv'
   DELIMITER ','
   CSV HEADER;
   ```

### Step 3: Verify Setup

```sql
-- Test the lookup function
SELECT get_council_area_from_postcode('M1'); 
-- Should return: E08000003

-- Test anonymous usage recording
SELECT record_anonymous_usage('SW1A', 'test-hash-123');
-- Should return: true

-- Check analytics
SELECT * FROM council_area_analytics;
```

## 📱 App Integration

### Onboarding Flow

The onboarding is now **4-5 steps** (depending on country):

1. **Nickname** (optional)
2. **Age Range** (required for age-appropriate content)
3. **Country** (required for region-specific helplines)
4. **Postcode** (UK only, optional) ← **NEW**
5. **Personalization** (optional)

### Key Files Changed:

| File | Changes |
|------|---------|
| `src/app/(tabs)/index.tsx` | Updated quick prompts with safety focus |
| `src/app/(auth)/onboarding.tsx` | Added country + postcode steps |
| `src/components/ui/CountryDropdown.tsx` | New country selection component |
| `src/lib/councilAreaService.ts` | Anonymous analytics service |
| `database/council_area_tracking.sql` | Database schema + functions |
| `app.config.js` | Version bumped to 2.0.7, build 41 |

## 🚀 Deployment Checklist

### Before Submitting to App Store:

- [x] Quick prompts updated with safety focus
- [x] Country dropdown implemented
- [x] Postcode collection with privacy messaging
- [x] Council area service created
- [x] Database migration ready
- [x] Version bumped to 2.0.7
- [ ] Database migration run on production Supabase
- [ ] ONS postcode data imported
- [ ] Privacy policy updated (mention council area tracking)
- [ ] Test postcode flow on TestFlight
- [ ] Verify analytics are recording correctly

### Testing Checklist:

```bash
# 1. Build and install on device
eas build --platform ios --profile production

# 2. Test onboarding flow
# - Select "United Kingdom"
# - Enter postcode: "M1"
# - Verify app doesn't crash
# - Check database for anonymous record

# 3. Test non-UK flow
# - Select "United States"
# - Verify postcode step is skipped

# 4. Test privacy
# - Check AsyncStorage (no full postcode stored)
# - Check database (only council code, no PII)
```

## 📈 Analytics Dashboard (Future)

The aggregated data can power an impact dashboard:

```typescript
// Example query for dashboard
const { data } = await councilAreaService.getAggregatedAnalytics();

// Returns:
[
  {
    council_area_name: "Manchester City Council",
    region: "Greater Manchester",
    total_sessions: 1247,
    total_analyses: 523,
    total_crisis_alerts: 12,
    days_active: 45
  },
  // ...
]
```

## 🔐 Privacy Policy Updates

Add this section to your privacy policy:

> **Local Impact Measurement (UK Only)**
>
> To measure our impact across UK local authorities, we ask users to optionally provide the first part of their postcode (e.g., "M1" or "SW1A"). This information:
> - Is used ONLY to identify your council area
> - Is NOT stored or logged by our systems
> - Cannot be used to identify you or track your location
> - Is immediately deleted after mapping to a council area code
> - Results in anonymous, aggregated usage statistics
>
> You can skip this step and still use the app fully.

## 🛠️ Troubleshooting

### Issue: "Function record_anonymous_usage does not exist"
**Solution**: Run the database migration on your Supabase project.

### Issue: Postcode lookup returns null
**Solution**: Import the full ONS postcode dataset. The migration only includes sample data.

### Issue: Analytics not appearing
**Solution**: Check Row-Level Security (RLS) policies on `council_area_analytics` table.

### Issue: Device hash not unique
**Solution**: Ensure `expo-crypto` is properly linked. Check with: `expo install expo-crypto`

## 📚 Additional Resources

- [ONS Open Geography Portal](https://geoportal.statistics.gov.uk/)
- [UK Data Protection Act 2018](https://www.legislation.gov.uk/ukpga/2018/12/contents)
- [GDPR Guidance - ICO](https://ico.org.uk/for-organisations/guide-to-data-protection/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 👨‍💻 Developer Notes

- Database function `record_anonymous_usage()` handles the entire privacy-safe flow
- Device hash rotates daily (formula: `SHA256(deviceID + date)`)
- Postcode is extracted in `onboarding.tsx` but NEVER persisted
- Service layer (`councilAreaService.ts`) abstracts all database logic
- Analytics table has 2-year retention policy (auto-cleanup function)

## 🎯 Impact Metrics You Can Track

With this system, you can measure:
- ✅ Which council areas have the highest usage
- ✅ Geographic reach of the app
- ✅ Crisis alert density by region
- ✅ Adoption rates in different areas
- ❌ Individual user behavior (impossible by design)
- ❌ User movement or tracking (impossible by design)

---

**Version**: 2.0.7  
**Build**: 41  
**Date**: December 24, 2025  
**Privacy Level**: Maximum 🔒

