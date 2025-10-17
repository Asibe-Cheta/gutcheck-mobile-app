# Quick Start Guide: Training Your AI Therapist

**Goal**: Continuously improve GutCheck's AI to give better, more direct, and more helpful relationship advice.

---

## 🚀 How to Add New Training Materials (5 Minutes)

### Step 1: Find a Good Conversation
Sources:
- X/Twitter: @AgbaJohnDoe or similar relationship therapists
- Reddit: r/relationship_advice top comments
- Instagram: Direct relationship coaches
- YouTube: No-BS therapists

### Step 2: Copy the Template
```bash
Copy: training-materials/conversations/template.md
Rename to: CHAT_2.md (or next number)
```

### Step 3: Fill It Out
1. **Source**: Where you found it
2. **Summary**: What it's about (2 sentences)
3. **Conversation**: Copy the full exchange
4. **Key Phrases**: What lines were especially good
5. **Pattern Analysis**: What relationship pattern was addressed

### Step 4: Share It
- Send me the file
- I'll analyze it and update AI prompts
- You'll see improvements in the next update

**That's it!** 5 minutes per conversation = better AI

---

## 📊 How to Give Feedback on App Responses

### When Testing the App:

**If AI Response is Good ✅:**
1. Copy the conversation
2. Paste into `feedback/user-conversations.md`
3. Mark rating: ✅ Good
4. Note: "This pattern worked well"

**If AI Response Needs Work ⚠️:**
1. Copy the conversation
2. Paste into `feedback/user-conversations.md`
3. Mark rating: ⚠️ Needs Work
4. Note: "Too soft" or "Missed the pattern" or "Too many questions"
5. Write how it SHOULD have responded

**Quick Rating:**
Just add emojis next to each response as you test:
- 🟢 Perfect
- 🟡 Good but could improve
- 🟠 Needs significant work
- 🔴 Wrong approach

---

## 📁 File Structure (Where Things Go)

```
training-materials/
├── conversations/          ← New chat examples go here
│   ├── template.md        ← Copy this for each new conversation
│   ├── CHAT_1.md          ← Agba John Doe (already added)
│   └── CHAT_2.md          ← Your next find
│
├── patterns/              ← Document relationship patterns
│   ├── manipulation-patterns.md  ← Already filled out
│   └── [add more as you identify patterns]
│
├── response-styles/       ← Examples of good/bad responses
│   ├── good-responses.md  ← Already filled out
│   └── bad-responses.md   ← Add examples of what NOT to do
│
└── feedback/              ← Track app performance
    └── user-conversations.md  ← Your app testing notes
```

---

## 🎯 Priority: What to Collect First

### High Priority (Do These First):
1. ✅ **Manipulation Patterns**
   - Gaslighting examples
   - Guilt-tripping examples
   - Financial manipulation

2. ✅ **Boundary Setting**
   - How to say no
   - How to create distance
   - Scripts for difficult conversations

3. ✅ **Direct Call-Outs**
   - "That's manipulation"
   - "You're being used"
   - "That's gaslighting"

### Medium Priority:
4. **One-Sided Relationships**
   - ATM syndrome
   - Emotional dumping
   - Lack of reciprocity

5. **Reality Checks**
   - Questions that make people think
   - Challenging rationalizations
   - Pointing out patterns

### Nice to Have:
6. **Crisis Situations**
   - Grooming
   - Abuse
   - Safety concerns

7. **Healthy Relationships**
   - What good actually looks like
   - Green flags
   - Reciprocity examples

---

## 💡 What Makes a GOOD Training Example?

### ✅ Include Examples With:
- Multiple back-and-forth exchanges (not just one Q&A)
- Therapist names the pattern directly
- Concrete, actionable advice with timelines
- Handles user resistance/rationalization
- Shows evolving understanding
- Direct, no-BS language
- Reality-check questions

