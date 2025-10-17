# GutCheck Mobile App - Complete Technical Specification

## Executive Summary
GutCheck is an AI-powered emotional intelligence platform designed to help young adults (16-25) analyze personal interactions and identify manipulation, toxic behaviors, and relationship red flags. This specification covers the complete mobile application for iOS and Android platforms.

**App Name:** GutCheck  
**Tagline:** Visualize your intuition  
**Domain:** mygutcheck.org  
**Target Platforms:** iOS (App Store), Android (Google Play)  
**Pricing:** Freemium model - Free (3 analyses/month), Premium (£9.47/month)

---

## Core Mission & Philosophy

### Problem Statement
Young adults navigate complex social landscapes without tools to identify manipulation and harm. The gap between intuition ("something feels off") and actionable understanding leaves them vulnerable to gaslighting, grooming, coercion, and other toxic behaviors.

### Solution
GutCheck bridges the intuition gap by providing:
- Situation-specific AI analysis trained on manipulation patterns
- Evidence-based confidence scoring and risk assessment
- Pattern tracking across relationship history
- Actionable response strategies with conversation scripts
- Complete anonymity and privacy protection

### Key Differentiator
**GutCheck vs. Generic AI (ChatGPT/Claude):**
- Specialized forensic analysis vs. general conversation
- Persistent memory of relationship patterns vs. fresh conversations
- Evidence-based scoring vs. opinions
- Crisis intervention protocols vs. no safety net
- Cultural context awareness vs. one-size-fits-all advice

---

## Technology Stack

### Frontend Framework
- **React Native** with Expo (for cross-platform development)
- **TypeScript** for type safety
- **React Navigation** for routing
- **React Native Paper** or **NativeBase** for UI components
- **Reanimated 2** for advanced animations
- **React Native Gesture Handler** for touch interactions

### State Management
- **Zustand** or **Redux Toolkit** for global state
- **React Query** for server state management
- **AsyncStorage** for local persistence

### Backend Services
- **Supabase** for:
  - PostgreSQL database
  - Authentication (OAuth, anonymous options)
  - Real-time subscriptions
  - Row-level security
- **Vercel/Next.js API routes** for custom endpoints

### AI Integration
- **OpenAI GPT-4** or **Anthropic Claude API** for analysis
- Custom prompt engineering for manipulation detection
- Fallback AI providers for redundancy

### Payment Processing
- **Stripe** for subscriptions (UK-focused)
- **RevenueCat** for subscription management across platforms

### Analytics & Monitoring
- **PostHog** for privacy-friendly analytics
- **Sentry** for error tracking
- **Firebase Crashlytics** for crash reporting

### Additional Libraries
```json
{
  "dependencies": {
    "react-native": "latest",
    "expo": "latest",
    "@react-navigation/native": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "@react-navigation/native-stack": "^6.x",
    "@supabase/supabase-js": "^2.x",
    "zustand": "^4.x",
    "@tanstack/react-query": "^5.x",
    "react-native-reanimated": "^3.x",
    "react-native-gesture-handler": "^2.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "date-fns": "^3.x",
    "react-native-svg": "^14.x",
    "react-native-chart-kit": "^6.x"
  }
}
```

---

## Design System

### Color Palette
```
Primary Dark: #1a1d29
Secondary Dark: #2d3748
Accent Teal: #4fd1c7
Accent Green: #38a169
Text Primary: #f7fafc
Text Secondary: #a0aec0
Warning Coral: #ff7a7a
Success Green: #68d391
Glass Background: rgba(255, 255, 255, 0.05)
Glass Border: rgba(255, 255, 255, 0.1)
```

### Typography
- **Font Family:** Inter (system fallback: San Francisco on iOS, Roboto on Android)
- **Heading 1:** 32px, weight 800
- **Heading 2:** 28px, weight 700
- **Heading 3:** 24px, weight 700
- **Body Large:** 18px, weight 500
- **Body:** 16px, weight 400
- **Caption:** 14px, weight 400

### Spacing Scale
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

### Border Radius
```
sm: 8px
md: 16px
lg: 24px
xl: 32px
full: 9999px
```

---

## Application Architecture

### Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── index.tsx (Home)
│   │   ├── history.tsx
│   │   ├── resources.tsx
│   │   └── settings.tsx
│   └── _layout.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── analysis/
│   │   ├── AnalysisInput.tsx
│   │   ├── ResultsCard.tsx
│   │   ├── ConfidenceScore.tsx
│   │   └── PatternTag.tsx
│   └── shared/
│       ├── Header.tsx
│       ├── LoadingState.tsx
│       └── EmptyState.tsx
├── features/
│   ├── analysis/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── auth/
│   ├── relationships/
│   └── subscription/
├── lib/
│   ├── supabase.ts
│   ├── ai-service.ts
│   ├── utils.ts
│   └── constants.ts
├── store/
│   ├── authStore.ts
│   ├── analysisStore.ts
│   └── settingsStore.ts
└── types/
    └── index.ts
