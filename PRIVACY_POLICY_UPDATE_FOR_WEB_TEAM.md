# Privacy Policy Update – Required for App Store (Apple) Compliance

**To: Web team**  
**Re: Updates needed on https://mygutcheck.org/privacy**  
**Priority: High** – required for GutCheck iOS app approval (Guidelines 5.1.1(i) & 5.1.2(i))

---

## Why this is needed

Apple rejected our app update because the app shares user data (conversation content and images) with a third-party AI service. They require that our **privacy policy** clearly states:

1. **What data** the app collects  
2. **How** it collects that data  
3. **All uses** of that data  
4. **That we share data with a third-party AI provider**, and that this provider offers the same or equivalent protection

We have already added **in-app disclosure and consent** (users must tap “Accept” before any message is sent to the AI). The remaining requirement is that the **public privacy policy on the website** matches this and explicitly covers the AI provider.

---

## Required updates to the privacy policy

Please ensure the privacy policy at **https://mygutcheck.org/privacy** includes the following (you can adapt the wording to fit your existing style):

### 1. Data we collect

- Clearly state that we collect **conversation content** (messages users type) and **images/documents** they optionally attach when using the chat or guidance features.

### 2. How we collect it

- State that this data is collected **when the user sends messages or attaches images** in the app (e.g. in the chat or when starting a conversation from the home screen or from a notification).

### 3. How we use the data and who we share it with

- State that **conversation content and attached images are sent to Anthropic (Claude)**, a third-party AI service, **only to generate guidance and responses** for the user.
- State that we **do not use this content to train AI models** (Anthropic’s enterprise/API terms support this).
- State that this use is **disclosed in the app** and that we **obtain the user’s consent** before sending their data to the AI provider.

### 4. Third-party protection

- State that **Anthropic (Claude)** processes this data to provide the service, and that their handling of data is governed by their privacy policy and terms (you may link to Anthropic’s privacy policy: https://www.anthropic.com/privacy or current URL).

### 5. Safeguarding logs and consent framing

- Add a short section explaining that safeguarding logs are **metadata-only** (e.g., category, timestamp, message length, and hashed fingerprint) and do **not** store full message text.
- Clarify that this safeguarding metadata is used only for safety monitoring, quality assurance, and compliance evidence.
- State that user consent to third-party AI processing is requested in-app before content is sent to Anthropic.

### 6. Recommend & Protect purpose limitation

- Explain that referral tracking in Recommend & Protect is **slot-level only** (sent/opened/downloaded), anonymised, and non-identifying.
- State that this tracking is used only for slot status display and aggregate feature analytics.
- Explicitly state it is **never used for re-marketing or profiling**.

---

## Suggested paragraph (copy/adapt as needed)

You can use or adapt this block in the privacy policy:

```
When you use GutCheck’s chat or guidance features, we collect the messages you send and any images or documents you attach. This data is used to provide you with personalised guidance. To do this, we send your conversation content and any attached images to Anthropic (Claude), a third-party AI service, solely to generate responses for you. We do not use your content to train AI models. We ask for your consent in the app before any of your data is sent to this provider. Anthropic’s handling of data is described in their privacy policy (https://www.anthropic.com/privacy). For full details of what we collect, how we use it, and how we protect it, see the rest of this policy.
```

---

## Checklist for web team

- [ ] Add or update a section that describes **conversation and image data** we collect.
- [ ] Explain **when** we collect it (e.g. when user sends messages or attaches images).
- [ ] Clearly name **Anthropic (Claude)** as the third-party AI provider we share this data with and state it is **only for generating responses** (not for training models).
- [ ] Mention that we **obtain consent in the app** before sending data to the AI provider.
- [ ] Include a statement or link that **Anthropic** provides equivalent/sufficient data protection (e.g. link to their privacy policy).
- [ ] Add safeguarding logging language: metadata-only safety logs, no full message text retention in safeguards logs.
- [ ] Add Recommend & Protect purpose limits: slot-level anonymised tracking only; never used for re-marketing or profiling.

Once these updates are live on https://mygutcheck.org/privacy, the app’s in-app disclosure and consent flow will be fully aligned with our public policy and Apple’s requirements.

Thanks,  
[Your name / Mobile team]
