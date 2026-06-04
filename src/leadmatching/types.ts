export type ProviderRole = 'THERAPIST' | 'PSYCHOLOGIST' | 'PSYCHIATRIST' | 'COACH';
export type ProviderTypeFilter = ProviderRole | 'ALL';

export type LeadStatus =
  | 'CREATED'
  | 'AVAILABLE'
  | 'CONTACTED'
  | 'PURCHASED'
  | 'ACCEPTED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'DECLINED'
  | 'RECYCLED';

export type LeadChannel = 'CONSUMER' | 'B2B' | 'CORPORATE';

export type LeadContext = 'Standard' | 'Corporate' | 'Night' | 'Buddy' | 'Crisis';

export type LeadBand = 'PLATINUM' | 'HOT' | 'WARM' | 'COLD' | 'EXCLUDED';

export type ProviderTier = 'STARTER' | 'GROWTH' | 'SCALE' | 'PREMIUM';

export type CertificationStatus = 'NONE' | 'BASIC' | 'ADVANCED' | 'EXPERT';

export type HighestQual = 'Bachelor' | 'Master' | 'PhD' | 'MD';

export type TimezoneRegion = 'IST' | 'US_EST' | 'UK' | 'AU' | 'SG' | 'UAE' | 'OTHER';

export interface TimeSlot {
  startMinute: number; // minutes from midnight (e.g. 1020 = 17:00 / 5 PM)
  endMinute: number;
}

export interface DayAvailability {
  slots: TimeSlot[];
}

export interface Availability {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
  [key: string]: TimeSlot[] | undefined;
}

export interface ClinicalCategoryInfo {
  yearsExperience: number;
}

export interface ProviderProfile {
  id: string;
  name: string;
  specializations: string[];
  clinicalCategories: Record<string, ClinicalCategoryInfo>;
  certificationStatus: CertificationStatus;
  highestQual: HighestQual;
  languages: string[];
  availability: Availability;
  therapyModes: ('video' | 'voice' | 'chat')[];
  sessionDuration: number; // in minutes
  averageRating: number; // 0 to 5
  completedSessionCount: number;
  onboardingCompleted: boolean;
  isVerified: boolean;
  leadBoostScore: number; // 0 to 20
  tier: ProviderTier;
  nriPoolCertified: boolean;
  nriTimezoneShifts: TimezoneRegion[];
}

export interface PatientPreferences {
  daysOfWeek: number[]; // 1 = Monday, ..., 7 = Sunday
  timeSlots: TimeSlot[];
  languages: string[];
  therapyModes: ('video' | 'voice' | 'chat')[];
  context: LeadContext;
  timezoneRegion: TimezoneRegion;
  providerTypeFilter: ProviderTypeFilter;
  sourceFunnel?: string;
}

export interface PatientProfile {
  id: string;
  phq9Score: number; // 0-27
  gad7Score: number; // 0-21
  primaryConcern: string;
  secondaryConcerns: string[];
  assessmentDate: string;
  preferences: PatientPreferences;
}

export interface LeadPreviewData {
  age?: number;
  concern: string;
  severity: string;
  language: string[];
  slots: { day: string; start: string; end: string }[];
}

export interface Lead {
  id: string;
  patientId: string;
  matchScore: number; // 0-100
  matchBand: LeadBand;
  expertiseScore: number; // 0-100
  communicationScore: number; // 0-100
  qualityScore: number; // 0-100
  status: LeadStatus;
  channel: LeadChannel;
  issues: string[];
  context: LeadContext;
  createdAt: string;
  expiresAt: string;
  previewData: LeadPreviewData;
  tier: ProviderTier;
  quality: number; // Score range for tier
  price: number; // Cost in Rupees to accept
}

// Onboarding schemas
export interface LeadPlanConfig {
  id: string;
  name: string;
  prisma_plan: string;
  lead_price: number;
  leads_per_month: number;
  match_quality: string;
  match_range: string;
  features: string[];
  corporate_leads: boolean;
  nri_leads: boolean;
  refund_pct: number;
  popular?: boolean;
}

export interface OnboardingChecklistItem {
  step: 'register' | 'verify' | 'pay' | 'plan' | 'certification' | 'credential';
  label: string;
  done: boolean;
}

export interface OnboardingStatus {
  provider_id: string;
  name: string;
  phone: string;
  qualification: string;
  lead_plan: string;
  platform_active: boolean;
  verified: boolean;
  checklist: OnboardingChecklistItem[];
  next_action: {
    action: string;
    url: string;
  };
  stats: {
    leads_received: number;
    sessions_completed: number;
  };
}
