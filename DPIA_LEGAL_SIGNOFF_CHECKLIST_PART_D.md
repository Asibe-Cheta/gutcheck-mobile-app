# Part D DPIA / Legal Sign-Off Checklist

Owner: Codex (implementation team)  
Scope: `ENHANCEMENTS.MD` Part D (Action Step Effectiveness Tracker)  
Status: Draft for legal + safeguarding review

## 1. Data Map

- [x] Follow-up events store metadata only (no original user query text)
- [x] Free-text barrier input is scrubbed before classification/use
- [x] Status model captured: acted_upon / not_acted_upon / skipped
- [x] Time-to-action captured in bucketed ranges only
- [x] Age captured as age group only
- [x] Category captured as inferred topic only
- [x] Event token is random and non-sequential

## 2. Retention

- [x] Local raw feedback events are pruned to 30-day rolling window
- [x] Local bounded buffer in place for event storage
- [ ] Confirm server-side retention policy mirrors 30-day raw / 24-month aggregate target
- [ ] Confirm deletion routines for migrated/raw server records

## 3. Access and Query Controls

- [x] Current local metrics view is aggregate-only
- [ ] Define role-restricted server dashboard access matrix
- [ ] Prevent per-user record retrieval in production analytics endpoints
- [ ] Add audit logs for dashboard access (server-side)

## 4. Transparency and Consent

- [x] Prompt includes plain-English transparency note
- [x] Privacy page reflects minimized logging model
- [ ] Confirm Privacy Policy legal wording matches final data flow
- [ ] Confirm in-product wording approved by legal/compliance

## 5. Legal / Compliance Sign-Off

- [ ] Legal review completed (name/date)
- [ ] DPIA completed and stored (link/reference)
- [ ] Safeguarding panel reviewed Part D wording
- [ ] Founder sign-off recorded

