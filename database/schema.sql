-- GutCheck Database Schema
-- This file contains all the SQL commands to set up the database tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'incomplete');
CREATE TYPE pattern_type AS ENUM (
  'gaslighting', 
  'love-bombing', 
  'isolation', 
  'coercion', 
  'negging', 
  'guilt-tripping', 
  'triangulation', 
  'stonewalling', 
  'projection', 
  'darvo'
);
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE contact_type AS ENUM ('family', 'friend', 'partner', 'colleague', 'acquaintance', 'other');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  nickname TEXT,
  age_range TEXT,
  cultural_background TEXT,
  communication_style TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_status subscription_status DEFAULT 'unpaid',
  subscription_id TEXT,
  subscription_plan TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  analysis_count INTEGER DEFAULT 0,
  analysis_limit INTEGER DEFAULT 10,
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Analyses table
CREATE TABLE public.analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status analysis_status DEFAULT 'pending',
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  summary TEXT,
  recommendations TEXT[],
  educational_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Patterns table
CREATE TABLE public.patterns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  type pattern_type NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  description TEXT NOT NULL,
  educational_content TEXT,
  examples TEXT[],
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Contacts table
CREATE TABLE public.contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type contact_type,
  relationship TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status subscription_status NOT NULL,
  plan TEXT NOT NULL,
  price_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Crisis reports table
CREATE TABLE public.crisis_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  patterns TEXT[],
  emergency_contacts_notified BOOLEAN DEFAULT FALSE,
  resources_provided TEXT[],
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- User sessions table (for analytics)
CREATE TABLE public.user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  screen_views JSONB DEFAULT '[]',
  interactions JSONB DEFAULT '[]',
  device_info JSONB DEFAULT '{}',
  app_version TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Educational content table
CREATE TABLE public.educational_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_patterns_analysis_id ON public.patterns(analysis_id);
CREATE INDEX idx_patterns_type ON public.patterns(type);
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_crisis_reports_user_id ON public.crisis_reports(user_id);
CREATE INDEX idx_crisis_reports_severity ON public.crisis_reports(severity);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_educational_content_category ON public.educational_content(category);
CREATE INDEX idx_educational_content_published ON public.educational_content(is_published);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_educational_content_updated_at BEFORE UPDATE ON public.educational_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Analyses policies
CREATE POLICY "Users can view own analyses" ON public.analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON public.analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON public.analyses FOR DELETE USING (auth.uid() = user_id);

-- Patterns policies
CREATE POLICY "Users can view patterns from own analyses" ON public.patterns FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM public.analyses WHERE id = analysis_id));
CREATE POLICY "Users can insert patterns for own analyses" ON public.patterns FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.analyses WHERE id = analysis_id));

-- Contacts policies
CREATE POLICY "Users can view own contacts" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Crisis reports policies
CREATE POLICY "Users can view own crisis reports" ON public.crisis_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crisis reports" ON public.crisis_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Educational content is public (read-only for users)
CREATE POLICY "Educational content is publicly readable" ON public.educational_content FOR SELECT USING (is_published = true);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_analysis_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.analyses 
    WHERE user_id = user_uuid 
    AND created_at >= DATE_TRUNC('month', NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT subscription_status::TEXT 
    FROM public.users 
    WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some initial educational content
INSERT INTO public.educational_content (title, content, category, tags, difficulty_level, is_published) VALUES
('Understanding Gaslighting', 'Gaslighting is a form of psychological manipulation where a person makes you question your own reality, memory, or perceptions. It often involves making you doubt your own experiences and feelings.', 'manipulation', ARRAY['gaslighting', 'psychological-abuse', 'manipulation'], 'beginner', true),
('Setting Healthy Boundaries', 'Boundaries are limits you set to protect your emotional, mental, and physical well-being. They help you maintain healthy relationships and protect yourself from manipulation.', 'relationships', ARRAY['boundaries', 'self-care', 'relationships'], 'beginner', true),
('Recognizing Love Bombing', 'Love bombing is a manipulation tactic where someone overwhelms you with excessive attention, affection, and gifts early in a relationship to gain control.', 'manipulation', ARRAY['love-bombing', 'manipulation', 'red-flags'], 'intermediate', true),
('Building Emotional Resilience', 'Emotional resilience helps you bounce back from difficult situations and maintain your mental health when dealing with manipulative people.', 'mental-health', ARRAY['resilience', 'mental-health', 'coping'], 'intermediate', true);

-- Anonymous Payments Table (Privacy-Focused)
CREATE TABLE anonymous_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  anonymous_user_id VARCHAR(255) NOT NULL, -- Anonymous identifier, not linked to users table
  amount INTEGER NOT NULL, -- Amount in pence
  currency VARCHAR(3) DEFAULT 'GBP',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'canceled')),
  payment_method VARCHAR(20) DEFAULT 'card' CHECK (payment_method IN ('card', 'apple_pay', 'google_pay')),
  billing_info JSONB, -- Minimal billing info only
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for anonymous payments
ALTER TABLE anonymous_payments ENABLE ROW LEVEL SECURITY;

-- Anonymous users can only access their own payments
CREATE POLICY "Anonymous users can access their own payments" ON anonymous_payments
  FOR ALL USING (anonymous_user_id = current_setting('app.anonymous_user_id', true));
