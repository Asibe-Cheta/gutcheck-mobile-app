# GutChecks v2.1 Task Board (Spec-Mapped)

Execution owner: Codex (implementation team)  
Tracking source: `ENHANCEMENTS.MD` and `ENHANCEMENTS_EXECUTION_PLAN.md`

Status key:
- `[ ]` Not started
- `[-]` In progress
- `[x]` Done

---

## Phase 0 — Compliance Hotfixes

- [x] A.3 Replace all "relationship companion" app framing
- [x] A.3 Update chat header subtitle to approved non-companion language
- [x] A.3 Update settings/about copy to approved non-companion language
- [x] A.3 Remove "companion" language from AI prompt templates
- [x] Cross-cutting Replace "GutCheck" with "GutChecks" where product naming is user-facing
- [-] Cross-cutting Align copy with all-interactions scope (not relationship-only)
- [x] A.3 Apply exact disclaimer text required in Part A
- [x] Cross-cutting Add banned-phrase compliance sweep (`companion`, first-person app persona)

---

## Phase 1 — Part A Safeguarding Core

- [x] F.3 Build deterministic input classifier for categories A/B/C/D
- [x] A.5 Implement hardcoded response templates for A/B/C
- [x] A.5 Enforce "no LLM generation" in A/B/C architecture path
- [x] A.4 Keep model path only for category D standard flow
- [x] A.4 Add deterministic output filter (forbidden phrasing, signposting, closer)
- [-] A.4 Add session-level checks (length caps, escalation guards)
- [x] F.3 Add anonymised A/B/C audit event logging
- [x] F.3 Verify privacy claim wording matches implemented data architecture
- [x] F.3 Update privacy policy references for safeguarding logging and consent framing
- [x] F.3 Prepare safeguarding panel review packet for hardcoded templates

---

## Phase 2 — Part D Action Step Effectiveness Tracker

- [x] ET-01 Check prior session for action steps at login
- [x] ET-02 Enforce once-per-qualifying-login prompt behavior
- [x] ET-03 Implement configurable cooldown window (24-72h)
- [x] ET-04 Record anonymised skipped event on dismissal
- [x] ET-05 Surface only most recent session's steps
- [x] ET-06 Do not show prompt if no prior action steps
- [x] EU-01 Build card/modal shown on post-login home
- [x] EU-02 Use spec-compliant tool-voiced heading
- [x] EU-03 Render each action step as selectable item
- [x] EU-04 Support single, multiple, or all selection
- [x] EU-05 Add "I didn't act on any" option
- [x] EU-06 Add optional anonymous free-text barrier field (max 280)
- [x] EU-07 Keep Submit and Skip always visible
- [x] EU-08 Show brief neutral confirmation on submission
- [x] EU-09 Keep flow completion under 60 seconds
- [x] ED-01 Block PII collection by design
- [x] ED-02 Use random non-sequential non-linkable session token
- [x] ED-03 Store topic/category only, never original query text
- [x] ED-04 Store status fields (Acted/Not acted/Skipped)
- [x] ED-05 Add automated PII scrubbing for free text before storage
- [x] ED-06 Store elapsed time in bucketed ranges only
- [x] ED-07 Store age group only (no precise DOB/age)
- [x] ED-08 Store query topic category where determinable
- [x] ED-09 Store count of steps shown vs acted
- [x] ED-10 Enforce aggregate-only query access model
- [-] D.5 Build aggregate metrics views (effectiveness, engagement, outcomes)
- [x] D.6 Add plain-English transparency notice at prompt
- [x] D.6 Implement retention rules (raw <= 30 days; aggregated rolling window)
- [x] D.6 Complete DPIA/legal sign-off readiness checklist

---

## Phase 3 — Part C Awareness Hub MVP

- [x] HB-01 Add dedicated Awareness Hub landing screen
- [x] HB-02 Build dashboard with both pillars on map/card layout
- [x] HB-03 Show track metadata (name, pillar, icon, level, progress)
- [x] HB-04 Implement topic states (Locked/In progress/Completed)
- [x] HB-05 Start path with H-01 before branching
- [x] HB-08 Add pillar toggle (Harmful/Healthy/All)
- [x] AQ-01 Require age-group confirmation before first Hub access
- [x] AQ-02 Implement simple age-group chooser (no DOB form)
- [x] AQ-03/AQ-04 Support all required age bands + junior consent flow
- [x] AQ-05 Gate junior access behind parental/guardian consent notice
- [x] AQ-06 Allow age-group updates in Settings with confirmation
- [x] AQ-07 Show short privacy note during age selection
- [x] QB-01 Deliver 5-10 questions per level
- [x] QB-02 Support required question formats
- [x] QB-03 Show immediate explanation after each question
- [x] QB-05 Enforce pass score threshold (~80%) for unlock
- [x] QB-08 Serve age-appropriate tagged content only
- [x] LC-04 Add signposting to trusted age/region-appropriate resources
- [-] PT-01 Persist progress per topic/level across devices
- [x] PT-07 Add streak counter
- [x] DR-01 Add configurable opt-in daily push reminders for Hub
- [x] DR-07 Prevent push to under-13 without confirmed parental consent
- [x] C.7 Add sensitive topic warning and skip option
- [x] C.7 Add always-accessible "I need help" button in Hub
- [x] C.7 Ensure all copy is non-judgmental and Part A voice compliant
- [x] C.9 Keep radicalisation track deferred and explicitly excluded from MVP

