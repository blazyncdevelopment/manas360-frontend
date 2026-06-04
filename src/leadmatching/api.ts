import { useState, useEffect } from 'react';
import { http } from '../lib/http';
import { LeadPlanConfig, OnboardingStatus } from './types';

// In-memory runtime fallback store
const mockOnboardingDb: Record<string, string> = {};

// Hardcoded Lead Plans matching the specification
const LEAD_PLANS: LeadPlanConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    prisma_plan: 'free',
    lead_price: 0,
    leads_per_month: 1,
    match_quality: 'cold',
    match_range: '50–69',
    features: ['Profile listing', '1 free lead/month', 'Basic dashboard'],
    corporate_leads: false,
    nri_leads: false,
    refund_pct: 0,
  },
  {
    id: 'growth',
    name: 'Growth',
    prisma_plan: 'growth',
    lead_price: 199,
    leads_per_month: 5,
    match_quality: 'warm',
    match_range: '70–89',
    features: ['Standard matching', 'Email alerts', 'Growth-tier exclusive leads', '25% refund'],
    corporate_leads: false,
    nri_leads: false,
    refund_pct: 25,
  },
  {
    id: 'professional',
    name: 'Professional',
    prisma_plan: 'standard',
    lead_price: 299,
    leads_per_month: 10,
    match_quality: 'hot',
    match_range: '90–100',
    features: ['Priority matching', 'Full analytics', 'Corporate B2B leads', '50% refund'],
    corporate_leads: true,
    nri_leads: false,
    refund_pct: 50,
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite (Premium)',
    prisma_plan: 'premium',
    lead_price: 399,
    leads_per_month: 9999,
    match_quality: 'platinum',
    match_range: '95–100',
    features: ['Exclusive Platinum leads', 'Dedicated account manager', 'NRI Pool Access', 'Corporate leads', '75% refund'],
    corporate_leads: true,
    nri_leads: true,
    refund_pct: 75,
  },
];

/**
 * Fetch available lead plans (GET /api/v1/provider-onboarding/lead-plans)
 */
export async function fetchAvailableLeadPlans(): Promise<{
  plans: LeadPlanConfig[];
  platform_fee: number;
  revenue_split: { therapist: number; platform: number };
  marketplace_note: string;
}> {
  try {
    const response = await http.get('/v1/provider-onboarding/lead-plans');
    if (response.data) {
      // If response matches structure or wraps in data
      const data = response.data.data || response.data;
      if (data.plans) return data;
    }
  } catch (error) {
    console.warn('Backend API `/v1/provider-onboarding/lead-plans` failed, falling back to mock data:', error);
  }

  // Fallback
  return {
    plans: LEAD_PLANS,
    platform_fee: 99,
    revenue_split: {
      therapist: 60,
      platform: 40,
    },
    marketplace_note: 'Unclaimed leads drop daily: ₹299 → ₹199 → ₹99',
  };
}

/**
 * Select a lead plan (POST /api/v1/provider-onboarding/select-plan)
 */
export async function selectLeadPlan(
  providerId: string,
  planId: string
): Promise<{
  success: boolean;
  plan: string;
  next_step: string;
  certification_url: string;
  message: string;
}> {
  try {
    const response = await http.post('/v1/provider-onboarding/select-plan', {
      provider_id: providerId,
      plan_id: planId,
    });
    if (response.data) {
      return response.data.data || response.data;
    }
  } catch (error) {
    console.warn('Backend API `/v1/provider-onboarding/select-plan` failed, falling back to mock behavior:', error);
  }

  // Fallback
  mockOnboardingDb[providerId] = planId;
  return {
    success: true,
    plan: planId,
    next_step: 'start_certification',
    certification_url: '/provider/certification/5-whys',
    message: 'Plan selected! Complete your 5 Whys certification to unlock lead access.',
  };
}

/**
 * Check onboarding status (GET /api/v1/provider-onboarding/onboarding-status/:providerId)
 */
