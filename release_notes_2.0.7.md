# GutCheck v2.0.7 Release Notes

**Release Date**: December 24, 2025  
**Build Number**: 41 (iOS), 196 (EAS)  
**Type**: Feature Update + Safety Improvements

---

## 🚨 What's New

### 1. **Enhanced Safety-Focused Quick Prompts**

We've updated the home screen quick prompts to better detect grooming and exploitation:

- ✅ "Someone made me feel guilty"
- ✅ **"Someone asked me to keep a secret"** ← NEW (grooming red flag)
- ✅ **"Someone says I can't tell anyone"** ← NEW (exploitation warning)

These prompts help users quickly identify potentially dangerous situations related to:
- Grooming behavior
- Sexual exploitation
- Emotional manipulation
- Coercion

### 2. **Improved Onboarding Experience**

**Country Selection (Replaces "Region")**:
- Now asks for your **country** instead of vague "region"
- Supports 25+ countries worldwide
- Helps us provide region-specific support resources and helplines

**UK Impact Measurement** (Optional):
- UK users can optionally provide the first part of their postcode (e.g., "M1", "SW1A")
- Helps us measure which council areas are using GutCheck
- **100% anonymous** - your postcode is NEVER stored
- Supports our mission to show real impact to councils and funders

**Privacy Promise**:
- All onboarding data is optional (except age for safety)
- Clear explanations at each step
- No tracking, no PII collection
- GDPR compliant

### 3. **Privacy-First Analytics** (UK Only)

For users in the UK who opt-in:
- We map your postcode to a council area (e.g., "Manchester City Council")
- We record anonymous usage statistics
- This helps us demonstrate impact to local authorities
- **Your postcode is immediately deleted** after mapping
- Only aggregated, anonymous data is stored

**What We Track**:
- Council area codes (not names/addresses)
- Aggregated usage counts
- Daily unique sessions (anonymous)

**What We DON'T Track**:
- Your identity
- Your precise location
- Your full postcode
- Individual behavior

---

## 🔒 Privacy & Security

- Enhanced privacy messaging throughout onboarding
- Clear "Why we need this" explanations for each data point
- Optional steps clearly marked
- All data encrypted in transit and at rest
- Compliant with UK DPA 2018 and GDPR

---

## 🐛 Bug Fixes

- Improved error handling in onboarding flow
- Fixed country dropdown search performance
- Better AsyncStorage management
- Resolved rare crash when skipping onboarding

---

## 💡 Under the Hood

- Database migration for council area tracking
- New `CountryDropdown` component
- `councilAreaService` for anonymous analytics
- Daily-rotating device hashes (prevents long-term tracking)
- Optimized onboarding state management

---

## 📱 App Store Changes

**What's New** (for App Store Connect):

> Version 2.0.7 introduces enhanced safety features and privacy-first impact measurement.
>
> NEW SAFETY PROMPTS: Quick access to analyze situations related to grooming, exploitation, and manipulation. Our updated prompts help you identify concerning behavior faster.
>
> IMPROVED ONBOARDING: Select your country to get region-specific support resources and helplines. UK users can optionally help us measure our local impact while maintaining complete anonymity.
>
> PRIVACY FIRST: All data collection is optional, transparent, and compliant with GDPR. Your postcode is never stored, and all analytics are fully anonymized.
>
> This update strengthens GutCheck's commitment to keeping young people safe while respecting their privacy.

---

## 📊 For Stakeholders

This release enables GutCheck to:
- Demonstrate measurable impact to UK local authorities
- Identify high-need areas for targeted outreach
- Apply for council-level funding with usage data
- Show real-world reach and effectiveness
- All while maintaining industry-leading privacy standards

---

## 🚀 Next Steps

### For Developers:

1. **Run Database Migration**:
   ```bash
   psql [SUPABASE_URL] < database/council_area_tracking.sql
   ```

2. **Import ONS Postcode Data** (Production):
   - Download from ONS Open Geography Portal
   - Process and import to `postcode_council_mapping` table

3. **Update Privacy Policy**:
   - Add section about council area tracking
   - Link to COUNCIL_AREA_TRACKING_README.md

### For App Store Submission:

1. ✅ Build 196 uploaded to TestFlight
2. Attach Build 196 to version 2.0.7 in App Store Connect
3. Update "What's New" text (see above)
4. Submit for review

---

## 📖 Documentation

- Full technical details: `COUNCIL_AREA_TRACKING_README.md`
- Database schema: `database/council_area_tracking.sql`
- Service implementation: `src/lib/councilAreaService.ts`

---

## ⚠️ Breaking Changes

**None** - This is a backwards-compatible update. Existing users will see the new onboarding flow on next launch.

---

## 🙏 Acknowledgments

This feature was designed with input from:
- Child safety experts
- Privacy advocates
- Local authority safeguarding teams
- Young people with lived experience

Special thanks to the ONS for providing open postcode data.

---

## 📞 Support

Questions about this release:
- Technical: check `COUNCIL_AREA_TRACKING_README.md`
- Privacy: support@mygutcheck.org
- General: https://mygutcheck.org/contact

---

**Previous Version**: 2.0.6  
**Next Planned Version**: 2.0.8 (TBD)