```

---

## Core Features & User Flows

### 1. Authentication & Onboarding

#### Registration Options
1. **Google OAuth**
   - One-tap sign-in
   - Privacy note: "We only verify you're human, no personal data accessed"
   - No profile data collection

2. **Anonymous Email**
   - Accepts disposable emails (10minutemail, etc.)
   - No email verification required for basic features
   - Optional verification for account recovery

3. **Username Only**
   - Maximum privacy option
   - Username + password
   - Security questions for recovery

#### Onboarding Flow
**Screen 1: Welcome**
- "Welcome to GutCheck!"
- Tagline and brief value proposition
- Swipeable introduction (3 screens max)
- "Continue" button

**Screen 2: Privacy Assurance**
- "Your privacy is our priority"
- Bullet points: 100% anonymous, encrypted, no data sharing
- "I understand" button

**Screen 3: Optional Setup**
- "What should we call you?" (nickname input)
- "Select your age range" (16-18, 19-21, 22-25, 25+)
- "Skip" option always visible
- "Get Started" button

**Post-Registration:**
- Immediate access to analysis feature
- No forced tutorial (contextual help instead)
- Dismissible setup prompts appear over time

### 2. Main Analysis Feature (Core Functionality)

#### Home Screen Layout
```
┌─────────────────────────────┐
│ GutCheck        ⚙️          │
├─────────────────────────────┤
│                             │
│  How can I help you today,  │
│  [Nickname]?                │
│                             │
│  ┌───────────────────────┐  │
│  │ Describe what         │  │
│  │ happened or how       │  │
│  │ someone made you      │  │
│  │ feel...               │  │
│  │                       │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  Quick Prompts:             │
│  [Someone made me guilty]   │
│  [Confusing conversation]   │
│  [New person in my life]    │
│                             │
│  [ Get Clarity ]            │
│                             │
├─────────────────────────────┤
│ 🏠 Home  🕐 History  📚 ...  │
└─────────────────────────────┘
```

#### Analysis Input Flow
1. **User describes situation** (free text input)
2. **Progressive disclosure prompts**
   - "Who is this person to you?" (relationship type)
   - "How long have you known them?"
   - "Has this happened before?"
   - "How did you feel during/after?"
3. **Processing screen**
   - Animated loading indicator
   - "Analyzing patterns..." message
   - Estimated time (15-30 seconds)

#### Results Display
```
┌─────────────────────────────┐
│ ← Analysis Results          │
├─────────────────────────────┤
│ RISK LEVEL    85% Confidence│
│ ████████████░░░░░░░░░░░     │
│ High risk of manipulation   │
│ detected.                   │
│                             │
│ Pattern Identification      │
│ ┌───────────────────────┐   │
│ │ 🔴 Gaslighting        │   │
│ │ Making you question   │   │
│ │ your reality          │   │
│ │ [Learn More]          │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ 🟡 Love Bombing       │   │
│ │ Overwhelming affection│   │
│ │ early on              │   │
│ └───────────────────────┘   │
│                             │
│ Key Insights                │
│ This interaction shows...   │
│                             │
│ What You Can Do             │
│ • Set Boundaries            │
│ • Reflect on the Interaction│
│ • Document This Incident    │
│                             │
│ [Bookmark] [Share] [Export] │
└─────────────────────────────┘
```

#### Analysis Components
1. **Risk Level Bar**
   - Color-coded: Green (low), Yellow (medium), Red (high)
   - Confidence percentage
   - Brief explanation text

2. **Pattern Cards**
   - Pattern name with icon
   - Brief description
   - Expandable "Learn More" section
   - Educational content about the tactic

3. **Key Insights**
   - Plain language explanation
   - Connection to psychological research
   - Context-specific interpretation

4. **Action Recommendations**
   - Graduated response options
   - Conversation script templates
   - Boundary-setting language
   - When to seek professional help

5. **Evidence Documentation**
   - "Add to evidence file" button
   - Timestamp and situation summary
   - Export as PDF for counselors/authorities

### 3. Pattern Tracking & Relationship Mapping

#### History Screen
```
┌─────────────────────────────┐
│ ← History                   │
├─────────────────────────────┤
│ Timeline                    │
│                             │
│ ⚠️ Conversation with Alex   │
│    High Risk - 2d ago       │
│                             │
│ 📈 Interaction with Jordan  │
│    Medium Risk - 5d ago     │
│                             │
│ ✅ Exchange with Taylor     │
│    Low Risk - 1w ago        │
│                             │
│ Pattern Tracking            │
│ ┌───────────────────────┐   │
│ │ Relationship Health   │   │
│ │ Last 3 Months    75%  │   │
│ │                       │   │
│ │ [Graph visualization] │   │
│ └───────────────────────┘   │
│                             │
│ Quick Stats                 │
│ • Analyses This Month: 8    │
│ • Patterns Identified: 12   │
│ • Confidence Level: 80%     │
└─────────────────────────────┘
```

#### Relationship Mapping (Premium Feature)
- Visual network graph using D3/Victory Native
- Contact nodes color-coded by risk level
- Connection strength indicated by line thickness
- Interactive: tap node for details
- Timeline slider to see evolution
- Power dynamic indicators

**Data Structure:**
```typescript
interface Contact {
  id: string;
  name: string;
  relationshipType: 'romantic' | 'family' | 'friend' | 'colleague' | 'other';
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  incidentCount: number;
  firstSeen: Date;
  lastInteraction: Date;
  patterns: Pattern[];
}

