# Safeguarding Panel Review Packet (Part A Templates)

Owner: Codex (implementation team)  
Date: 2026-05-08  
Scope: Part A template and routing review for `ENHANCEMENTS.MD` v2.1

## 1) Purpose

This packet prepares the safeguarding advisory panel review of deterministic high-risk routing in the app.  
Focus: category A/B/C hardcoded responses, no-LLM enforcement, and signposting consistency.

## 2) Implementation Snapshot

- Deterministic classifier implemented in `src/lib/ai.ts` (`A/B/C/D`).
- Hardcoded templates implemented for `A`, `B`, and `C`.
- A/B/C routing enforced before model calls in:
  - `handleInitialMessage`
  - `handleConversation`
  - `handleFollowUpMessage`
  - `provideConversationalAnalysis`
  - `getImmediateResponse`
  - `getDirectAdvice`
  - `handleAIComplaint`
- Deterministic output safeguards/signposting applied across standard conversation paths.
- Safeguarding audit logging implemented as metadata-only local records (no full message text).

## 3) Hardcoded Templates For Review

### Category A (Crisis / Immediate danger)
`You may be in immediate danger. Call emergency services now; in the UK call 999. Move to a safer place if possible and contact a trusted adult, friend, or family member right away. If you want, GutChecks can help you list the next safest steps once you are safe.`

### Category B (Attachment / dependency toward app)
`GutChecks is a guidance tool and cannot be a friend or companion. What you are feeling matters. Reach out now to a trusted person in your life and talk with them directly. If you want support options, GutChecks can help you find practical next steps and local services.`

### Category C (Disclosure requiring direct support signposting)
`Thank you for sharing that. What happened to you matters, and you deserve support. If you are in immediate danger, call emergency services now; in the UK call 999. Consider contacting a trusted adult, safeguarding lead, or specialist support service in your area. If you want, GutChecks can help you plan safe next steps.`

## 4) Review Questions For Panel

- Is each template wording appropriate for the intended category risk level?
- Are signposting expectations sufficiently clear for under-18 users?
- Are any phrases too strong, too soft, or likely to be misread?
- Is the non-companion boundary clear in category B wording?
- Should any category-specific resources be mandated by region/age in the hardcoded text itself?

## 5) Current Known Gaps

- Classifier keyword tuning still needs broader dataset validation.
- Voice Mode-specific A/B/C template read-back path is pending (Part B phase).
- Server-side safeguarding audit event model is pending; current implementation is local metadata only.

## 6) Approval Checklist

- [ ] Panel reviewed Category A template text
- [ ] Panel reviewed Category B template text
- [ ] Panel reviewed Category C template text
- [ ] Panel approved wording as launch-ready
- [ ] Required changes captured and tracked
- [ ] Final sign-off recorded with date and approver names

