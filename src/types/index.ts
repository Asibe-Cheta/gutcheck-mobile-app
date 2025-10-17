/**
 * Core TypeScript Interfaces for GutCheck App
 * Based on the specification's data models
 */

export interface User {
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

export interface Analysis {
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

export interface Pattern {
  type: 'gaslighting' | 'love-bombing' | 'isolation' | 'coercion' | 'negging' | 'guilt-tripping' | 'triangulation' | 'stonewalling' | 'projection' | 'darvo';
  confidence: number;
  description: string;
  educationalContent: string;
  examples: string[];
  detectedAt: Date;
}

export interface Recommendation {
  category: 'immediate' | 'short-term' | 'long-term' | 'professional-help';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  conversationScripts?: string[];
}

export interface Contact {
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

export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
}

// Navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Resources: undefined;
  Settings: undefined;
};

// Component prop types
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

// State management types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AnalysisState {
  analyses: Analysis[];
  currentAnalysis: Analysis | null;
  isLoading: boolean;
  error: string | null;
}

export interface SettingsState {
  notifications: {
    dailyCheckIns: boolean;
    educationalTips: boolean;
    crisisAlerts: boolean;
  };
  privacy: {
    biometricLock: boolean;
    appLockPIN: string | null;
  };
  personalization: {
    preferredName: string;
    pronouns: string;
    culturalBackground: string;
    communicationStyle: 'direct' | 'gentle';
    triggerWarnings: boolean;
  };
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error: string | null;
  success: boolean;
}

export interface AnalysisRequest {
  situationDescription: string;
  relationshipType?: string;
  duration?: string;
  hasHistory?: boolean;
  emotionalState?: string;
  culturalContext?: string;
}

export interface AnalysisResponse {
  riskLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  patterns: Pattern[];
  keyInsights: string;
  recommendations: Recommendation[];
  culturalConsiderations?: string;
  crisisIndicators?: string[];
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type RiskLevel = 'low' | 'medium' | 'high';

export type RelationshipType = 'romantic' | 'family' | 'friend' | 'colleague' | 'authority' | 'other';

export type PatternType = 'gaslighting' | 'love-bombing' | 'isolation' | 'coercion' | 'negging' | 'guilt-tripping' | 'triangulation' | 'stonewalling' | 'projection' | 'darvo';