interface Pattern {
  type: 'gaslighting' | 'love-bombing' | 'isolation' | 'coercion' | 'negging';
  confidence: number;
  firstDetected: Date;
  occurrences: number;
}
```

### 4. Proactive Safety Features

#### Daily Check-Ins (Push Notifications)
**Morning (9 AM):**
- "Good morning! How are your relationships feeling today?"
- "Remember: Your instincts matter. Trust that gut feeling."

**Evening (7 PM):**
- "Did anyone make you feel uncomfortable today?"
- "Take a moment to reflect on your interactions."

**Educational Notifications (Random times):**
- "Red flag: Someone who gets angry when you spend time with friends"
- "Healthy sign: People who respect your 'no' the first time"

#### Mood-Based Triggers
```typescript
interface MoodTracking {
  userMood: 'happy' | 'confused' | 'upset' | 'anxious' | 'guilty';
  timestamp: Date;
  contextPrompt: string; // "Want to talk about what happened?"
}
```

When user reports negative emotions, app asks:
- "What happened that made you feel this way?"
- "Was someone involved in this situation?"
- "Would you like to analyze this interaction?"

#### Crisis Detection System
**Automatic triggers:**
- High-risk patterns (grooming, threats, violence)
- Keywords: "hurt myself," "suicide," "abuse"
- Escalating pattern frequency
- Sudden drop in confidence scores

**Crisis Response:**
1. Immediate notification: "We're concerned about your safety"
2. Emergency resources displayed prominently
3. One-tap access to crisis hotlines:
   - Childline (0800 1111)
   - Samaritans (116 123)
   - NSPCC (0808 800 5000)
4. Option to share location with trusted contact
5. Guided next steps

### 5. Subscription & Premium Features

#### Freemium Limits
**Free Tier (3 analyses/month):**
- Basic pattern recognition
- Risk level indicators
- Crisis resource access
- Email support

**Premium Tier (£9.47/month):**
- Unlimited analyses
- Advanced pattern tracking with charts
- Confidence scoring (0-100%)
- Evidence documentation mode
- Relationship mapping visualization
- Cultural sensitivity analysis
- Trigger identification system
- Priority support (24-48 hour response)
- Export reports (PDF)
- Multi-device sync

#### Subscription Flow
**Trigger Points:**
1. After 3rd free analysis (soft limit)
2. Accessing premium features (visual map, export)
3. During onboarding (skippable offer)

**Conversion Screen:**
```
┌─────────────────────────────┐
│ Upgrade your protection     │
├─────────────────────────────┤
│ Unlimited peace of mind for │
│      32p a day              │
│                             │
│      Free    │    Premium   │
│ ──────────────┼────────────  │
│ Interactions  │             │
│      10       │   Unlimited │
│ Analysis      │             │
│    Limited    │   Unlimited │
│ Reports       │             │
│    Limited    │   Unlimited │
│ Support       │             │
│    Email      │   Priority  │
│                             │
│ £9.47/month                 │
│                             │
│ [Start 7-day free trial]    │
│                             │
│ Join 1000+ users • Encrypted│
│ • Cancel anytime            │
└─────────────────────────────┘
```

#### Payment Integration
- Stripe Checkout for web payments
- In-App Purchases (iOS App Store, Google Play)
- RevenueCat for cross-platform subscription sync
- 7-day free trial (auto-converts to paid)
- Cancel anytime with immediate effect
- Pro-rated refunds within 14 days

### 6. Resources & Support

#### Resources Screen
```
┌─────────────────────────────┐
│ Resources                   │
├─────────────────────────────┤
│ Crisis Support              │
│ [🆘 Get Immediate Help]     │
│                             │
│ Safety Guides               │
│ • Recognizing Gaslighting   │
│ • Dealing with Manipulation │
│ • Setting Boundaries        │
│ • When to Seek Help         │
│                             │
│ UK Helplines                │
│ • Childline: 0800 1111      │
│ • Samaritans: 116 123       │
│ • NSPCC: 0808 800 5000      │
│ • National Domestic Abuse   │
│   Helpline: 0808 2000 247   │
│                             │
│ Educational Content         │
│ • Understanding Manipulation│
│ • Healthy Relationships 101 │
│ • Trusting Your Intuition   │
└─────────────────────────────┘
```

### 7. Settings & Privacy Controls

#### Settings Screen Sections

**Account**
- Profile (nickname, age range)
- Subscription management
- Email preferences

**Privacy & Security**
- Biometric lock (Face ID/Touch ID)
- App lock PIN
- Clear analysis history
- Export all data (GDPR)
- Delete account permanently

**Notifications**
- Daily check-ins (on/off)
- Educational tips (on/off)
- Crisis alerts (always on)
- Frequency preferences

**Personalization**
- Preferred name/pronouns
- Cultural background (optional)
- Communication style (direct/gentle)
- Trigger warnings (enable/disable)

**Support**
- Help Center
- Contact Support
- Report a Bug
- Feature Requests

**Legal**
- Privacy Policy
- Terms of Service
- GDPR Compliance
- Licenses

---

## Data Models

### Database Schema (Supabase/PostgreSQL)

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_provider TEXT CHECK (auth_provider IN ('google', 'email', 'anonymous')),
  nickname TEXT,
  age_range TEXT,
  cultural_background TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false
);
```