### ❌ Skip Examples With:
- Single Q&A (too shallow)
- Overly clinical language
- Vague advice ("communicate better")
- Too gentle/therapy-speak
- No concrete actions
- Just emotional validation without direction

---

## 🔄 The Feedback Loop

```
1. Find conversation → 2. Add to training-materials/ 
                              ↓
                    3. Share with AI developer (me)
                              ↓
                    4. I update prompts in src/lib/ai.ts
                              ↓
                    5. You test updated AI
                              ↓
                    6. You give feedback in feedback/
                              ↓
                    7. Repeat!
```

**Goal**: Each cycle improves the AI's:
- Pattern recognition
- Direct communication
- Actionable advice
- Tone matching

---

## 📝 Quick Templates

### For Adding a New Conversation:
```markdown
# [Title]
**Source**: [Twitter/Reddit/etc]
**Date**: [Today's date]
**Topic**: [One sentence]

## Conversation
User: [message]
Therapist: [response]
[continue...]

## Key Takeaways
- [What was great about this]
- [Pattern that was identified]
- [Advice that was given]
```

### For App Feedback:
```markdown
**Rating**: 🟢/🟡/🟠/🔴
**User**: "[what you said]"
**AI**: "[what it responded]"
**Issue**: [Too soft / Missed pattern / Too many questions]
**Should be**: "[better response]"
```

---

## 🎓 Learning Resources

### Where to Find Training Materials:

**X/Twitter:**
- @AgbaJohnDoe
- Search: "relationship advice thread"
- Search: "toxic relationship signs"

**Reddit:**
- r/relationship_advice (sort by top)
- r/relationships (controversial posts often have best advice)
- r/AmItheAsshole (clear pattern examples)

**Instagram:**
- Relationship coaches
- Boundary-setting content
- Direct advice (not just inspirational quotes)

**YouTube:**
- "Relationship Red Flags"
- "How to Set Boundaries"
- Therapists who give direct advice

**Books/Articles:**
- "Why Does He Do That?" - Lundy Bancroft
- "The Gift of Fear" - Gavin de Becker
- "Boundaries" - Cloud & Townsend
- Psychology Today relationship columns

---

## ✅ Your First 3 Actions

**Do these right now** (10 minutes total):

1. **[ ] Find ONE good conversation**
   - Go to X/Twitter or Reddit
   - Find a relationship advice thread
   - Look for direct, no-BS advice

2. **[ ] Fill out the template**
   - Copy `conversations/template.md`
   - Rename to `CHAT_2.md`
   - Fill in the conversation

3. **[ ] Test the current app**
   - Have a conversation with GutCheck
   - Copy it to `feedback/user-conversations.md`
   - Note what worked and what didn't

**Then share with me!** I'll analyze and update the AI.

---

## 📞 Questions?

**Common Questions:**

**Q: How many conversations should I collect?**
A: Start with 5-10 good examples. Quality > quantity.

**Q: What if I disagree with a therapist's advice?**
A: Note what you disagree with. We'll discuss and decide together.

**Q: How long until I see improvements?**
A: After each batch of training materials, I'll update prompts. You'll see changes immediately after restart.

**Q: What if the AI gives a bad response?**
A: Perfect! Document it in `feedback/` with what it SHOULD have said. That's valuable training data.

**Q: Can I contribute patterns I notice myself?**
A: YES! Add them to `patterns/` folder. Your real-world observations are incredibly valuable.

---

## 🎯 Success Metrics

**How to know it's working:**

After training updates, the AI should:
- ✅ Name patterns directly ("That's guilt-tripping")
- ✅ Ask fewer questions, give more analysis
- ✅ Provide concrete actions with timelines
- ✅ Challenge rationalizations effectively
- ✅ Sound like a wise friend, not a therapist
- ✅ Give severity ratings (X out of 10)
- ✅ Request follow-up ("Get back to me with...")

**If you see these improvements**, the training is working! 🎉

---

Ready to start? Go find your first conversation! 🚀

