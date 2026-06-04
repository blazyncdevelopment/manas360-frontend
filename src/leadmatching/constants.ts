import { LeadBand, ProviderTier, LeadContext } from './types';

// Matching Weights
export const SCORE_WEIGHTS = {
  EXPERTISE: 0.40,
  COMMUNICATION: 0.30,
  QUALITY: 0.30,
};

// Highest Qualification Base Scores (for Expertise Score)
export const QUALIFICATION_BASE_SCORES: Record<string, number> = {
  Bachelor: 40,
  Master: 60,
  PhD: 85,
  MD: 100,
};

// Certification Multipliers (for Expertise Score)
export const CERTIFICATION_MULTIPLIERS: Record<string, number> = {
  NONE: 1.0,
  BASIC: 1.1,
  ADVANCED: 1.25,
  EXPERT: 1.4,
};

// Match Bands Configuration
export interface MatchBandConfig {
  band: LeadBand;
  minScore: number;
  maxScore: number;
  price: number;
  visibleTo: ProviderTier[];
}

export const MATCH_BANDS: Record<LeadBand, MatchBandConfig> = {
  PLATINUM: {
    band: 'PLATINUM',
    minScore: 95,
    maxScore: 100,
    price: 399,
    visibleTo: ['PREMIUM'],
  },
  HOT: {
    band: 'HOT',
    minScore: 80,
    maxScore: 94,
    price: 299,
    visibleTo: ['SCALE', 'PREMIUM'],
  },
  WARM: {
    band: 'WARM',
    minScore: 65,
    maxScore: 79,
    price: 199,
    visibleTo: ['GROWTH', 'SCALE', 'PREMIUM'],
  },
  COLD: {
    band: 'COLD',
    minScore: 50,
    maxScore: 64,
    price: 0,
    visibleTo: ['STARTER', 'GROWTH', 'SCALE', 'PREMIUM'],
  },
  EXCLUDED: {
    band: 'EXCLUDED',
    minScore: 0,
    maxScore: 49,
    price: 0,
    visibleTo: [],
  },
};

// Context Variations Configuration
export interface ContextConfig {
  context: LeadContext;
  priceMultiplier: number;
  ttlHours: number;
  slaMinutes?: number;
  notes: string;
}

export const CONTEXT_VARIATIONS: Record<LeadContext, ContextConfig> = {
  Standard: {
    context: 'Standard',
    priceMultiplier: 1.0,
    ttlHours: 24,
    notes: 'Normal hours, all providers, regular pricing',
  },
  Corporate: {
    context: 'Corporate',
    priceMultiplier: 1.0, // Company pays
    ttlHours: 24,
    notes: 'B2B, company pays, session limits, confidentiality clauses',
  },
  Night: {
    context: 'Night',
    priceMultiplier: 1.2, // +20% premium
    ttlHours: 12,
    notes: '8pm-midnight, +20% premium, 12-hour TTL',
  },
  Buddy: {
    context: 'Buddy',
    priceMultiplier: 0.5, // 50% cheaper
    ttlHours: 24,
    notes: 'Peer support, 50% cheaper, non-licensed coaches',
  },
  Crisis: {
    context: 'Crisis',
    priceMultiplier: 1.5, // +50% premium
    ttlHours: 2, // 2-hour TTL
    slaMinutes: 15, // 15-min response SLA
    notes: 'Emergency, +50% premium, 2-hour TTL, 15-min response SLA',
  },
};

// Refund Policies
export const REFUND_POLICY = {
  PATIENT_NO_SHOW_PCT: 50,
  PROVIDER_NO_RESPONSE_48H_PCT: 50,
};

// Tier Recycling Order (Starter -> Growth -> Scale -> Premium)
export const TIER_RECYCLING_ORDER: ProviderTier[] = ['STARTER', 'GROWTH', 'SCALE', 'PREMIUM'];