#### Analyses Table
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  situation_description TEXT NOT NULL,
  relationship_type TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  patterns JSONB, -- Array of detected patterns
  key_insights TEXT,
  recommendations JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  is_bookmarked BOOLEAN DEFAULT false,
  is_in_evidence_file BOOLEAN DEFAULT false
);
```

#### Contacts Table
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship_type TEXT,
  risk_level TEXT DEFAULT 'unknown',
  first_seen TIMESTAMP DEFAULT NOW(),
  last_interaction TIMESTAMP,
  incident_count INTEGER DEFAULT 0,
  patterns JSONB,
  notes TEXT
);
```

#### Patterns Table
```sql
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  pattern_type TEXT NOT NULL,
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  description TEXT,
  educational_content TEXT,
  detected_at TIMESTAMP DEFAULT NOW()
);
```

#### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT CHECK (tier IN ('free', 'premium')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Interfaces

```typescript
interface User {
  id: string;
  authProvider: 'google' | 'email' | 'anonymous';
  nickname?: string;
  ageRange?: '16-18' | '19-21' | '22-25' | '25+';
  culturalBackground?: string;
  subscriptionTier: 'free' | 'premium';
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Analysis {
  id: string;
  userId: string;
  situationDescription: string;
  relationshipType?: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  patterns: Pattern[];
  keyInsights: string;
  recommendations: Recommendation[];
  createdAt: Date;
  isBookmarked: boolean;
  isInEvidenceFile: boolean;
}

interface Pattern {
  type: 'gaslighting' | 'love-bombing' | 'isolation' | 'coercion' | 'negging' | 'guilt-tripping' | 'triangulation';
  confidence: number;
  description: string;
  educationalContent: string;
  examples: string[];
}

interface Recommendation {
  category: 'immediate' | 'short-term' | 'long-term' | 'professional-help';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  conversationScripts?: string[];
}

interface Contact {
  id: string;
  userId: string;
  name: string;
  relationshipType: 'romantic' | 'family' | 'friend' | 'colleague' | 'authority' | 'other';
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  firstSeen: Date;
  lastInteraction: Date;
  incidentCount: number;
  patterns: Pattern[];
  notes?: string;
}
```

---

## AI Analysis System

### Prompt Engineering Structure

#### System Prompt (Base)
```
You are GutCheck AI, a specialized relationship safety analyst trained to identify manipulation patterns, toxic behaviors, and red flags in interpersonal interactions. Your responses must:

1. Be non-judgmental and supportive
2. Never state definitive conclusions (e.g., "This is definitely grooming")
3. Always use confidence-based language (e.g., "This shows signs that align with...")
4. Provide evidence-based analysis referencing psychological research
5. Offer actionable advice with specific response strategies
6. Include cultural context awareness
7. Detect and respond appropriately to crisis situations

Remember: You are an assistant, not an authority. The final judgment lies with the user and real-world experts.
```

