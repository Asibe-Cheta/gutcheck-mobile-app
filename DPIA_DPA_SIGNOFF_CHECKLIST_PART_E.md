# Part E DPA / DPIA Sign-Off Checklist

Owner: Codex (implementation team)  
Scope: `ENHANCEMENTS.MD` Part E (Recommend & Protect)  
Status: Draft for legal + privacy review

## 1. Data Map and Purpose Limitation

- [x] Slot model stores non-identifying labels only (`Recommendation 1..5`)
- [x] No recipient name, phone, email, or contact details are stored
- [x] Status model constrained to Sent / Opened / Downloaded
- [x] Tracking data used only for slot status display and aggregate analytics
- [x] In-app privacy copy states no re-marketing/profiling usage
- [ ] Confirm final public Privacy Policy text includes this exact purpose limitation language

## 2. Link Tracking and Verification Controls

- [x] Each slot uses unique anonymized tokenized referral link
- [x] Callback status updates gated by verification endpoint check when enabled
- [x] Graceful fallback keeps slot at Sent when tracking unavailable
- [x] Env-gated rollout controls for verification mode and base URL
- [x] Optional backend slot reservation gate for local slot consumption (verification mode)
- [ ] Confirm provider contract/DPA terms for production deep-link or attribution provider
- [ ] Confirm backend endpoint auth/rate limits and abuse protections

## 3. Transparency and User Controls

- [x] Recommend & Protect screen includes plain-English privacy note
- [x] One-time opt-in push reminder includes install-level fire-once guard
- [x] Prompts stop when all 5 slots are consumed
- [x] Share remains native sheet only (no direct contact access)
- [ ] Confirm legal review of user-facing copy and consent framing

## 4. Retention and Access Governance

- [x] Client tracking state is slot-scoped and minimal
- [x] Debug diagnostics are local and user-resettable
- [ ] Define server retention schedule for referral events
- [ ] Define role-based access controls for referral analytics
- [ ] Ensure aggregate-only reporting policy is documented for internal dashboards

## 5. Legal / Compliance Sign-Off

- [ ] Deep-link provider DPA signed (name/date/reference)
- [ ] Part E DPIA completed and archived (link/reference)
- [ ] Privacy/legal sign-off recorded (name/date)
- [ ] Safeguarding review confirms mission-led non-incentivized framing

