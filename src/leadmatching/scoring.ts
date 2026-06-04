import {
  PatientProfile,
  ProviderProfile,
  LeadBand,
  ProviderTier,
  LeadContext,
  TimeSlot,
} from './types';
import {
  SCORE_WEIGHTS,
  QUALIFICATION_BASE_SCORES,
  CERTIFICATION_MULTIPLIERS,
  MATCH_BANDS,
  CONTEXT_VARIATIONS,
} from './constants';

// Helper to convert patient day integer (1-7, 1=Monday) to string key
const DAY_MAP: Record<number, string> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  7: 'sunday',
};

/**
 * Checks if two time slots overlap.
 */
export function doSlotsOverlap(slotA: TimeSlot, slotB: TimeSlot): boolean {
  return Math.max(slotA.startMinute, slotB.startMinute) < Math.min(slotA.endMinute, slotB.endMinute);
}

/**
 * Checks if there is at least one availability overlap between patient and provider.
 */
export function checkAvailabilityOverlap(patient: PatientProfile, provider: ProviderProfile): boolean {
  const patientDays = patient.preferences.daysOfWeek;
  const patientSlots = patient.preferences.timeSlots;

  if (!patientDays || patientDays.length === 0 || !patientSlots || patientSlots.length === 0) {
    return false;
  }

  for (const dayNum of patientDays) {
    const dayKey = DAY_MAP[dayNum];
    if (!dayKey) continue;

    const providerSlots = provider.availability[dayKey];
    if (!providerSlots || providerSlots.length === 0) continue;

    for (const pSlot of patientSlots) {
      for (const provSlot of providerSlots) {
        if (doSlotsOverlap(pSlot, provSlot)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Checks if provider qualifies for NRI pool.
 */
export function hasNriProviderCapability(provider: ProviderProfile, timezoneRegion: string): boolean {
  if (!provider.nriPoolCertified) return false;
  return provider.nriTimezoneShifts.includes(timezoneRegion as any);
}

/**
 * Calculates EXPERTISE SCORE (40% weight)
 * - Specialization overlap with patient's concerns: +15 points per match
 * - Years of experience in relevant clinical categories: +5 points per year
 * - Highest qualification base score
 * - Certification level multiplier
 * - Formula: Sums all components, capped at 100
 */
export function calculateExpertiseScore(patient: PatientProfile, provider: ProviderProfile): number {
  const baseScore = QUALIFICATION_BASE_SCORES[provider.highestQual] || 40;

  // Specialization overlap
  const patientConcerns = [patient.primaryConcern, ...patient.secondaryConcerns];
  let specializationOverlapCount = 0;
  let experiencePoints = 0;

  if (provider.specializations) {
    specializationOverlapCount = patientConcerns.filter((c) =>
      provider.specializations.includes(c)
    ).length;
  }

  // Clinical category experience points
  if (provider.clinicalCategories) {
    patientConcerns.forEach((concern) => {
      const category = provider.clinicalCategories[concern];
      if (category) {
        experiencePoints += category.yearsExperience * 5;
      }
    });
  }

  const overlapPoints = specializationOverlapCount * 15;
  const rawSum = baseScore + overlapPoints + experiencePoints;

  const multiplier = CERTIFICATION_MULTIPLIERS[provider.certificationStatus] || 1.0;
  const finalExpertise = rawSum * multiplier;

  return Math.min(finalExpertise, 100);
}

/**
 * Calculates COMMUNICATION SCORE (30% weight)
 * - Language match (critical filter - must have >=1 language overlap)
 * - Availability overlap (critical filter - must have >=1 time slot overlap)
 * - Therapy modes match (video/voice/chat)
 * - Session duration preference match
 * - All components weighted equally (25% each), summed to 0-100
 */
export function calculateCommunicationScore(patient: PatientProfile, provider: ProviderProfile): number {
  // 1. Language overlap (Critical Filter)
  const patientLanguages = patient.preferences.languages || [];
  const providerLanguages = provider.languages || [];
  const languageOverlap = patientLanguages.filter((l) => providerLanguages.includes(l));

  if (languageOverlap.length === 0) {
    return 0; // Will trigger exclusion/filter later, score is 0
  }
  const languageScore = Math.min((languageOverlap.length / Math.max(patientLanguages.length, 1)) * 100, 100);

  // 2. Availability overlap (Critical Filter)
  const availabilityOverlap = checkAvailabilityOverlap(patient, provider);
  if (!availabilityOverlap) {
    return 0; // Critical filter failure
  }
  const availabilityScore = 100;

  // 3. Therapy modes overlap
  const patientModes = patient.preferences.therapyModes || [];
  const providerModes = provider.therapyModes || [];
  const modeOverlap = patientModes.filter((m) => providerModes.includes(m));
  const modeScore = patientModes.length > 0
    ? Math.min((modeOverlap.length / patientModes.length) * 100, 100)
    : 100;

  // 4. Session duration preference match (e.g. if close to standard provider duration)
  // Let's say if patient is seeking default (e.g. standard 50-60 mins), and provider does >= 45 mins, it's a match
  const durationScore = provider.sessionDuration >= 45 ? 100 : 70;

  // Sum components, weighted equally
  const totalCommScore = (languageScore + availabilityScore + modeScore + durationScore) / 4;
  return Math.round(totalCommScore);
}

/**
 * Calculates QUALITY SCORE (30% weight)
 * - Average rating (0-5 -> normalized to 0-100)
 * - Onboarding completed (gate: must be true, else quality score = 0)
 * - Provider verified by platform (gate: must be true, else quality score = 0)
 * - Admin boost applied (0-20 manual points)
 * - Completed session count (experience multiplier, caps at 1.2x)
 */
export function calculateQualityScore(provider: ProviderProfile): number {
  // GATES: Onboarding and Verification
  if (!provider.onboardingCompleted || !provider.isVerified) {
    return 0;
  }

  // Normalized rating
  const normalizedRating = provider.averageRating * 20; // 5 -> 100

  // Admin boost
  const boost = Math.min(Math.max(provider.leadBoostScore, 0), 20);

  // Experience multiplier (1.0 to 1.2 depending on completed session count)
  // Let's say +0.01 per 10 sessions, capping at +0.20 (200 sessions)
  const sessionMultiplier = 1.0 + Math.min(provider.completedSessionCount / 1000, 0.2);

  const baseQuality = normalizedRating + boost;
  const finalQuality = baseQuality * sessionMultiplier;

  return Math.min(finalQuality, 100);
}

/**
 * Calculates final score and details.
 * FINAL SCORE = (expertise x 0.40) + (communication x 0.30) + (quality x 0.30)
 */
export function calculateLeadScore(patient: PatientProfile, provider: ProviderProfile): {
  finalScore: number;
  expertiseScore: number;
  communicationScore: number;
  qualityScore: number;
  isEligible: boolean;
  exclusionReason?: string;
} {
  // Verification/Onboarding Gate
  if (!provider.isVerified) {
    return { finalScore: 0, expertiseScore: 0, communicationScore: 0, qualityScore: 0, isEligible: false, exclusionReason: 'Provider is not verified' };
  }
  if (!provider.onboardingCompleted) {
    return { finalScore: 0, expertiseScore: 0, communicationScore: 0, qualityScore: 0, isEligible: false, exclusionReason: 'Provider onboarding is not completed' };
  }

  // Language overlap Gate
  const patientLanguages = patient.preferences.languages || [];
  const providerLanguages = provider.languages || [];
  const hasLangOverlap = patientLanguages.some((l) => providerLanguages.includes(l));
  if (!hasLangOverlap) {
    return { finalScore: 0, expertiseScore: 0, communicationScore: 0, qualityScore: 0, isEligible: false, exclusionReason: 'No language overlap' };
  }

  // Availability overlap Gate
  const hasAvailOverlap = checkAvailabilityOverlap(patient, provider);
  if (!hasAvailOverlap) {
    return { finalScore: 0, expertiseScore: 0, communicationScore: 0, qualityScore: 0, isEligible: false, exclusionReason: 'No availability overlap' };
  }

  // NRI specific checks if timezone is non-Indian
  const isNriPatient = patient.preferences.timezoneRegion !== 'IST';
  if (isNriPatient) {
    const isNriEligible = hasNriProviderCapability(provider, patient.preferences.timezoneRegion);
    if (!isNriEligible) {
      return { finalScore: 0, expertiseScore: 0, communicationScore: 0, qualityScore: 0, isEligible: false, exclusionReason: 'Not NRI certified or timezone mismatch' };
    }
  }

  // Calculate components
  const expertiseScore = calculateExpertiseScore(patient, provider);
  const communicationScore = calculateCommunicationScore(patient, provider);
  const qualityScore = calculateQualityScore(provider);

  const finalScore = Math.round(
    expertiseScore * SCORE_WEIGHTS.EXPERTISE +
    communicationScore * SCORE_WEIGHTS.COMMUNICATION +
    qualityScore * SCORE_WEIGHTS.QUALITY
  );

  const cappedScore = Math.min(finalScore, 100);
  const isEligible = cappedScore >= 50;

  return {
    finalScore: cappedScore,
    expertiseScore,
    communicationScore,
    qualityScore,
    isEligible,
    exclusionReason: isEligible ? undefined : 'Score falls in EXCLUDED band (<50)',
  };
}

/**
 * Maps a score to its corresponding Match Band.
 */
export function getMatchBand(score: number): LeadBand {
  if (score >= 95) return 'PLATINUM';
  if (score >= 80) return 'HOT';
  if (score >= 65) return 'WARM';
  if (score >= 50) return 'COLD';
  return 'EXCLUDED';
}

/**
 * Returns which provider subscription tiers are allowed to see a lead of a given score.
 */
export function getLeadVisibilityTiers(matchScore: number): ProviderTier[] {
  const band = getMatchBand(matchScore);
  return MATCH_BANDS[band].visibleTo;
}

/**
 * Calculates lead price based on band and context variation.
 */
export function calculateLeadPrice(matchScore: number, context: LeadContext): number {
  const band = getMatchBand(matchScore);
  const basePrice = MATCH_BANDS[band].price;
  const contextConfig = CONTEXT_VARIATIONS[context];
  
  if (!contextConfig) return basePrice;
  return Math.round(basePrice * contextConfig.priceMultiplier);
}