#### Analysis Prompt Template
```
Analyze the following situation for manipulation patterns and toxic behaviors:

SITUATION:
{userDescription}

CONTEXT:
- Relationship type: {relationshipType}
- Duration: {duration}
- Previous incidents: {hasHistory}
- User emotional state: {emotionalState}
- Cultural background: {culturalContext}

Provide analysis in this JSON structure:
{
  "riskLevel": "low|medium|high",
  "confidenceScore": 0-100,
  "patterns": [
    {
      "type": "pattern-name",
      "confidence": 0-100,
      "description": "brief explanation",
      "evidence": ["specific examples from situation"]
    }
  ],
  "keyInsights": "plain language explanation",
  "recommendations": [
    {
      "category": "immediate|short-term|long-term",
      "action": "specific advice",
      "conversationScript": "optional example language"
    }
  ],
  "culturalConsiderations": "relevant cultural context",
  "crisisIndicators": ["any immediate safety concerns"]
}
```

### Pattern Detection Library

**Core Patterns to Detect:**
1. **Gaslighting** - Making target question their reality/sanity
2. **Love Bombing** - Overwhelming affection to create dependency
3. **Isolation** - Separating target from support networks
4. **Coercion** - Pressure tactics and manipulation
5. **Negging** - Backhanded compliments to undermine confidence
6. **Guilt-Tripping** - Using guilt to control behavior
7. **Triangulation** - Using third parties to manipulate
8. **Stonewalling** - Withdrawal as punishment
9. **Projection** - Accusing target of perpetrator's own behaviors
10. **DARVO** - Deny, Attack, Reverse Victim & Offender

**Grooming Indicators:**
- Excessive compliments ("You're so mature for your age")
- Secrecy requests ("Don't tell your parents")
- Boundary testing
- Gift-giving with strings attached
- Isolation from age-appropriate peers

**Crisis Indicators:**
- Threats of violence
- Suicidal ideation
- Self-harm mentions
- Active abuse disclosures
- Immediate danger language

### Confidence Scoring Algorithm

```typescript
function calculateConfidenceScore(
  patternMatches: Pattern[],
  evidenceStrength: number,
  historicalData: Analysis[]
): number {
  let baseScore = 0;
  
  // Pattern match contribution (0-60 points)
  const patternScore = Math.min(60, patternMatches.length * 15);
  
  // Evidence strength (0-25 points)
  const evidenceScore = evidenceStrength * 25;
  
  // Historical correlation (0-15 points)
  const historyScore = historicalData.length > 0 
    ? Math.min(15, historicalData.filter(a => a.riskLevel !== 'low').length * 5)
    : 0;
  
  return Math.min(100, patternScore + evidenceScore + historyScore);
}
```

---

## Privacy & Security Implementation

### Data Protection Measures

1. **End-to-End Encryption**
   - Analysis content encrypted client-side before storage
   - Encryption key derived from user credentials
   - Zero-knowledge architecture where possible

2. **Anonymization**
   - No real names required
   - Contact names hashed in database
   - Analysis content pseudonymized
   - IP addresses not logged

3. **Local Storage**
   - Sensitive data cached locally with encryption
   - Analysis results stored on-device first
   - Server sync only for backup/cross-device

4. **Row-Level Security (Supabase)**
```sql
-- Users can only access their own data
CREATE POLICY users_own_data ON analyses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY users_own_contacts ON contacts
  FOR ALL USING (auth.uid() = user_id);
```

### GDPR Compliance

**User Rights Implementation:**
1. **Right to Access** - Export all data button in settings
2. **Right to Erasure** - Delete account with full data removal
3. **Right to Portability** - JSON export of all user data
4. **Right to Rectification** - Edit analysis history, contact info
5. **Right to Restrict Processing** - Pause data collection option

**Data Retention Policy:**
- Active accounts: Data retained indefinitely
- Free tier: 90 days of analysis history
- Premium tier: Unlimited history retention
- Deleted accounts: 30-day grace period, then permanent deletion
- Backup retention: 90 days

### Crisis Intervention Protocols

**Non-Mandatory Reporting:**
- App does NOT automatically report to authorities
- User maintains full control
- Option to connect with helplines anonymously
- Resources provided without tracking

**Exception:**
- If user explicitly requests help contacting authorities
- Guided process with user consent at each step

---

## Performance Requirements

### App Performance Targets
- **Cold start:** < 2 seconds
- **Analysis processing:** 15-30 seconds
- **Screen transitions:** < 300ms
- **API response time:** < 1 second (95th percentile)
- **Offline capability:** Full analysis history accessible without connection

### Optimization Strategies
1. **Lazy loading** of screens and components
2. **Image optimization** with WebP format
3. **Database indexing** on frequently queried fields
4. **API caching** with React Query
5. **Pagination** for analysis history (20 items per page)

---

## Testing Requirements

