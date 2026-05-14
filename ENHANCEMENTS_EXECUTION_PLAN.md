# GutChecks v2.1 Execution Plan and Mapped Checklist

This document translates `ENHANCEMENTS.MD` into an execution plan and a delivery checklist.

Owner: Codex (implementation team)  
Date: 2026-05-08  
Source of truth: `ENHANCEMENTS.MD` (v2.1)

## Delivery Phases

### Phase 0 — Brand, naming, and voice compliance hotfix
- Replace all user-facing and prompt-level `GutCheck` references where product naming should be `GutChecks`.
- Remove forbidden "companion" framing from UI and prompts.
- Align disclaimer text to Part A.
- Add a copy compliance sweep for all-interactions scope language.

### Phase 1 — Part A safeguarding architecture hardening
- Implement deterministic classifier flow for A/B/C/D categories.
- Enforce hardcoded templates for A/B/C with no LLM generation in these paths.
- Add deterministic output filtering and session-level safeguards.
- Add auditable event logging for safeguarding decisions.

### Phase 2 — Part D Action Step Effectiveness Tracker
- Implement qualifying login trigger logic.
- Build follow-up prompt UI and submission flow.
- Enforce anonymisation-by-architecture and retention policy.
- Expose aggregate-only metrics for internal reporting.

### Phase 3 — Part C Awareness Hub MVP
- Ship Hub shell, pillar toggle, age confirmation and age gating.
- Deliver MVP tracks and level flow with explanations and pass thresholds.
- Add progress persistence, streaks, and daily challenge/reminder controls.
- Add always-available "I need help" signposting path.

### Phase 4 — Part E Recommend & Protect
- Implement lifetime 5-slot mechanic with server-side enforcement.
- Add per-slot anonymised referral links and slot-level status tracking.
- Keep sharing native-share-sheet only; no contact access.
- Stop prompts after all 5 slots are used.

### Phase 5 — Part B Voice Mode (ship last)
- Build STT input, transcript visibility, and TTS read-back controls.
- Enforce all voice safeguards in B.2 technically (not prompt-only).
- Disable voice in-session after A/B/C trigger.
- Add background/call interruption handling and 15-minute break prompt.

### Release Gates
- Run full safeguarding validation pass (50 prompt suite).
- Complete copy compliance sweep.
- Confirm legal/privacy artifacts are ready for DSIT/KCSIE completion package.

---

## Mapped Checklist (Spec ID -> Delivery Status)

Legend: `Done` = implemented and aligned to v2.1, `Partial` = exists but not compliant/complete, `Missing` = not implemented.