---

## Phase 4 — Part E Recommend & Protect

- [-] RP-01 Enforce max 5 recommendation slots per account (lifetime)
- [x] RP-02 Build slot UI with used vs available visibility
- [x] RP-03 Show non-identifying labels and send status per used slot
- [x] RP-04 Ensure no recipient contact/name/email/phone storage
- [x] RP-05 Keep used slots permanent and non-reassignable
- [-] RP-06 Enforce 5-slot cap server-side
- [x] RP-07 Display persistent slot counter (e.g., 3 of 5)
- [x] SH-01 Use native share sheet only (no direct contact access)
- [x] SH-02 Support key channels (WhatsApp, SMS/iMessage, Email, Copy link, device apps)
- [x] SH-03 Provide editable per-channel message templates
- [x] SH-04 Ensure warm, non-alarming, all-interactions scope messaging
- [x] SH-05 Generate unique anonymised referral link per share
- [x] SH-06 Generate unique link per slot for status lifecycle
- [x] SH-07 Do not consume slot when share sheet is dismissed
- [x] SH-08 Allow different method per slot
- [x] E.4 Update default templates to exact v2.1 language
- [x] E.5 Track slot statuses (Sent/Opened/Downloaded)
- [x] E.5 Keep labels non-identifying; never expose recipient identity
- [x] E.6 Implement trigger moments with one-prompt-per-session limit
- [x] E.6 Stop prompts once all 5 slots are used
- [x] E.7 Add Recommend & Protect privacy note
- [x] E.7 Apply purpose limitation (no re-marketing/profiling)
- [x] E.7 Complete deep-link DPA + DPIA readiness checklist

---

## Phase 5 — Part B Voice Mode

- [-] VR-01 Add microphone icon in primary query input
- [-] VR-02 Request microphone permission with clear rationale
- [-] VR-03 Start recording on tap after permission
- [-] VR-04 Show clear recording indicator/waveform while active
- [-] VR-05 Show real-time transcription in input field
- [-] VR-06 Show Stop and Send actions during/after recording
- [-] VR-07 Stop keeps transcript editable pre-submit
- [-] VR-08 Send transcribes and submits
- [-] VR-09 Preserve previously entered text when reactivating mic
- [-] VR-10 Show soft prompt after 5s silence while recording
- [ ] VR-11 Fully display model response text on-screen
- [ ] VR-12 Stream response progressively
- [ ] VR-13 Keep response scrollable after read-back
- [-] VR-14 Make auto read-back setting-controlled
- [-] VR-15 Add visible mute/pause during read-back
- [-] VR-16 Add skip control for current read-back
- [-] VR-17 Add read-back speed controls (0.75x/1x/1.25x/1.5x/2x)
- [ ] VR-18 Support curated neutral voices/languages only
- [ ] VR-19 Sync TTS with streaming text where provider supports
- [ ] VR-20 Enforce A/B/C read-back uses hardcoded template text only
- [-] VR-21 Auto-pause read-back on call/mic reactivation
- [ ] B.2 Curate and approve voice list (no persona/child-like/breathy voices)
- [ ] B.2 Ensure no separate voice persona prompt
- [ ] B.2 Disable continuous listening/wake word/background listening
- [-] B.2 Keep full transcript visible before and after submit
- [-] B.2 Auto read-back off by default for all users
- [-] B.2 Require extra under-18 confirmation before enabling auto read-back
- [-] B.2 Stop read-back when app backgrounds
- [-] B.2 Show 15-minute continuous-session step-away prompt
- [-] B.2 Disable voice mode for remainder of A/B/C-triggered sessions
- [-] B.2 Ensure no raw audio storage (transient memory only)
- [-] B.2 Ensure mic permission revocation does not break text mode

---

## Cross-Cutting Quality, Compliance, and Launch Gates

- [ ] F.2 Execute in recommended build order (A -> D -> C -> E -> B)
- [ ] F.3 Complete full consolidated checklist and evidence links
- [ ] F.3 Run 50-prompt safeguarding test pass
- [ ] F.3 Finalise DSIT submission package
- [ ] F.3 Finalise KCSIE mapping document
- [ ] Cross-cutting Run regression suite for notifications, chat, crisis, and subscription gates
- [ ] Cross-cutting Complete copy QA pass for all-interactions terminology
- [ ] Cross-cutting Complete privacy/security QA for all new data flows