### Unit Testing
- All utility functions
- State management stores
- Form validation logic
- Confidence scoring algorithm

### Integration Testing
- Authentication flows
- Analysis submission and retrieval
- Subscription management
- Push notification handling

### End-to-End Testing
- Complete user journeys (registration → analysis → premium upgrade)
- Crisis detection and response
- Cross-device synchronization
- Payment processing

### Security Testing
- Penetration testing for API endpoints
- Encryption verification
- Authentication bypass attempts
- Data leakage checks

---

## Deployment & Distribution

### App Store Preparation

#### iOS App Store
- **App Name:** GutCheck
- **Subtitle:** Visualize Your Intuition
- **Category:** Health & Fitness / Lifestyle
- **Age Rating:** 12+ (Infrequent/Mild Mature/Suggestive Themes)
- **Keywords:** relationship safety, manipulation detection, emotional intelligence, mental health, therapy assistant
- **Privacy Nutrition Label:**
  - Data Not Collected: Name, Email (unless provided)
  - Data Collected but Not Linked: Usage data, diagnostics
  - Data Linked to You: User content, identifiers (if registered)

#### Google Play Store
- **App Name:** GutCheck - Relationship Safety
- **Category:** Health & Fitness
- **Content Rating:** Teen (strong language, suggestive themes)
- **Target Audience:** Ages 16-25
- **Data Safety:**
  - Collects: App activity, app info and performance
  - Shares: No data shared with third parties
  - Security: Data encrypted in transit and at rest

### Pre-Launch Checklist
- [ ] App Store screenshots (5.5", 6.5" iPhone; iPad)
- [ ] Google Play screenshots (Phone, 7" tablet, 10" tablet)
- [ ] App preview video (15-30 seconds)
- [ ] Privacy policy hosted at mygutcheck.org/privacy
- [ ] Terms of service at mygutcheck.org/terms
- [ ] COPPA compliance documentation (for under-18 users)
- [ ] Content rating certificates
- [ ] Beta testing completion (minimum 100 users)
- [ ] Crash rate < 0.1%
- [ ] Security audit completion
- [ ] Accessibility testing (VoiceOver/TalkBack)

### Deployment Strategy

**Phase 1: Soft Launch (Week 1-2)**
- UK-only release
- Invite-only beta testers
- Monitoring and bug fixing
- Performance optimization

**Phase 2: Public Launch (Week 3-4)**
- Full UK App Store/Play Store release
- Marketing campaign activation
- Influencer partnerships
- Press outreach

**Phase 3: Expansion (Month 2-3)**
- EU market expansion
- Localization for additional languages
- Feature iteration based on feedback

---

## Analytics & Monitoring

### Key Metrics to Track

**User Acquisition:**
- Daily/Monthly Active Users (DAU/MAU)
- Install sources and attribution
- Onboarding completion rate
- Registration method distribution

**Engagement:**
- Average analyses per user per month
- Session duration and frequency
- Feature usage breakdown
- Screen time distribution

**Retention:**
- Day 1, Day 7, Day 30 retention rates
- Churn rate and reasons
- Re-engagement campaign success

**Conversion:**
- Free to premium conversion rate
- Trial to paid conversion rate
- Average revenue per user (ARPU)
- Lifetime value (LTV)

**Product Health:**
- Analysis completion rate
- AI response accuracy (user feedback)
- Crisis detection accuracy
- App crash rate
- API error rate

**User Satisfaction:**
- In-app rating prompts (after positive interactions)
- App Store ratings and reviews
- Support ticket volume and resolution time
- Net Promoter Score (NPS)

