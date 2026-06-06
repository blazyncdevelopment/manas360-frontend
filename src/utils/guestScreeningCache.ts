import type { ClinicalAssessmentKey } from '../types/patient';
import type { JourneyRecommendationResponse } from '../api/patient';

const CACHED_SCREENING_KEY = 'manas360-guest-clinical-screening-v1';
const CACHED_RESULT_KEY = 'manas360-guest-screening-result-v1';

export type CachedClinicalScreening = {
  type: ClinicalAssessmentKey;
  answers: number[];
};

export type GuestScreeningResultSnapshot = {
  type: ClinicalAssessmentKey;
  totalScore: number;
  severityLevel: string;
  interpretation?: string;
  recommendation?: string;
  nextActions?: string[];
  crisisDetected?: boolean;
  pathway?: string;
  raw?: JourneyRecommendationResponse;
};

export const readCachedClinicalScreening = (): CachedClinicalScreening | null => {
  try {
    const raw = localStorage.getItem(CACHED_SCREENING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedClinicalScreening;
    if (
      (parsed.type === 'PHQ-9' || parsed.type === 'GAD-7') &&
      Array.isArray(parsed.answers) &&
      parsed.answers.every((value) => Number.isFinite(value))
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const writeCachedClinicalScreening = (payload: CachedClinicalScreening): void => {
  try {
    localStorage.setItem(CACHED_SCREENING_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
};

export const readGuestScreeningResult = (): GuestScreeningResultSnapshot | null => {
  try {
    const raw = localStorage.getItem(CACHED_RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestScreeningResultSnapshot;
  } catch {
    return null;
  }
};

export const writeGuestScreeningResult = (snapshot: GuestScreeningResultSnapshot): void => {
  try {
    localStorage.setItem(CACHED_RESULT_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
};

export const clearGuestClinicalScreening = (): void => {
  try {
    localStorage.removeItem(CACHED_SCREENING_KEY);
    localStorage.removeItem(CACHED_RESULT_KEY);
  } catch {
    // ignore
  }
};

export const readScreeningScoreFromResponse = (
  raw: JourneyRecommendationResponse | Record<string, unknown> | null | undefined,
): { type?: string; score?: number; id?: string | null } | null => {
  const payload = (raw as { data?: JourneyRecommendationResponse })?.data ?? raw;
  if (!payload || typeof payload !== 'object') return null;
  const screening =
    (payload as JourneyRecommendationResponse).screening
    ?? (payload as JourneyRecommendationResponse).assessment;
  return screening ?? null;
};
