GutChecks Response Pipeline — Logic
Specification
Purpose: This document defines the response-generation logic required to bring the
GutChecks AI output back in line with the standards described in the DSIT consultation
response, the KCSIE/RSHE Statutory Mapping document, and the DPIA/Children's Code
Conformance Statement. It is written for direct handoff to a developer.
Context for the change: The current implementation sends the user's free-text query to the
underlying model (now Gemini) and renders the returned text with no pre-classification, no crisis
interrupt, and no enforced output structure. This produces three faults visible in the attached
screenshots: a suicide-ideation query received the same generic "REALITY CHECK / come
back and tell us how it went" treatment as a low-stakes query; trusted-adult escalation is buried
mid-paragraph instead of leading; and output is unstructured prose with embedded run-on lists
rather than clearly separated sections.
The fix is architectural, not a prompt tweak: GutChecks must remain a pattern-recognition
education tool, not a conversational chatbot. That means the model should never be the sole
decision-maker on whether a response is safe to show. A deterministic classification and routing
layer sits in front of the model and overrides its output when certain conditions are met.
1. Pipeline overview
Every user query passes through four stages, in order. No stage is skippable.
User input
│
▼
[STAGE 1] Risk Classifier ──► CRISIS ──► Stage 2 (Crisis Response) ──► STOP (skip
Stage 3/4)
│
▼ (NOT crisis)[STAGE 2] Skipped
│
▼
[STAGE 3] Pattern-Recognition Response Generator (model call, constrained)
│
▼
[STAGE 4] Output Formatter / Schema Validator
│
▼
Rendered response
2. Stage 1 — Risk Classifier (runs before any model call)
This must be a separate, cheap, deterministic-first check, not something delegated to the
same general-purpose call that drafts the answer. Two layers:
2.1 Layer A — keyword/phrase trigger list (instant, no API call)
Maintain a maintained, versioned list of high-risk phrases and run a match against every
incoming message before anything else happens. Examples of categories to include (work with
your clinical advisory panel to finalise the list and keep it under regular review):
-
-
-
-
-
Direct statements of suicidal ideation ("I don't want to live"
,
"I want to die"
,
"end it all"
,
reason to carry on")
Statements of intent or plan ("I have a plan"
,
"I've written a note"
, specific method
references)
Active self-harm disclosure ("I've been cutting"
,
"I hurt myself last night")
Disclosure of immediate physical danger from another person ("he's outside my door
now"
,
"I'm scared he'll hurt me tonight")
Disclosure of ongoing abuse requiring statutory safeguarding response
"no
If Layer A matches with high confidence, skip Layer B and go straight to Stage 2.2.2 Layer B — model-assisted classification (only if Layer A is inconclusive)
For ambiguous input, make a separate, narrow classification call (not the
response-generating call) that returns a structured verdict only:
{
"risk
_
level": "crisis | elevated
_
concern | standard"
,
"categories": ["suicidal
ideation"
,
_
"self
harm"
,
_
"immediate
"confidence": 0.0–1.0
_
danger"
,
"none"],
}
System prompt for this call should instruct the model to do nothing except classify — it must not
draft any user-facing text. This keeps the safety decision deterministic and auditable, separate
from the model's general response generation, which is the part you don't fully control once
you're on a different backend.
Threshold rule: if risk_level ==
"crisis" OR (risk_level ==
"elevated_concern" AND confidence >= 0.6), route to Stage 2.
3. Stage 2 — Crisis Response (overrides everything else)
When triggered, the app must not ask the model to generate the response body. Use a
pre-written, clinically-approved, static template. This is non-negotiable for safeguarding
compliance — a live LLM call is the one thing you do not want in the critical path when someone
has disclosed suicidal ideation.
3.1 Required structure (fixed copy, region-aware helpline insertion only)
[ACKNOWLEDGEMENT — fixed, warm, non-clinical]
"What you've just shared matters, and it's important you don't sit with this alone.
"
[IMMEDIATE ACTION — single, unmissable, tappable]
┌─────────────────────────────────────────┐│ 📞 Call Samaritans now — 116 123 │ <- tel: link, free, 24/7
│ (or Childline 0800 1111 if user is │
│ registered as under 19) │
└─────────────────────────────────────────┘
[SECONDARY ACTION]
"You can also text SHOUT to 85258 for free, 24/7 confidential support.
"
[GROUNDING LINE — fixed]
"If you are in immediate danger, please call 999 now.
"
[GUTCHECKS BOUNDARY — fixed, every time]
"GutChecks is a guidance tool, not a counsellor, therapist, or crisis service. The people on the
lines above are trained to help with exactly what you're going through.
"
3.2 Implementation requirements
-
Resource links must be tel: and sms: deep links, not plain text. One tap to call/text.
-
Region detection: resolve the user's region (device locale / app settings) and serve the
correct helpline set. UK default: Samaritans 116 123, Childline 0800 1111 (under 19),
SHOUT text 85258. Do not hardcode a single country's numbers globally — your
DPIA/Children's Code documentation already commits to region-specific helplines, and
Image 6 shows the current build only references them as generic prose, not as resolved,
clickable numbers.
-
No "come back and tell us how it went" follow-up prompt on a crisis response.
That framing is appropriate for a behavioural/skills exercise (e.g. the secret-keeping
example) but is inappropriate and potentially harmful immediately after a suicide
disclosure — it implies the conversation is a task to complete rather than treating the
disclosure with full seriousness.
-
Log the event (risk
_
level, timestamp, anonymised session ID — no message content
retained beyond what your DPIA permits) so safeguarding leads can review pattern
frequency, without storing identifying free text.
-
This stage must render before any other text, and nothing else from Stage 3 should be
appended afterward in the same response.4. Stage 3 — Pattern-Recognition Response Generator (standard
queries only)
This is the only stage that calls the general-purpose model, and only after Stage 1 has cleared
the query as non-crisis.
4.1 Constrain the model with a fixed output schema, not free text
Replace the current open-ended prompt with a system prompt that forces a strict JSON or
tagged-section output, which your front end then renders into the fixed visual layout below.
Forcing structure is what eliminates the assumption-heavy, run-on prose seen in Images 1–3.
{
"validation": "1-2 sentences acknowledging the situation factually, no speculation about the
user's emotional state unless they stated it"
,
"red
_
flags": ["short phrase"
,
"short phrase"
,
"short phrase"],
"why_
it
matters": "1-2 sentences, factual, no invented scenarios"
,
_
"recommended
_
actions": [
{"action": "Talk to a trusted adult (parent, teacher, school counsellor, or another adult you
trust)"
,
"priority": "primary"},
{"action": "
"
...
,
"priority": "secondary"},
{"action": "
"
...
,
"priority": "secondary"}
],
"reality_
check": "1 sentence, factual, no false reassurance"
}
4.2 System prompt rules to enforce (copy directly into your model
configuration)
You are a pattern-recognition assistant for GutChecks, a safeguarding education
tool. You are not a counsellor, friend, or chatbot. Follow these rules strictly:1. Output ONLY the JSON structure provided. No additional commentary.
2.
"validation" must describe the situation factually. Do not invent reasons,
motives, or backstory the user did not state. Do not use speculative
language ("they might be...
"
,
"this could mean...
") more than once per
3.
4.
response.
"red
_
flags" must be short, scannable phrases (max 8 words each), not full
paragraphs. Maximum 4 items.
"recommended
actions" MUST include "Talk to a trusted adult" as the FIRST
_
item with priority "primary" in every response, unless the user has
already stated they have done this in the current query — in which case
it should be replaced with a "primary" follow-up such as confirming what
was shared and what response they got.
5. Do not tell the user to "come back and let GutChecks know how it went.
"
GutChecks is an education tool; it does not maintain an ongoing
relationship with the user across sessions and should not imply this.
6. Use plain, age-appropriate language. No jargon.
7. Never present uncertainty as fact. If a scenario has multiple possible
explanations, say so once, briefly — do not enumerate every possibility
as if confirmed.
4.3 Why this fixes the "assumptions" problem
The screenshots show the model inventing multiple speculative scenarios ("they've done
something minor but embarrassing... they've done something harmful or illegal... they're testingyour loyalty") and presenting all of them with equal narrative weight, several sentences each.
That's a writing-style problem caused by an unconstrained prompt, not something inherent to
switching providers. Capping red_flags to short phrases and requiring single-sentence
framing for ambiguity removes the room for the model to free-associate.
5. Stage 4 — Output Formatter (rendering layer, not the model's
job)
The front end — not the model — owns visual structure. Build a fixed render template that
consumes the Stage 3 JSON:
[VALIDATION — plain text, 1-2 lines]
🚩 RED FLAGS
• flag 1
• flag 2
• flag 3
WHY THIS MATTERS
[why_
it
_
matters text]
✅ WHAT TO DO
┌──────────────────────────────────────────┐
│ 1. Talk to a trusted adult │ ← visually distinct: bold,
│ (parent, teacher, counsellor, or │ larger, different
│ another adult you trust) │ background colour/border
└──────────────────────────────────────────┘
2. [secondary action]
3. [secondary action]REALITY CHECK
[reality_
check text]
5.1 Required visual rules
-
The "talk to a trusted adult" action is rendered in a visually distinct card (border,
background tint, or bold weight) so it cannot be mistaken for an equally-weighted list item
— this directly answers your requirement that it "should be the first proposal and
highlighted to stand out.
"
-
Bullets, never run-on paragraph lists. The screenshots show red flags and action steps
written as paragraph sentences separated only by line breaks — this should never reach
render; it's a sign the model output wasn't passed through a schema at all.
-
Maximum line length per bullet should be enforced at the prompt level (Section 4.2, rule
3) so mobile rendering stays scannable.
6. Summary table — what's missing today vs. what this adds
Requirement (from DSIT /
KCSIE / DPIA
commitments)
Current build (screenshots) This spec
Crisis disclosures
acknowledged with
appropriate seriousness
Treated identically to a
low-stakes query
Hard interrupt at Stage 1/2,
bypasses general model
output entirely
Clickable, region-specific
real-life support resources
Mentioned in prose only, not
actionable
tel:/sms: deep links,
region-resolved
Trusted adult as first,
highlighted recommendation
Buried as 4th bullet
mid-paragraph
Enforced as mandatory first
item, visually distinct card
Pattern-recognition tool, not a
chatbot
"Come back and let
GutChecks know how it went"
implies ongoing dialogue
Removed from standard
responses; never used after
crisis disclosure
Structured, scannable output Long unbroken paragraphs Enforced JSON schema +
fixed render templateRequirement (from DSIT /
KCSIE / DPIA
commitments)
Current build (screenshots) This spec
Minimal unsupported
speculation
Multiple invented scenarios
presented as equally likely
Prompt rule capping
speculative framing to one
instance per response
7. Recommended rollout order for the developer
1. Build the Stage 1 keyword list with the advisory panel and implement Layer A first — this
is the single highest-priority fix and requires no model changes.
2. Wire the static Stage 2 crisis template with region-resolved helpline deep links.
3. Add Layer B model classification call once Layer A is live and tested.
4. Rebuild the Stage 3 prompt to the JSON schema above and stop rendering raw model
text.
5. Build the Stage 4 fixed render template, including the highlighted trusted-adult card.
6. Regression-test against the exact queries in the attached screenshots ("someone asked
me to keep a secret about something they done" and "I don't feel like I want to live  anymore") before sign-off.