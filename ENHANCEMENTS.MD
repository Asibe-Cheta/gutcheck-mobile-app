GutChecks: Red Flags & Safety
Consolidated Developer Specification (v2.1)
This document consolidates the original safeguarding response architecture (Part A) with
four new feature requirements (Parts B to E). All features are aligned with the principle
that GutChecks supports users across all everyday interactions, online and offline, not
only relationships. Development is scheduled to begin immediately; the DSIT submission
and KCSIE mapping document will be finalised on feature completion.
Document owner Marlyce, Founder, GutChecks
Audience Lead developer; safeguarding advisory panel; DSIT reviewers
Status Active &mdash; for implementation; development begins immediately
Supersedes v1.0 (Safeguarding Spec, 2 May 2026); v2.0 (3 May 2026)
Submission timing DSIT submission and KCSIE mapping to be finalised on feature completion
Related submissions DSIT; Online Safety Act compliance evidence pack; KCSIE mapping
Document map
bullet Part A — Safeguarding Response Architecture (original v1.0). Voice rules, hardcoded
high-risk templates, tiered response logic, and the standard-path system prompt.
bullet Part B — Voice Mode. Voice input, transcription, and TTS read-back; aligned with
safeguarding voice rules; safety measures hardened in v2.1.
bullet Part C — The Awareness Hub. Interactive learning quiz covering both unhealthy patterns and
healthy interactions across all everyday environments. Radicalisation track deferred to a future
iteration.
bullet Part D — Action Step Effectiveness Tracker. Anonymised follow-up to measure real-world
impact of GutChecks guidance.
bullet Part E — Recommend & Protect. Mission-led, privacy-safe sharing feature with a hard
5-recipient cap.
bullet Part F — Cross-cutting alignment. How the new features interact with the safeguarding
architecture, plus a consolidated implementation checklist.
Cross-cutting principles (apply to every feature)
bullet Scope language. GutChecks covers all interactions, online and offline; not only relationships.
Copy across every feature must reflect this; references to “relationships” alone must be
replaced with “interactions and relationships”, “everyday interactions”, or comparable phrasing.
GutChecks: Developer Specification v2.1 Page 1
bullet Voice rules. The app never refers to itself in the first person, never performs friendship, and
never presents as a companion. This applies in chat responses, voice read-back, quiz
explanations, follow-up prompts, and share message templates.
bullet Terminology. Use “users” in product copy; reserve “young people” for movement framing.
bullet Punctuation. Use semicolons or commas in place of em dashes throughout user-facing copy.
bullet Safeguarding precedence. Where any new feature conflicts with the safeguarding
architecture in Part A, Part A takes precedence.
GutChecks: Developer Specification v2.1 Page 2
Part A — Safeguarding Response Architecture
A.1 Status
Part A is reproduced from the original Developer Safeguarding Specification (v1.0). It is the
foundation on which all other features sit. It is restated here in summary form for convenience; the full
v1.0 document remains the authoritative source for the hardcoded templates and full system prompt
text.
A.2 Core framing principles (reminder)
bullet GutChecks is a tool, not a presence; not a friend, companion, counsellor, or therapist.
bullet No first-person voice; the app refers to itself as GutChecks or in the second person.
bullet Real-world action over emotional continuation; every response closes with an action prompt.
bullet Signpost early and prominently for any moderate-risk or high-risk signal.
bullet Deterministic handling for high-risk prompts; no LLM generation in those paths.
A.3 App header and disclaimer
The “Your relationship companion” subtitle must be replaced; suggested options are “Your red flag
check” or “Check the situation, not the feeling”. The word “companion” must not appear anywhere in
the app shell, App Store listing, or marketing copy.
The chat-screen disclaimer reads: “GutChecks is a guidance tool, not a counsellor, therapist, friend,
or crisis service. If you are in danger, call 999. For confidential support, see the help options in the
chat.”
A.4 Tiered response logic (recap)
Layer Function Type
1. Input classification Detect categories A (crisis), B (attachment), C (disclosure), D (standard) Deterministic
2. System prompt Enforce voice, tone, structure for category-D LLM responses Model-side
3. Output filterStrip forbidden phrasings, verify signposting, length, closer Deterministic
4. Session-level checks Length cap, attachment-repeat escalation, audit logging Deterministic
A.5 Hardcoded templates (reference)
Templates 7.1 (crisis), 7.2 (attachment), and 7.3 (disclosure) from v1.0 are unchanged. All four new
features must respect these templates; in particular, voice mode (Part B) must not allow the LLM to
generate spoken responses in categories A, B, or C; the hardcoded text is rendered to screen and
read aloud as-is.
GutChecks: Developer Specification v2.1 Page 3
Part B — Voice Mode
B.1 Overview
Voice Mode adds a voice interaction layer to GutChecks. Users may speak a query, see their words
transcribed, see the response on screen, and hear the response read aloud. The reference
experience is the voice mode in Google Gemini; the GutChecks implementation must, however,
comply with the safeguarding voice rules in Part A.
B.2 Safeguarding alignment (mandatory and non-negotiable)
Voice introduces specific safeguarding risks that the original specification did not cover, because
spoken delivery can amplify any drift toward an emotionally present voice. Voice mode is the
highest-risk feature in the v2.1 set; the constraints below are non-negotiable and must be present in
the production build before voice mode is exposed to users. None of these may be relaxed without
documented sign-off from the founder and the safeguarding advisory panel.
bullet Voice persona. The TTS voice must be neutral and tool-styled, not warm-personal. A clear,
plain reading voice is required; intimate, breathy, child-like, flirtatious, or character-styled voices
are prohibited. The voice must not be named (no “Hi, I’m [name]”) and must not be marketed or
referred to as a personality.
bullet Curated voice list. The developer must explicitly curate the available TTS voice list and
exclude any voice that does not meet the neutral, tool-styled requirement. The list must be
reviewed and signed off by the founder before launch.
bullet No first-person spoken language. The text-to-speech engine reads exactly the same text the
chat displays; since chat output is bound by Part A’s voice rules, spoken output inherits them.
There must be no separate “voice persona” system prompt and no voice-specific phrasing.
bullet Hardcoded templates for high-risk paths. If the input classifier matches category A (crisis), B
(attachment), or C (disclosure), the hardcoded template is what gets read aloud. The LLM must
not generate spoken content for these categories under any circumstances. This must be
enforced architecturally, not as a content-policy reminder in a prompt.
bullet No continuous listening. Microphone capture starts on tap and ends on tap or send; there is
no “always listening”, wake-word, or background-listening mode in this version. The
microphone indicator must be visually unmistakable while active.
bullet Visible transcript before submission. The full transcript of what the user said must be visible
on screen before any submission to the model, so users can verify and correct it. The transcript
must remain visible after submission as part of the chat history.
bullet Auto read-back is off by default. For all users in v1, automatic read-back is off by default and
must be explicitly enabled in Settings. For users under 18, automatic read-back must remain off
and require an additional confirmation step to enable, with a plain-English explanation of what
enabling it means.
bullet No background audio. Read-back must stop automatically if the app is sent to the
background, the device receives a phone call, or the user activates the microphone again.
Read-back must never continue while the user is doing something else on the device.
GutChecks: Developer Specification v2.1 Page 4
bullet Session-end break. After a continuous voice-mode session of 15 minutes, the app must
surface a soft prompt suggesting the user step away or talk to a real person, with the same
signposting language used in Part A’s session-level checks.
bullet No voice-mode access for category A/B/C session continuations. If a session has
triggered a category A, B, or C hardcoded template, voice input must be disabled for the
remainder of that session; only text input is permitted. This protects users at moments of
greatest vulnerability from spoken interaction with an AI tool.
bullet No raw audio storage. Voice recordings must not be stored at any point. Audio is held in
transient memory only for the duration of the transcription request and is discarded immediately
afterwards. This must be confirmed in writing with the STT provider via DPA.
bullet Microphone permission revocation. Revocation of microphone permission must not crash
the app or degrade text-mode functionality in any way.
B.3 Functional requirements
B.3.1 Voice input
ID Requirement
VR-01 A microphone icon must be visible in the main query input area.
VR-02 Tapping the microphone must request microphone permission if not already granted, with a clear explanation of why pe
VR-03 Audio capture begins immediately on tap once permission is granted.
VR-04 A visual waveform or audio indicator must show while recording is active.
VR-05 Spoken words must be transcribed in real time and displayed in the input field.
VR-06 Two action buttons must appear during/after recording: <b>Stop</b> (transcribe only) and <b>Send</b> (transcribe an
VR-07 <b>Stop</b> ends recording and retains the transcribed text for editing before submission.
VR-08 <b>Send</b> ends recording, transcribes the audio, and submits the query.
VR-09 Re-activating the microphone must not erase any previously entered text in the input field.
VR-10 If the user has not spoken for 5 seconds while recording, a soft prompt must appear: &ldquo;Still listening. Tap Stop or
B.3.2 Response display
ID Requirement
VR-11 The app&rsquo;s response must be fully displayed as written text, clearly differentiated from the user&rsquo;s input.
VR-12 Text must stream progressively as it is generated, not appear all at once.
VR-13 The response text must remain visible on screen even after read-back ends; the user must be able to scroll back throu
B.3.3 Voice read-back (TTS)
ID Requirement
VR-14 When a response is generated, the app may read it aloud automatically; this behaviour must be controlled by a Setting
VR-15 A clearly visible Mute/Pause control must be available during read-back.
GutChecks: Developer Specification v2.1 Page 5
ID Requirement
VR-16 A Skip control must stop the current read-back and allow a new query.
VR-17 Read-back speed must be configurable (0.75x, 1x, 1.25x, 1.5x, 2x).
VR-18 Multiple voice options and languages must be supported, all neutral and tool-voiced; no character or persona voices.
VR-19 TTS should sync with the on-screen response where streaming TTS is supported by the chosen provider.
VR-20 For category A, B, or C responses (Part A), read-back is permitted only with the hardcoded template text; the LLM is ne
VR-21 Read-back must pause automatically if the device receives a phone call or if the user activates the microphone again.
B.4 Technical considerations
Area Notes
Speech-to-TextNative first (iOS SFSpeechRecognizer, Android SpeechRecognizer). Cloud STT (e.g. Whisper) may be used as fallbac
Text-to-SpeechNative first (iOS AVSpeechSynthesizer, Android TextToSpeech). Cloud TTS may be used; voice list must be curated to
Microphone permissions iOS NSMicrophoneUsageDescription, Android RECORD_AUDIO. Denial must not crash the app; text input must rema
Streaming TTS Where the cloud TTS provider supports streaming, use it so playback begins as text is generated.
Offline fallback Voice input requires connectivity for cloud STT; if offline, fall back to native on-device STT or display a clear error.
Background mode Read-back must not continue if the app is sent to the background; this is a safeguarding decision (a young user must n
Logging Voice-mode session metadata is logged (start/stop, duration, classifier category) but raw audio is never stored.
B.5 UX requirements
bullet Microphone button placed within or adjacent to the primary input field.
bullet Visual waveform or animated indicator while recording.
bullet Voice settings panel for voice selection, language, speed, and auto-read-back toggle.
bullet Graceful degradation: if microphone is denied, text input remains fully functional.
bullet Clear visual indicator (e.g. a small speaker icon next to a response) when read-back is active;
tapping toggles read-back for that response.
B.6 Out of scope (v1)
bullet Wake-word activation (e.g. “Hey GutChecks”).
bullet Video, screen sharing, or camera-based input during voice sessions.
bullet Audio file upload for transcription.
bullet Mid-response interrupt and continuation.
B.7 Acceptance criteria
bullet User can tap the microphone, speak a query, and see accurate real-time transcription.
bullet User can choose to edit before submitting (Stop) or submit directly (Send).
GutChecks: Developer Specification v2.1 Page 6
bullet Response is shown on screen and, when enabled, read aloud in a neutral tool voice.
bullet Mute, pause, and skip controls function correctly during read-back.
bullet TTS and STT settings are configurable in the Voice settings panel.
bullet Microphone permission denial is handled gracefully on both iOS and Android; revoking
permission mid-use does not crash the app.
bullet Category A, B, and C inputs trigger hardcoded templates; the LLM is never invoked for these in
voice mode, and this is enforced architecturally rather than via prompt.
bullet Auto read-back is off by default for all users in v1; for under-18s, enabling it requires an
additional confirmation step.
bullet Voice input is disabled for the remainder of any session that has triggered a category A, B, or C
template.
bullet Read-back stops on background, phone call, or microphone re-activation; never continues
while the user is doing something else.
bullet After 15 minutes of continuous voice-mode use, a step-away prompt is shown.
bullet TTS voice list is curated; no character, persona, breathy, or child-like voices are present.
bullet No raw audio is retained beyond the transient transcription request; this is confirmed in writing
with the STT provider via DPA.
GutChecks: Developer Specification v2.1 Page 7
Part C — The Awareness Hub
C.1 Overview
The Awareness Hub is a progressive, interactive learning experience built into GutChecks. It
educates users about both unhealthy patterns and healthy dynamics across the full range of
everyday interactions, online and offline; including direct messaging, group chats, family
environments, friendships, romantic relationships, school, work, and public spaces. The reference
experience is Duolingo’s Practice Hub.
Scope correction from the source brief. The original feature brief framed several tracks around
“relationships” only. Track names, descriptions, and explanation copy must be re-framed to cover all
interactions, online and offline. The revised pillar and track structure below reflects this.
C.2 Scope disclaimer
“The Awareness Hub is a self-guided awareness tool. It is not a substitute for PSHE or RSHE lessons,
school safeguarding programmes, or professional support. If you are worried about something
happening to you or to someone you know, please talk to a trusted adult or contact one of the support
services listed in the app.”
This disclaimer must appear on the Awareness Hub landing screen, in the onboarding flow for the
Hub, and via an “About this feature” link inside the Hub at all times.
C.3 Age confirmation and content gating
ID Requirement
AQ-01 Before first access to the Hub, the user must confirm their age group.
AQ-02 Age confirmation is a simple selection screen, not a date-of-birth form.
AQ-03 AQ-04 Age groups: Junior (under 13), Teen (13&ndash;15), Older Teen (16&ndash;17), Young Adult (18&ndash;25), Adult (26
after consent
The confirmed age group is stored in the user profile and is used to filter content; it must never be used for advertising,
Users selecting Junior must see a parental/guardian consent notice; access to the Hub is permitted only AQ-05 AQ-06 Users may update their age group from Settings, with a confirmation prompt.
AQ-07 A short privacy note must be shown during age selection.
C.4 Pillar and track structure (revised for all-interactions scope)
C.4.1 Pillar 1 — Recognising harmful patterns
Track ID Track name Environment focus
T-01 Red flags in DMs and private chats Private/direct messaging (online)
T-02 Toxic group chats and online communities Group chats and online spaces
T-03 Harmful family dynamics Home and family
GutChecks: Developer Specification v2.1 Page 8
Track ID Track name Environment focus
T-04 Peer pressure and unhealthy social circles Friends and peer groups
T-05 Unhealthy romantic and intimate dynamics Dating and intimate relationships
T-06 Manipulation and gaslighting All environments
T-07 Online grooming awareness All online environments
T-08 Coercive control All environments
T-09 Bullying and &lsquo;banter&rsquo; School, work, online, in person
T-10 Emotional and verbal abuse All environments
T-11 Digital consent and image-based harm All online environments
T-12 Isolation tactics All environments
T-13 Workplace and professional red flags Work, internships, part-time jobs
T-14 Public-space and stranger interactions Public, transport, events, services
Tracks T-13 and T-14 are additions to the original brief, reflecting the all-interactions scope. A
radicalisation-awareness track is intentionally deferred to a future iteration (see Section C.9),
pending capacity for Prevent-aware safeguarding review.
C.4.2 Pillar 2 — Building healthy interactions
Track ID Track name Environment focus
H-01 What does healthy look like? Foundational; all environments
H-02 Healthy communication All interactions
H-03 Setting and respecting boundaries All environments
H-04 Trust and respect Friendships, romantic, family, work
H-05 Healthy family interactions Home and family
H-06 Positive online interactions DMs, group chats, social platforms
H-07 Friendship and mutual support Peer and social groups
H-08 Consent and autonomy Romantic, digital, social
H-09 Conflict resolution All interactions
H-10 Emotional intelligence and empathy All environments
H-11 Self-worth and personal identity Individual and relational
H-12 When and how to ask for help All environments
H-13 Respect at work and in shared spaces Work, school, public spaces
H-14 Stranger and bystander situations Public spaces, online communities
C.5 Track structure (per topic)
GutChecks: Developer Specification v2.1 Page 9
Level Name Description
1 Awareness 2 Identification Scenario-based recognition of 3 Understanding 4 Real-life response Concept introduction with definitions and foun
the behaviour
Why the pattern matters; impact on others; he
What the user could do in a given scenario, w
5 Mastery check Mixed review of the full topic
C.6 Functional requirements (selected; full list in source brief)
ID Requirement
HB-01 Awareness Hub has a dedicated landing screen accessible from main navigation.
HB-02 Dashboard displays both pillars with topic tracks as cards on a visual learning map.
HB-03 Each topic card shows: track name, pillar label, environment icon, current level, progress bar.
HB-04 Topic states: Locked, In progress, Completed.
HB-05 Recommended starting path begins with H-01 (foundational) before branching.
HB-08 Pillar toggle filters the dashboard between Harmful patterns, Healthy interactions, or All.
QB-01 Each level contains 5&ndash;10 questions.
QB-02 Question formats include multiple choice, true/false, scenario matching, drag-and-drop reordering, and reflective short
QB-03 Every question is followed by an immediate explanation.
QB-05 Minimum pass score (recommended 80%) to unlock the next level.
QB-08 Questions are tagged by age group; only age-appropriate content is served.
LC-04 Where relevant, explanations include signposting to age-appropriate, region-relevant trusted resources.
PT-01 Progress per topic and level is saved to the user profile and persists across devices.
PT-07 A streak counter tracks consecutive days of Hub activity.
DR-01 Daily push notifications are supported, opt-in, and configurable.
DR-07 Push notifications must not be sent to under-13 users without confirmed parental consent.
C.7 Safeguarding and content guidelines (mandatory)
bullet All content (both pillars) must be authored or reviewed by a qualified safeguarding professional
before launch.
bullet No content may be graphic, re-traumatising, or sensationalised; scenarios must be realistic but
handled sensitively.
bullet Sensitive tracks (grooming, coercive control, image-based harm) must show a “This topic may
be sensitive” warning before the level begins, with the option to skip.
bullet An “I need help” button must be accessible from anywhere in the Hub, signposting
age-appropriate support services.
GutChecks: Developer Specification v2.1 Page 10
bullet Tone must be non-judgmental, inclusive, and empowering; users may be at very different
stages of understanding or personal experience.
bullet Healthy-pillar topics must not make users feel judged for past or current interactions; framing
must be constructive.
bullet Quiz explanations must obey Part A voice rules; no first-person voice; no “I’m here for you”
phrasing.
C.8 Out of scope (v1)
bullet Live multiplayer or competitive modes.
bullet User-generated quiz content.
bullet Formal certification or graded assessments.
bullet School curriculum integration (signposting only).
bullet Public leaderboards or score sharing.
C.9 Deferred to a future iteration
The following content track is deliberately deferred and is not part of the current build. It will be
specified, scoped, and authored in a subsequent iteration of the app, once capacity exists for the
dedicated safeguarding review it requires.
Radicalisation tactics and extremist recruitment — covering all online and offline environments.
This track is not included in the v1 Awareness Hub. When it is added, it must be developed with input
from the safeguarding advisory panel, aligned with current UK Prevent guidance, and reviewed by a
Prevent-aware safeguarding lead before launch. Until then, the broader safeguarding framing of
GutChecks (recognising manipulation, coercion, isolation tactics, and grooming) covers many of the
foundational patterns; the dedicated track will provide the specific, evidence-based content that this
topic warrants. The DSIT submission should reflect that radicalisation awareness is a planned future
iteration, not a current capability.
GutChecks: Developer Specification v2.1 Page 11
Part D — Action Step Effectiveness Tracker
D.1 Overview
On a returning user’s next qualifying login, the app surfaces the action steps GutChecks
recommended in their last session and asks which (if any) the user acted on. All data captured is
anonymised and aggregated. The purpose is to evidence real-world impact for safeguarding scrutiny
and investor reporting; it is not a personalisation or profiling feature.
Scope-language note. Throughout this feature, “action steps” relate to any GutChecks-suggested
next step across all interactions, online and offline; the feature is not relationship-specific.
Legal note. The feature is designed to remain outside the scope of GDPR through anonymisation by
architecture; however a Data Protection Impact Assessment (DPIA) and qualified legal sign-off are
required before launch.
D.2 Trigger logic
ID Requirement
ET-01 On each login, check whether the user received action steps in their most recent prior session.
ET-02 The follow-up appears at most once per qualifying login cycle.
ET-03 Cooldown window is configurable (recommended 24 hours minimum, up to 72 hours).
ET-04 Dismissal records an anonymised &ldquo;skipped&rdquo; event; the prompt does not reappear until the next qualifying
ET-05 If multiple sessions with action steps occurred, only the most recent session&rsquo;s steps are surfaced.
ET-06 If the last session contained no action steps, the prompt does not appear.
D.3 Prompt UI
ID Requirement
EU-01 Card or modal overlay on home screen post-login, before any other feature.
EU-02 Friendly, tool-voiced header: &ldquo;Welcome back. Last time, GutChecks suggested some steps. How did it go?&rdq
EU-03 Each suggested step listed individually with checkbox or toggle.
EU-04 Single, multiple, or all steps may be selected.
EU-05 If no steps selected, an &ldquo;I didn&rsquo;t act on any of these&rdquo; option is shown.
EU-06 Selecting that option reveals an optional, anonymous free-text field (max 280 characters).
EU-07 Submit and Skip controls are always visible.
EU-08 On submission, a brief affirming, non-emotive message is shown (e.g. &ldquo;Thanks for the feedback. It helps GutCh
EU-09 Total flow is designed to take under 60 seconds.
D.4 Anonymised data collection
GutChecks: Developer Specification v2.1 Page 12
ID Requirement
ED-01 No PII is collected at any point: no name, email, device ID, IP, or any identifier linkable to an individual.
ED-02 Each response is tagged with a randomised, non-sequential session token with no link to the user&rsquo;s account or
ED-03 Only the topic/category of the action step is recorded; never the free-text content of the original query.
ED-04 Status fields: Acted upon / Not acted upon / Skipped.
ED-05 ED-06 Free-text &ldquo;why not&rdquo; responses are passed through automated PII scrubbing before storage; flagged resp
exact timestam
Time elapsed is stored in bucketed ranges (1&ndash;24h, 25&ndash;48h, 3&ndash;7d, 7+ days), not as ED-07 Confirmed age group is associated where present; never a precise age or date of birth.
ED-08 Topic category of the original query (e.g. workplace, online, family, romantic, public space) is recorded where determin
ED-09 The number of steps presented and the number acted upon is recorded per session.
ED-10 Data is queryable in aggregate only; no internal user can retrieve individual records.
D.5 Metrics for the internal dashboard
bullet Effectiveness: overall completion rate, full/partial/zero completion, skip rate, step-level
effectiveness by category, time-to-action distribution.
bullet Engagement: follow-up engagement rate, anonymised return-visit rate, daily/weekly response
volumes, topic engagement heatmap, age-group split, barrier-theme frequency.
bullet Outcome and impact: reported impact score, category effectiveness ranking, longitudinal
completion trend, total anonymised follow-up responses (reach).
bullet Cross-feature link: where a user has Awareness Hub progress in a related track, that link can
be surfaced anonymously in aggregate (e.g., “users who completed H-03 boundary tracks
reported a higher action-step completion rate”); never at individual level.
D.6 Privacy and GDPR design principles
bullet Data minimisation. Only what is strictly necessary is collected.
bullet Anonymisation by architecture. No join keys exist between response data and user
accounts.
bullet No individual profiling. Aggregated reporting only.
bullet PII scrubbing on ingest. Free text is scrubbed before storage; raw text is never retained.
bullet Purpose limitation. Data is used solely for effectiveness measurement and product
improvement.
bullet Retention limits. Aggregated data: 24-month rolling window (recommended). Pre-aggregation
raw records: deleted within 30 days.
bullet Transparency. A plain-English notice at the point of the prompt explains what is collected, that
it is anonymous, and how it is used.
GutChecks: Developer Specification v2.1 Page 13
Part E — Recommend & Protect
E.1 Overview
Recommend & Protect lets a user share GutChecks with up to five people across their lifetime
account. The feature is mission-led, not incentivised; the framing is one of responsibility, not reward.
The app never accesses the user’s contacts; all sharing happens through the device’s native share
sheet. No recipient PII is collected at any point.
Tagline: “You’re learning to trust your gut. Help someone else do the same.”
Scope-language note. All share message templates and prompt copy must reference the full app
name (GutChecks: Red Flags & Safety) and the all-interactions scope (work, family, online,
friendships, public spaces, romantic relationships, etc.). Templates must not imply the recipient is in a
dangerous or toxic situation.
E.2 Five-slot mechanic
ID Requirement
RP-01 Maximum of 5 recommendation slots per user account, lifetime.
RP-02 Slots displayed as cards or circles; used vs available shown at a glance.
RP-03 Used slots show a non-identifying label (e.g. &ldquo;Recommendation 1&rdquo;), the sharing method, and the sent sta
RP-04 The app must never store name, contact details, phone number, or email address of the recipient.
RP-05 Once sent, a slot is permanently used; it cannot be reassigned or reused.
RP-06 5-slot limit is enforced server-side (not client-side only) to prevent manipulation.
RP-07 Counter is always visible (e.g., &ldquo;3 of 5 recommendations sent&rdquo;).
E.3 Sharing mechanism
ID Requirement
SH-01 Sharing is executed via the device&rsquo;s native share sheet only; the app must never directly access contacts, mess
SH-02 Channels supported: WhatsApp, SMS/iMessage, Email, Copy Link, and any other app available on the device.
SH-03 Pre-written, editable message template provided for each channel.
SH-04 Message tone is warm, non-alarming, and mission-led; references everyday interactions, not just relationships.
SH-05 Each share includes a unique anonymised referral link; tracking is link-level only, not person-level.
SH-06 Each slot generates its own unique link to support per-slot status (Sent, Opened, Downloaded).
SH-07 If the share sheet is closed without completing the share, the slot is not marked as used.
SH-08 Each slot may use a different sharing method, independently.
E.4 Default share message templates (revised)
GutChecks: Developer Specification v2.1 Page 14
WhatsApp / long form: “Hey, I’ve been using an app called GutChecks: Red Flags & Safety and
thought of you. It helps you check in on your gut instinct across all kinds of everyday interactions;
work, friendships, online, family, public spaces; and helps you spot red flags before they become
problems. Worth a look. Here’s the link: [REFERRAL LINK].”
SMS / short form: “Check out GutChecks: Red Flags & Safety. It helps you spot red flags and stay
safe across everyday interactions, online and offline. Thought you’d find it useful: [LINK]”
Email subject: “Something I think you might find useful”. Body: “Hi, I’ve been using GutChecks: Red
Flags & Safety and thought of you. It helps you check in on your instincts across all kinds of everyday
interactions; not just relationships, but work, online, family, public spaces, and more. Genuinely
useful. Download it here: [LINK].”
E.5 Status tracking
bullet Each referral link generates anonymised events: opened, store page visited, app downloaded.
bullet Tracking uses a deep-link provider (e.g. Branch.io or Firebase Dynamic Links) under a Data
Processing Agreement; no recipient PII is captured.
bullet Slot status updates: Sent / Opened / Downloaded. Status badges are subtle, not
surveillance-styled.
bullet If tracking is unavailable (e.g. private browser), the slot remains at Sent; no error is shown.
bullet The user can never identify which specific recipient took which action; labels remain
non-identifying.
E.6 Trigger moments
ID Trigger Prompt
TR-01 After a query session &ldquo;Know someone who could use a gut c
TR-02 After completing a quiz level &ldquo;Great work. Help someone else learn
TR-03 User has used the app 3+ times Dismissable home banner.
TR-04 Main navigation Permanent &ldquo;Recommend &amp; Prote
TR-05 After action-step follow-up &ldquo;You&rsquo;re taking action. Help som
TR-06 Push notification (one-time, opt-in) &ldquo;GutChecks isn&rsquo;t just for you. Y
bullet No more than one prompt per session across all triggers.
bullet All in-app prompts dismissable; do not reappear in the same session after dismissal.
bullet Push trigger fires once per install, opt-in only.
bullet All sharing prompts stop appearing once 5 slots are used.
E.7 Privacy and GDPR
bullet No contact access. The app never requests access to contacts, messages, or email.
bullet No recipient PII. Identity of the recipient is never known to the app.
bullet Anonymised link tracking. Tracking is link-level; not at individual or device level in a way that
constitutes personal data.
GutChecks: Developer Specification v2.1 Page 15
bullet Sender anonymisation. Referral analytics must not expose the sender’s identity to third
parties.
bullet DPA in place with the deep-link provider; DPIA completed before launch.
bullet Transparency. A plain-English privacy note is shown on the Recommend & Protect screen.
bullet Purpose limitation. Tracking data used only for slot status display and aggregated analytics;
never for re-marketing or profiling.
GutChecks: Developer Specification v2.1 Page 16
Part F — Cross-cutting alignment and checklist
F.1 How the new features sit alongside Part A
Feature Safeguarding alignment
Voice Mode (B)Inherits all Part A voice rules. TTS reads the same text the chat displays. Hardcoded templates for categories A, B, C a
Awareness Hub (C) Quiz explanation copy obeys Part A voice rules. Sensitive tracks show a content warning. An &ldquo;I need help&rdqu
Action Step Tracker (D) Anonymised by architecture. Prompt copy is tool-voiced (no first-person). Free-text scrubbed before storage.
Recommend &amp; Protect (E) No recipient PII. Mission-led, not incentivised. Templates reference all-interactions scope; do not imply recipient is in da
F.2 Order of implementation (recommended)
Development is scheduled to begin immediately. The DSIT submission and KCSIE mapping will be
finalised on feature completion (target end of week). The phasing below is the order in which features
should be built, tested, and signed off; it is not a long-running roadmap.
bullet Phase 1 (foundational, must be in place before any new feature ships): complete Part A in
full. This is non-negotiable; it is what makes GutChecks structurally distinct from companion-AI
products and is the precondition for the DSIT submission.
bullet Phase 2: Action Step Effectiveness Tracker (Part D). Lowest UI complexity, highest evidence
value for DSIT and investors.
bullet Phase 3: Awareness Hub MVP (Part C) covering H-01, T-06, T-07, H-02, H-03, plus a small
selection of additional age-appropriate tracks chosen with the safeguarding advisory panel. The
radicalisation track (deferred per Section C.9) is explicitly excluded from this phase.
bullet Phase 4: Recommend & Protect (Part E) once anonymised tracking architecture is fully tested.
bullet Phase 5: Voice Mode (Part B). Voice introduces the most safeguarding risk; ship it last and
only after categories A/B/C templates have been verified in production text mode and after
every safeguarding measure in Section B.2 is confirmed in place.
F.3 Consolidated implementation checklist
Item Phase
■ Replace &ldquo;Your relationship companion&rdquo; subtitle (Part A) 1
■ Implement short and long disclaimers (Part A 3.2) 1
■ Build input classifier with categories A, B, C, D (Part A 6) 1
■ Implement hardcoded templates 7.1, 7.2, 7.3 (Part A) 1
■ Load standard-path system prompt for category D (Part A 8) 1
■ Build output filter (Part A 9) 1
■ Implement session-level checks (Part A 10) 1
GutChecks: Developer Specification v2.1 Page 17
■ Implement anonymised audit logging for A/B/C events 1
■ Verify privacy claim in disclaimer matches data architecture 1
■ Update Privacy Policy for safeguarding logging with consent framing 1
■ Advisory panel review of hardcoded templates 1
■ Update product copy globally to reference all-interactions scope 1
■ Build follow-up trigger logic (Part D) 2
■ Build follow-up prompt UI (Part D 3.2) 2
■ Implement anonymisation-by-architecture, PII scrubber, retention rules (Part D) 2
■ DPIA and legal sign-off for Part D 2
■ Build internal analytics dashboard with role-restricted access (Part D 5) 2
■ Build Awareness Hub dashboard, both pillars, age confirmation (Part C) 3
■ Author MVP track content (excluding deferred radicalisation track) with safeguarding-panel review (Part C) 3
■ Implement progress tracking, streaks, daily challenge (Part C) 3
■ Implement &ldquo;I need help&rdquo; button accessible from anywhere in Hub 3
■ Build Recommend &amp; Protect 5-slot UI and server-side enforcement (Part E) 4
■ Integrate deep-link provider under DPA; per-slot link generation 4
■ Implement anonymised link analytics; verify no recipient PII captured 4
■ DPIA and legal sign-off for Part E 4
■ Implement Voice Mode STT/TTS with Part A voice-rule inheritance (Part B) 5
■ <b>Voice safety:</b> curated TTS voice list; no character/persona/breathy/child-like voices; founder sign-off on voice list 5
■ <b>Voice safety:</b> auto read-back off by default; under-18 enable requires confirmation step 5
■ <b>Voice safety:</b> A/B/C templates read aloud as-is; LLM never invoked for these (architectural enforcement) 5
■ <b>Voice safety:</b> voice input disabled for remainder of any A/B/C-triggered session 5
■ <b>Voice safety:</b> read-back stops on background, phone call, or microphone re-activation 5
■ <b>Voice safety:</b> 15-minute continuous-use step-away prompt 5
■ <b>Voice safety:</b> no raw audio storage; STT provider DPA confirms transient handling only5
■ <b>Voice safety:</b> visible transcript before submission; remains in chat history afterwards 5
■ <b>Voice safety:</b> microphone permission revocation does not crash app or degrade text mode 5
■ Run 50-prompt safeguarding test pass against full v2.1 system before launch All
■ Finalise DSIT submission and KCSIE mapping document on feature completion All
F.4 Closing note
GutChecks: Developer Specification v2.1 Page 18
The four new features extend GutChecks from a query-response tool into a structured,
evidence-generating safeguarding product. Each one is designed to inherit, rather than compete with,
the safeguarding architecture in Part A. The phased order above is deliberate: it lets DSIT see a
foundational safety layer in place first, then layered evidence of real-world impact (Part D),
educational reach (Part C), word-of-mouth growth (Part E), and accessibility (Part B). The
radicalisation track is a deliberate deferral, not an omission; it will be added in a subsequent iteration
once capacity exists for the dedicated Prevent-aware review it requires. The DSIT submission and
KCSIE mapping document will be finalised on completion of the v2.1 build, with the deferred track
flagged as a planned future capability.
GutChecks: Developer Specification v2.1 Page 19