| Part | Spec ID | Requirement (short) | Current Status | Planned Phase | Owner | Notes |
|---|---|---|---|---|---|---|
| A | A.3 | Replace "relationship companion" subtitle/app framing | Done | 0 | Codex | Updated in chat header, settings/about copy, FAQ, and AI prompt text |
| A | A.3 | Standard chat disclaimer text alignment | Done | 0 | Codex | Chat disclaimer now matches required Part A wording |
| A | A.4 | Tiered response logic 1..4 (classifier/prompt/filter/session checks) | Partial | 1 | Codex | Crisis logic exists; full deterministic pipeline not complete |
| A | A.5 | Hardcoded A/B/C templates with deterministic enforcement | Done | 1 | Codex | Deterministic A/B/C hardcoded routing now enforced across conversation subflows before model calls |
| A | F.3-1 | Input classifier A/B/C/D | Done | 1 | Codex | Deterministic classifier implemented with attachment false-positive guard and self-check fixtures |
| A | F.3-2 | Output filter for forbidden phrasing/signposting/closer | Done | 1 | Codex | Deterministic post-processing filter and mandatory high-risk signposting now applied across conversation and follow-up response paths |
| A | F.3-3 | Session-level checks | Partial | 1 | Codex | Session length and repeated dependency-language guards implemented; additional v2.1 checks still pending |
| A | F.3-4 | Anonymised A/B/C audit logging | Partial | 1 | Codex | Local audit logging now stores metadata-only records (no message text); server/event model still pending |
| A | F.3-5 | Global copy update to all-interactions scope | Partial | 0 | Codex | Core surfaces updated; broader feature-area copy sweep still in progress |
| B | VR-01..10 | Voice input controls, transcript, Stop/Send flow | Missing | 5 | Codex | No complete STT interaction flow implemented |
| B | VR-11..13 | Response display and persistence | Partial | 5 | Codex | Text response exists; voice-mode-specific behavior missing |
| B | VR-14..21 | Read-back controls/speed/voice policy/interruptions | Missing | 5 | Codex | No full TTS controls and safeguards found |
| B | B.2-1 | Neutral curated voice list with sign-off | Missing | 5 | Codex | No curated voice governance path |
| B | B.2-2 | No continuous listening / clear recording indicator | Missing | 5 | Codex | Not implemented |
| B | B.2-3 | A/B/C hardcoded text only in voice mode | Missing | 5 | Codex | Depends on Phase 1 + voice integration |
| B | B.2-4 | Disable voice for remainder of A/B/C-triggered session | Missing | 5 | Codex | Not implemented |
| B | B.2-5 | No raw audio retention (transient only) | Missing | 5 | Codex | Needs provider and architecture guarantees |
| C | AQ-01..07 | Age confirmation and gating | Partial | 3 | Codex | First-access age confirmation, age bands, junior consent gate, and settings-triggered update entry are implemented |
| C | HB-01..08 | Hub landing/dashboard/pillar toggle/topic states | Partial | 3 | Codex | Dedicated Awareness Hub tab and dashboard shell implemented with topic cards, states, pillar toggle, and enforced H-01-first learning path; remaining polish/content breadth still pending |
| C | QB-01..08 | Quiz engine and explanations | Partial | 3 | Codex | Quiz engine supports multiple-choice, true/false, scenario reorder, and reflective short responses with immediate explanations, 80% pass threshold, age-tag filtering, and harmful-track signposting to trusted age/region resources |
| C | PT-01/PT-07 | Progress persistence and streaks | Partial | 3 | Codex | Local per-track progress persistence and streak counter implemented; cross-device persistence still pending |
| C | DR-01/DR-07 | Daily push reminders with under-13 consent guard | Done | 3 | Codex | Hub reminder opt-in now schedules/cancels dedicated daily notifications and blocks under-13 enablement without consent |
| C | C.7 | Sensitive content warnings + always-on "I need help" | Done | 3 | Codex | Hub-specific sensitive warning gate and always-accessible "I need help" actions are implemented |
| D | ET-01..06 | Trigger logic on qualifying login | Done | 2 | Codex | Qualifying login/focus trigger implemented with latest-chat selection, once-per-cycle behavior, and configurable 24-72h cooldown |
| D | EU-01..09 | Prompt UI, checkboxes, skip, optional barrier text | Done | 2 | Codex | Follow-up modal implemented with selectable steps, no-action option, optional barrier text, submit/skip, and brief confirmation flow |
| D | ED-01..10 | Anonymised data architecture and aggregate-only query | Partial | 2 | Codex | Local anonymized feedback events include tokenized metadata, category-only storage, and barrier-text scrubbing; server aggregate access model still pending |
| D | D.5 | Internal effectiveness dashboard metrics | Partial | 2 | Codex | Local aggregate summary adapter and in-app local metrics view implemented; full internal dashboard pipeline still pending |
| D | D.6 | Privacy and GDPR design principles | Partial | 2 | Codex | Local 30-day raw retention pruning and DPIA/legal readiness checklist added; server-side retention/access controls still pending |
| E | RP-01..07 | 5-slot lifetime recommendation mechanic | Partial | 4 | Codex | Local 5-slot tracking service and slot counter UI wired into share flow; when referral verification mode is enabled, slot consumption now requires backend slot reservation approval and authenticated account-bound user ID; full backend rollout still pending |
| E | SH-01..04 | Native share sheet + editable message tone rules | Partial | 4 | Codex | Native share and editable per-channel templates now in Recommend & Protect, with v2.1-aligned default WhatsApp/SMS/Email wording and email subject support; final channel-specific deep-link optimization still pending |
| E | SH-05..08 | Per-slot anonymised link/status tracking | Partial | 4 | Codex | Local unique token links and callback status updates implemented; callback flow now includes backend verification endpoint with env-based enablement/base-URL override and graceful Sent fallback when unavailable; full provider integration still pending |
| E | E.5 | Sent/Opened/Downloaded status badges | Partial | 4 | Codex | Recommend & Protect screen shows local status badges and callback status updates are verification-gated; screen now exposes verification mode/base URL diagnostics for rollout validation; full provider-backed event pipeline still pending |
| E | E.6 | Trigger moments and prompt suppression logic | Partial | 4 | Codex | Nudge timing exists, dismissed shares do not consume slots, prompts stop when all 5 slots are used, same-session prompt suppression is enforced, deferred post-query/post-quiz plus post-action-follow-up trigger checks are wired, and a one-time opt-in Recommend push trigger is available; remaining multi-trigger rollout still pending |
| E | E.7 | No recipient PII + privacy note + purpose limits | Partial | 4 | Codex | On-screen privacy note now added in Recommend & Protect and Privacy screen copy explicitly states no re-marketing/profiling usage; Part E DPA/DPIA readiness checklist drafted (`DPIA_DPA_SIGNOFF_CHECKLIST_PART_E.md`); formal legal/provider sign-offs still pending |
| F | F.2 | Build order A -> D -> C -> E -> B | Missing | 0..5 | Codex | This document sets implementation order |
| F | F.3 | Consolidated checklist completion | Partial | 0..5 | Codex | Phase 0 and major Phase 1 safeguards completed; later phases pending |
| F | F.3 | 50-prompt safeguarding validation pass | Missing | Release | Codex | Must run before launch sign-off |
| F | F.3 | DSIT/KCSIE finalization package readiness | Missing | Release | Codex | Final documentation gate after feature completion |

---

## Immediate Sprint Focus (Execution Start)

- [-] Phase 0 copy/name cleanup (`GutChecks` naming + remove companion framing)
- [ ] Phase 1 deterministic safeguarding pipeline skeleton (classifier + hardcoded A/B/C routing)
- [x] Part A disclaimer and header compliance updates
- [x] Add compliance test list for banned phrases and all-interactions language

