import type { AuthUser } from '../api/auth';
import { isFeeVerifiedFlagSet, isOnboardingSubmittedFlagSet } from '../utils/providerOnboardingStorage';

const providerUserKey = (user: AuthUser): string =>
	String(user.id || user.phone || user.email || '').trim();

/**
 * Describes the current position in the provider onboarding journey.
 *
 * Steps (in order):
 *  'otp'          → not yet authenticated
 *  'subscription' → authenticated but platform fee not paid
 *  'callback'     → payment initiated, awaiting callback verification
 *  'setup'        → fee paid, profile setup required
 *  'pending'      → setup submitted, awaiting admin verification
 *  'dashboard'    → fully onboarded
 */
export type ProviderFlowStep =
	| 'otp'
	| 'subscription'
	| 'callback'
	| 'setup'
	| 'pending'
	| 'dashboard';

const PROVIDER_ROLES = new Set(['therapist', 'psychiatrist', 'psychologist', 'coach']);

export const isProviderOnboardingRole = (role: unknown): boolean =>
	PROVIDER_ROLES.has(String(role || '').toLowerCase());

/**
 * True only after the 7-step profile form was submitted (POST /v1/provider/onboarding).
 * Do not treat bare onboardingStatus "PENDING" as submitted — the API may return PENDING
 * right after platform fee payment before the profile form is filled.
 */
export const hasProviderSubmittedOnboarding = (user: AuthUser | null | undefined): boolean => {
	if (!user) return false;

	const status = String(user.onboardingStatus || '').toUpperCase();
	if (status === 'REJECTED') return false;

	if (user.providerOnboardingCompleted === true) return true;

	const key = providerUserKey(user);
	if (key && isOnboardingSubmittedFlagSet(key)) return true;

	if (status === 'COMPLETED') return true;

	return false;
};

/** Platform fee paid but the 7-step form is not yet submitted. */
export const needsProviderOnboardingForm = (user: AuthUser | null | undefined): boolean => {
	if (!user || !isProviderOnboardingRole(user.role)) return false;
	if (!user.platformAccessActive && !isFeeVerifiedFlagSet()) return false;
	return !hasProviderSubmittedOnboarding(user);
};

/**
 * Resolves the current step in the provider onboarding flow based on the
 * authenticated user's state. This is the single source of truth for navigation.
 *
 * The `feeVerifiedFlagCheck` is consulted when `platformAccessActive` is not
 * yet set by the backend (slow webhook case) — so the user can proceed to
 * profile setup anyway.
 */
export const resolveProviderFlowStep = (
	user: AuthUser | null | undefined,
): ProviderFlowStep => {
	if (!user) return 'otp';

	const role = String(user.role || '').toLowerCase();
	if (!PROVIDER_ROLES.has(role)) return 'dashboard';

	// Fee not paid and the optimistic flag is also not set
	if (!user.platformAccessActive && !isFeeVerifiedFlagSet()) {
		return 'subscription';
	}

	// Fee paid (or optimistically flagged) → profile setup until form is submitted
	if (needsProviderOnboardingForm(user)) {
		return 'setup';
	}

	// Profile submitted → waiting for admin verification
	if (!user.isTherapistVerified) {
		return 'pending';
	}

	return 'dashboard';
};

/**
 * Maps a flow step to its canonical route path.
 */
export const getRouteForProviderStep = (step: ProviderFlowStep): string => {
	switch (step) {
		case 'otp':
			return '/auth/login?role=therapist';
		case 'subscription':
			return '/provider/subscription';
		case 'callback':
			return '/provider/payment-callback';
		case 'setup':
			return '/onboarding/provider-setup';
		case 'pending':
			return '/provider/verification-pending';
		case 'dashboard':
		default:
			return '/provider/dashboard';
	}
};

/**
 * Convenience helper — resolves the next route for the current user.
 */
export const getNextProviderRoute = (user: AuthUser | null | undefined): string =>
	getRouteForProviderStep(resolveProviderFlowStep(user));
