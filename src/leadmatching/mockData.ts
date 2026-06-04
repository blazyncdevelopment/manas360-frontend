import { PatientProfile, ProviderProfile } from './types';

// Mock Providers
export const MOCK_PROVIDERS: Record<string, ProviderProfile> = {
  // 1. Starter Provider (Basic qualification, no boost)
  starter_therapist: {
    id: 'prov_starter_1',
    name: 'Rohan Sharma',
    specializations: ['depression', 'anxiety'],
    clinicalCategories: {
      depression: { yearsExperience: 2 },
      anxiety: { yearsExperience: 1 },
    },
    certificationStatus: 'BASIC',
    highestQual: 'Bachelor',
    languages: ['en', 'hi'],
    availability: {
      monday: [{ startMinute: 540, endMinute: 720 }], // 9:00 - 12:00
      wednesday: [{ startMinute: 540, endMinute: 720 }],
    },
    therapyModes: ['video', 'chat'],
    sessionDuration: 50,
    averageRating: 4.2,
    completedSessionCount: 15,
    onboardingCompleted: true,
    isVerified: true,
    leadBoostScore: 0,
    tier: 'STARTER',
    nriPoolCertified: false,
    nriTimezoneShifts: [],
  },

  // 2. High-Quality Premium NRI certified Psychiatrist
  premium_psychiatrist: {
    id: 'prov_premium_1',
    name: 'Dr. Akash Dutta',
    specializations: ['depression', 'anxiety', 'PTSD'],
    clinicalCategories: {
      depression: { yearsExperience: 8 },
      anxiety: { yearsExperience: 5 },
      PTSD: { yearsExperience: 10 },
    },
    certificationStatus: 'EXPERT',
    highestQual: 'PhD',
    languages: ['en', 'hi', 'spanish'],
    availability: {
      monday: [{ startMinute: 1020, endMinute: 1200 }], // 17:00 - 20:00 (5 PM - 8 PM)
      tuesday: [{ startMinute: 1020, endMinute: 1200 }],
      thursday: [{ startMinute: 1020, endMinute: 1200 }],
    },
    therapyModes: ['video', 'voice'],
    sessionDuration: 60,
    averageRating: 4.9,
    completedSessionCount: 320,
    onboardingCompleted: true,
    isVerified: true,
    leadBoostScore: 15,
    tier: 'PREMIUM',
    nriPoolCertified: true,
    nriTimezoneShifts: ['US_EST', 'UK', 'SG'],
  },

  // 3. Unverified Provider (Should fail gate checks)
  unverified_therapist: {
    id: 'prov_unverified',
    name: 'Jane Doe',
    specializations: ['depression'],
    clinicalCategories: {
      depression: { yearsExperience: 5 },
    },
    certificationStatus: 'BASIC',
    highestQual: 'Master',
    languages: ['en'],
    availability: {
      monday: [{ startMinute: 600, endMinute: 800 }],
    },
    therapyModes: ['video'],
    sessionDuration: 50,
    averageRating: 4.5,
    completedSessionCount: 40,
    onboardingCompleted: true,
    isVerified: false, // NOT VERIFIED
    leadBoostScore: 0,
    tier: 'GROWTH',
    nriPoolCertified: false,
    nriTimezoneShifts: [],
  },
};

// Mock Patients
export const MOCK_PATIENTS: Record<string, PatientProfile> = {
  // 1. Domestic anxiety / depression patient
  domestic_anxiety_patient: {
    id: 'pat_domestic_1',
    phq9Score: 12, // Moderate depression
    gad7Score: 15, // Severe anxiety
    primaryConcern: 'anxiety',
    secondaryConcerns: ['depression'],
    assessmentDate: '2026-06-03T12:00:00Z',
    preferences: {
      daysOfWeek: [1, 3], // Monday, Wednesday
      timeSlots: [{ startMinute: 600, endMinute: 660 }], // 10:00 - 11:00 AM
      languages: ['hi', 'en'],
      therapyModes: ['video'],
      context: 'Standard',
      timezoneRegion: 'IST',
      providerTypeFilter: 'THERAPIST',
    },
  },

  // 2. NRI Patient based in the US
  nri_us_patient: {
    id: 'pat_nri_1',
    phq9Score: 8,
    gad7Score: 6,
    primaryConcern: 'depression',
    secondaryConcerns: [],
    assessmentDate: '2026-06-03T14:00:00Z',
    preferences: {
      daysOfWeek: [2, 4], // Tuesday, Thursday
      timeSlots: [{ startMinute: 1050, endMinute: 1110 }], // 5:30 - 6:30 PM (overlaps with Dr. Akash Dutta)
      languages: ['en'],
      therapyModes: ['video', 'voice'],
      context: 'Standard',
      timezoneRegion: 'US_EST',
      providerTypeFilter: 'PSYCHOLOGIST',
    },
  },
};