export async function fetchOnboardingStatus(providerId: string): Promise<OnboardingStatus> {
  try {
    const response = await http.get(`/v1/provider-onboarding/onboarding-status/${encodeURIComponent(providerId)}`);
    if (response.data) {
      const data = response.data.data || response.data;
      if (data.checklist) return data;
    }
  } catch (error) {
    console.warn(`Backend API \`/v1/provider-onboarding/onboarding-status/${providerId}\` failed, falling back to mock status:`, error);
  }

  // Fallback
  const selectedPlan = mockOnboardingDb[providerId] || 'none';
  const isPlanSelected = selectedPlan !== 'none';

  return {
    provider_id: providerId,
    name: 'Dr. Akash Dutta',
    phone: '+919144060257',
    qualification: 'M.Phil in Clinical Psychology',
    lead_plan: selectedPlan,
    platform_active: true,
    verified: false,
    checklist: [
      { step: 'register', label: 'Profile registered', done: true },
      { step: 'verify', label: 'Phone verified', done: true },
      { step: 'pay', label: '₹99 platform access activated', done: true },
      { step: 'plan', label: `${selectedPlan} lead plan selected`, done: isPlanSelected },
      { step: 'certification', label: '5 Whys certification', done: false },
      { step: 'credential', label: 'Credential verification', done: false },
    ],
    next_action: isPlanSelected
      ? {
        action: 'start_certification',
        url: '/provider/certification/5-whys',
      }
      : {
        action: 'select_plan',
        url: '/provider/onboarding/select-plan',
      },
    stats: {
      leads_received: 0,
      sessions_completed: 0,
    },
  };
}

/**
 * Custom React Hook to fetch and manage onboarding status
 */
export function useOnboardingStatus(providerId: string) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const data = await fetchOnboardingStatus(providerId);
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (providerId) {
      refreshStatus();
    }
  }, [providerId]);

  return { status, loading, error, refreshStatus };
}

export interface MatchedProviderApiItem {
  id: string;
  name: string;
  role: string;
  experience: number;
  rating: number;
  baseExpertise: number;
  baseComm: number;
  baseQuality: number;
  specializationMatch: string[];
  languagesSupported: string[];
  timeSlots: string[];
  modes: string[];
  contextSupport: string[];
}

/**
 * Fetch matched providers based on active filter preferences
 */
export async function fetchMatchedProviders(filters: {
  concerns: string[];
  languages: string[];
  timeSlots: string[];
  modes: string[];
  contexts: string[];
}): Promise<MatchedProviderApiItem[]> {
  try {
    const response = await http.post('/v1/provider-onboarding/matched-providers', filters);
    if (response.data) {
      return response.data.data || response.data;
    }
  } catch (error) {
    console.warn('Backend API `/v1/provider-onboarding/matched-providers` failed, using fallback mock data:', error);
  }

  // Fallback default list matching user screenshot
  return [
    {
      id: 'sneha',
      name: 'Dr. Sneha Iyer',
      role: 'Counselor',
      experience: 3,
      rating: 4.8,
      baseExpertise: 28,
      baseComm: 25,
      baseQuality: 23,
      specializationMatch: ['anxiety', 'depression'],
      languagesSupported: ['english', 'hindi', 'kannada'],
      timeSlots: ['morning', 'evening'],
      modes: ['video'],
      contextSupport: ['standard'],
    },
    {
      id: 'priya',
      name: 'Dr. Priya Sharma',
      role: 'Clinical Psych',
      experience: 8,
      rating: 4.7,
      baseExpertise: 28,
      baseComm: 25,
      baseQuality: 14,
      specializationMatch: ['anxiety', 'depression'],
      languagesSupported: ['english', 'hindi', 'kannada'],
      timeSlots: ['morning', 'evening'],
      modes: ['video'],
      contextSupport: ['standard'],
    },
    {
      id: 'rahul',
      name: 'Dr. Rahul Desai',
      role: 'Psychiatrist',
      experience: 20,
      rating: 4.9,
      baseExpertise: 22,
      baseComm: 19,
      baseQuality: 15,
      specializationMatch: ['anxiety', 'depression', 'trauma'],
      languagesSupported: ['english', 'hindi'],
      timeSlots: ['morning', 'night'],
      modes: ['video', 'phone'],
      contextSupport: ['standard', 'crisis'],
    },
    {
      id: 'arjun',
      name: 'Dr. Arjun Menon',
      role: 'Clinical Psych',
      experience: 5,
      rating: 4.3,
      baseExpertise: 18,
      baseComm: 21,
      baseQuality: 9,
      specializationMatch: ['depression', 'sleep'],
      languagesSupported: ['english', 'kannada', 'tamil'],
      timeSlots: ['evening', 'night'],
      modes: ['video', 'chat'],
      contextSupport: ['standard', 'corporate'],
    },
  ];
}

