# GutCheck App Setup Instructions

## 🚀 Quick Start

Your GutCheck app is now running! You can see it in the Expo DevTools. Here's how to complete the setup:

## 📋 Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (Required for database)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Service Configuration (Required for analysis)
# Choose one: OpenAI or Anthropic
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
# EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Stripe Configuration (Required for payments)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID=your_stripe_premium_price_id_here
EXPO_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=your_stripe_premium_yearly_price_id_here

# Google OAuth Configuration (Optional)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# App Configuration (Optional)
EXPO_PUBLIC_APP_ENV=development
```

## 🗄️ Database Setup

1. **Create a Supabase project** at https://supabase.com
2. **Run the database schema**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `database/schema.sql`
   - Run the SQL script

## 🔑 API Keys Setup

### Supabase (Required)
1. Go to your Supabase project dashboard
2. Go to Settings > API
3. Copy your Project URL and anon public key

### OpenAI (Required for AI analysis)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to your `.env` file

### Stripe (Required for payments)
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your Publishable key
3. Add it to your `.env` file

## 📱 Testing the App

1. **Scan the QR code** with Expo Go app on your phone
2. **Or press `i`** for iOS simulator
3. **Or press `a`** for Android emulator
4. **Or press `w`** for web browser

## 🎯 App Features

Your GutCheck app includes:

- ✅ **Welcome Screen** - Beautiful landing page
- ✅ **Authentication** - Login/Register with multiple options
- ✅ **Onboarding** - Multi-step user setup
- ✅ **Home Screen** - AI analysis input
- ✅ **History Screen** - Analysis timeline with patterns
- ✅ **Resources Screen** - Crisis support and education
- ✅ **Settings Screen** - User preferences
- ✅ **Upgrade Screen** - Premium subscription

## 🚨 Current Status

The app is running but needs environment variables to be fully functional. Once you add your API keys, all features will work:

- **Database operations** (Supabase)
- **AI analysis** (OpenAI/Anthropic)
- **Payment processing** (Stripe)
- **Authentication** (Supabase Auth)

## 📞 Support

If you need help setting up any of the services, the app will show helpful warnings in the console with setup instructions.

---

**Your GutCheck app is ready to use! 🎉**