### Analytics Implementation
```typescript
// PostHog event tracking
analytics.track('analysis_submitted', {
  relationshipType: string,
  wordCount: number,
  hasHistory: boolean,
  userTier: 'free' | 'premium'
});

analytics.track('pattern_detected', {
  patternType: string,
  confidenceScore: number,
  riskLevel: string
});

analytics.track('subscription_started', {
  plan: 'premium',
  trial: boolean,
  source: 'paywall' | 'settings' | 'onboarding'
});

analytics.track('crisis_detected', {
  severityLevel: 'low' | 'medium' | 'high',
  resourcesProvided: string[],
  userAction: 'contacted_helpline' | 'dismissed' | 'saved_for_later'
});
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**Visual:**
- Minimum contrast ratio 4.5:1 for normal text
- Minimum contrast ratio 3:1 for large text (18px+)
- Color is not the only means of conveying information
- Text resizing up to 200% without loss of functionality

**Auditory:**
- Captions for any video content
- Visual alternatives for audio alerts

**Motor:**
- All functionality available via keyboard/screen reader
- Touch targets minimum 44x44 pixels
- No timing-critical actions
- Gestures have alternative methods

**Cognitive:**
- Clear, simple language throughout
- Consistent navigation patterns
- Error messages with clear recovery instructions
- Sufficient time to read and use content

### Screen Reader Support
- Semantic HTML/React Native elements
- Proper heading hierarchy
- Alt text for all images and icons
- ARIA labels for custom components
- Focus management for modals and overlays

### Internationalization Support
- RTL (Right-to-Left) layout support
- Date/time formatting for locales
- Number formatting (currency, decimals)
- Translation-ready string architecture
- Cultural sensitivity in content

---

## Marketing & Launch Strategy

### Pre-Launch Activities (Month -1)

**Content Creation:**
- Blog posts on relationship safety topics
- Educational videos about manipulation patterns
- Social media presence (Instagram, TikTok, Twitter)
- Press kit and media resources

**Community Building:**
- Beta tester recruitment (target: 200 users)
- Partner with mental health organizations
- Influencer outreach (mental health advocates)
- University partnerships

**Website Optimization:**
- Landing page conversion optimization
- Email capture for launch notifications
- Referral program setup
- App Store optimization (ASO)

### Launch Day Activities

**Channels:**
- Product Hunt launch
- Social media announcements
- Email blast to waitlist
- Press release distribution
- Reddit AMAs (r/mentalhealth, r/relationships)

**Monitoring:**
- Real-time dashboard for installs
- Social media sentiment tracking
- Support channel monitoring
- Server load and performance

### Post-Launch (Week 1-4)

**User Feedback Loop:**
- In-app survey after first analysis
- Follow-up emails for onboarding drop-offs
- Support ticket analysis
- Feature request collection

**Iteration:**
- Bug fixes (priority: crash fixes within 24 hours)
- Performance improvements
- Content updates based on common patterns
- UI/UX refinements

**Growth:**
- Referral program activation ("Invite a friend")
- Content marketing (blog, social)
- Partnership announcements
- User testimonials (with consent)

---

## Success Criteria & KPIs

### Launch Success (First 30 Days)
- 5,000+ installs
- 2,500+ registered users
- 60%+ onboarding completion rate
- 40%+ Day 7 retention
- 4.0+ star rating on app stores
- < 2% crash rate
- 100+ premium subscribers

### 6-Month Targets
- 50,000+ installs
- 25,000+ active users
- 1,000+ premium subscribers (4% conversion)
- 50%+ Day 7 retention
- 30%+ Day 30 retention
- £10,000+ monthly recurring revenue
- 4.5+ star rating

### 12-Month Vision
- 200,000+ installs
- 100,000+ active users
- 5,000+ premium subscribers
- £50,000+ monthly recurring revenue
- Expansion to 5+ countries
- Partnerships with 10+ mental health organizations
- Feature parity with desktop/web version

---

## Risk Management

### Technical Risks

**Risk:** AI service downtime or rate limits
**Mitigation:**
- Multiple AI provider fallbacks (OpenAI → Claude → Gemini)
- Local caching of analysis results
- Queue system for high-demand periods

**Risk:** Data breach or security vulnerability
**Mitigation:**
- Regular security audits (quarterly)
- Penetration testing before major releases
- Bug bounty program
- Incident response plan documented

**Risk:** App Store rejection
**Mitigation:**
- Thorough review guidelines study
- Pre-submission compliance check
- Conservative content approach
- Fast iteration on feedback

### Legal Risks

**Risk:** GDPR non-compliance
**Mitigation:**
- Legal review of data practices
- DPO (Data Protection Officer) consultation
- Regular compliance audits
- User consent mechanisms

**Risk:** Liability for incorrect advice
**Mitigation:**
- Clear disclaimers throughout app
- "Assistant, not authority" messaging
- Professional review of crisis protocols
- Liability insurance

**Risk:** Age verification for minors
**Mitigation:**
- Age gate at registration
- Parental consent mechanism for under-16s
- COPPA compliance for US expansion
- Age-appropriate content filtering

### Business Risks

**Risk:** Low conversion to premium
**Mitigation:**
- Continuous A/B testing of pricing/features
- Value demonstration during free tier
- Strategic feature gating
- User research on willingness to pay

**Risk:** High churn rate
**Mitigation:**
- Regular engagement campaigns
- Personalized push notifications
- Feature updates based on feedback
- Win-back campaigns for churned users

**Risk:** Reputational damage from misuse
**Mitigation:**
- Content moderation systems
- Abuse detection and prevention
- Clear terms of service
- Responsive support team

---

## Future Roadmap (Post-MVP)

### Phase 2 Features (Months 4-6)
- **Journaling feature** for emotional tracking
- **Guided meditation** for stress relief
- **Community forum** (moderated, anonymous)
- **Therapist matching** service integration
- **Multi-language support** (Spanish, French, German)

### Phase 3 Features (Months 7-12)
- **Voice analysis** for verbal interactions
- **Group dynamics analysis** for multi-person situations
- **Relationship health scoring** algorithm
- **Predictive warning system** based on patterns
- **Integration with wearables** for stress detection

### Phase 4 Vision (Year 2+)
- **B2B offering** for schools and universities
- **Therapist dashboard** for professional use
- **Research partnerships** for academic studies
- **Open API** for third-party integrations
- **VR/AR experiences** for boundary-setting practice

---

## Development Team Structure

### Recommended Team Composition

**Phase 1 (MVP):**
- 1 Full-Stack Developer (React Native + Supabase)
- 1 UI/UX Designer
- 1 AI/ML Engineer (prompt engineering, model selection)
- 1 QA Tester (part-time)
- 1 Product Manager (could be founder)

**Phase 2 (Scale):**
- 2 Mobile Developers (iOS specialist + Android specialist)
- 1 Backend Engineer (API optimization)
- 1 DevOps Engineer (infrastructure, monitoring)
- 1 Content Creator (educational resources)
- 1 Customer Support Lead
- 1 Marketing Specialist

### External Resources
- Legal consultant (privacy, terms)
- Mental health advisor (crisis protocols)
- Security consultant (audits)
- Accounting/finance (subscription management)

---

## Budget Considerations

### Development Costs (MVP - 6 months)
- Team salaries: £150,000 - £250,000
- Design tools (Figma): £144/year
- Development tools (Cursor, IDEs): £500/year
- Third-party services:
  - Supabase: £25/month → £150
  - OpenAI API: £500-2,000/month → £6,000-£12,000
  - Stripe: 1.5% + £0.20 per transaction
  - RevenueCat: £50/month → £300
  - PostHog: £0 (startup plan)
- App Store fees: £79/year (Apple), £25 one-time (Google)
- Domain and hosting: £200/year
- **Total MVP budget: £160,000 - £270,000**

### Operating Costs (Monthly - Post-Launch)
- Server hosting: £500-2,000
- AI API costs: £1,000-5,000 (scales with users)
- Payment processing: 2-3% of revenue
- Customer support tools: £200
- Analytics and monitoring: £300
- Marketing and acquisition: £2,000-10,000
- **Total monthly: £4,000-£18,000**

### Revenue Projections (Conservative)
- Month 3: 50 premium users × £9.47 = £473/month
- Month 6: 500 premium users × £9.47 = £4,735/month
- Month 12: 2,000 premium users × £9.47 = £18,940/month
- Month 24: 10,000 premium users × £9.47 = £94,700/month

---

## Appendix

### Glossary of Terms

**Gaslighting:** A manipulation tactic where the perpetrator makes the victim question their own reality, memory, or perceptions.

**Love Bombing:** Overwhelming someone with excessive attention and affection early in a relationship to create dependency.

**Negging:** Giving backhanded compliments or subtle insults to undermine someone's confidence.

**Triangulation:** Using a third party to validate the perpetrator's position or make the victim jealous.

**DARVO:** Deny, Attack, and Reverse Victim and Offender - a response pattern used by perpetrators when confronted.

**Freemium:** A business model offering basic features for free with premium features requiring payment.

**MAU:** Monthly Active Users - users who engage with the app at least once per month.

**Churn:** The rate at which users stop using the app or cancel subscriptions.

**ASO:** App Store Optimization - techniques to improve app visibility in app stores.

### Crisis Resources Reference

**UK Emergency Services:**
- Emergency: 999
- Non-emergency: 111

**Mental Health Crisis:**
- Samaritans: 116 123 (24/7)
- Childline: 0800 1111 (for under 19s)
- Papyrus (suicide prevention): 0800 068 4141
- Shout Crisis Text Line: Text SHOUT to 85258

**Abuse & Exploitation:**
- NSPCC: 0808 800 5000
- Childline: 0800 1111
- National Domestic Abuse Helpline: 0808 2000 247
- Rape Crisis: 0808 802 9999

**LGBTQ+ Support:**
- Switchboard: 0300 330 0630
- Mermaids: 0808 801 0400

---

## Document Version History

- v1.0 - Initial specification (January 2025)
- Last Updated: January 2025
- Next Review: March 2025

---

## Approval & Sign-off

This specification should be reviewed and approved by:
- [ ] Product Owner/Founder
- [ ] Lead Developer
- [ ] UI/UX Designer
- [ ] Legal Advisor (privacy/compliance sections)
- [ ] Mental Health Advisor (crisis protocols)

**Once approved, this document serves as the primary reference for all development work on the GutCheck mobile application.**