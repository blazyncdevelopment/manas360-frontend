# Leads Matching System - Module Files

This folder contains the complete schemas, matching scoring algorithm, configuration constants, mock API client, and high-fidelity React UI components for the **Leads Matching System**. These files are fully self-contained and ready for integration.

## File Reference

1. **[types.ts](file:///c:/Users/pc/Desktop/Manas%20360/manas360-frontend/src/leadmatching/types.ts)**: Core type and interface definitions representing:
   - `Lead`, `ProviderProfile`, and `PatientProfile` schemas.
   - Lead plan configs and onboarding status trackers.
   - Time Slots, contexts, status states, and bands.

2. **[constants.ts](file:///c:/Users/pc/Desktop/Manas%20360/manas360-frontend/src/leadmatching/constants.ts)**: Match system configuration parameters:
   - Scoring component weights (Expertise 40%, Comm 30%, Quality 30%).
   - Price schedules per band (COLD = Rs. 0, WARM = Rs. 199, HOT = Rs. 299, PLATINUM = Rs. 399).
   - Context variations (Night +20% price / 12h TTL, Crisis +50% price / 2h TTL / 15-min response SLA).
   - Qualifications base scores and certification multipliers.

3. **[scoring.ts](file:///c:/Users/pc/Desktop/Manas%20360/manas360-frontend/src/leadmatching/scoring.ts)**: Complete matching engine logic:
   - `calculateLeadScore(patient, provider)`: Weighs and sums the Expertise, Communication, and Quality parameters.
   - Critical gates validation (excludes un-onboarded, unverified, zero availability overlap, or non-matching languages).
   - NRI pool checks (checks if patient timezone is non-IST and provider is NRI certified and matches the shift).
   - Match band and price calculation.

4. **[api.ts](file:///c:/Users/pc/Desktop/Manas%20360/manas360-frontend/src/leadmatching/api.ts)**: Onboarding mock services:
   - `fetchAvailableLeadPlans()`
   - `selectLeadPlan(providerId, planId)`
   - `fetchOnboardingStatus(providerId)`
   - `useOnboardingStatus(providerId)` React Hook for easy component integrations.

5. **[LeadPlansPage.tsx](file:///c:/Users/pc/Desktop/Manas%20360/manas360-frontend/src/leadmatching/LeadPlansPage.tsx)**: Premium, interactive onboarding page component for selecting a subscription tier, displaying revenue split models, platform fee highlights, and pricing drops.

6. **[OnboardingStatusPage.tsx](file:///c:/Users/pc/Desktop/Manas%20360/manas360-frontend/src/leadmatching/OnboardingStatusPage.tsx)**: Onboarding status dashboard displaying checklist steps (Verified, Paid, Select Plan, Quiz Certification, Credentials verification) and clear next-action buttons.

7. **[mockData.ts](file:///c:/Users/pc/Desktop/Manas%20360/manas360-frontend/src/leadmatching/mockData.ts)**: Test profiles for providers (Starter, Premium NRI, Unverified) and patients.

8. **[testScoring.ts](file:///c:/Users/pc/Desktop/Manas%20360/manas360-frontend/src/leadmatching/testScoring.ts)**: Test runner script validating the rules.

## Execution and Testing

To execute and verify the matching algorithm logic directly from terminal, run:

```bash
npx tsx src/leadmatching/testScoring.ts
```
