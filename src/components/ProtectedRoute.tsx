import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasProviderSubmittedOnboarding } from '../lib/providerOnboardingFlow';

type ProtectedRouteProps = {
	children: ReactNode;
	allowedRoles?: Array<
		| 'patient'
		| 'learner'
		| 'therapist'
		| 'psychiatrist'
		| 'psychologist'
		| 'coach'
		| 'admin'
		| 'superadmin'
		| 'clinicaldirector'
		| 'financemanager'
		| 'complianceofficer'
	>;
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
	const { isAuthenticated, loading, user } = useAuth();
	const location = useLocation();
	const userRole = String(user?.role || '').toLowerCase().replace(/_/g, '');
	const isProviderRole = userRole === 'learner' || userRole === 'therapist' || userRole === 'psychiatrist' || userRole === 'psychologist' || userRole === 'coach';

	if (loading) {
		return <div className="p-6 text-center text-slate-600">Checking authentication...</div>;
	}

	if (!isAuthenticated) {
		const redirectPath = `${location.pathname}${location.search}`;
		return <Navigate to="/auth/login" replace state={{ from: redirectPath }} />;
	}

	if (userRole === 'learner' && (location.pathname.startsWith('/provider') || location.pathname.startsWith('/onboarding/provider-setup'))) {
		return <Navigate to="/certifications" replace />;
	}

	if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole as any)) {
		const isAdminRole =
			userRole === 'admin' ||
			userRole === 'superadmin' ||
			userRole === 'clinicaldirector' ||
			userRole === 'financemanager' ||
			userRole === 'complianceofficer';

		const fallback = isAdminRole
			? '/admin-portal/login'
			: userRole === 'learner'
				? '/certifications'
				: userRole === 'psychologist'
					? '/provider/dashboard'
					: userRole === 'psychiatrist'
						? '/provider/dashboard'
						: userRole === 'therapist' || userRole === 'coach'
							? '/provider/dashboard'
							: userRole === 'corporate'
								? '/corporate/dashboard'
								: '/patient/sessions';

		return <Navigate to={fallback} replace />;
	}

	if (isProviderRole) {
		// Learners only need dashboard access — no onboarding steps
		if (userRole === 'learner') {
			return <>{children}</>;
		}

		const subscriptionRoute = '/provider/subscription';
		const onboardingRoute = '/onboarding/provider-setup';
		const verificationRoute = '/provider/verification-pending';
		const verified = Boolean(user?.isTherapistVerified);
		const profileSubmitted = hasProviderSubmittedOnboarding(user);

		// Allow checkout, payment, and legal-acceptance pages through at any stage
		const isPaymentPath = location.pathname.startsWith('/checkout') ||
			location.pathname.startsWith('/universal/checkout') ||
			location.pathname.startsWith('/universal/payment-success') ||
			location.pathname.startsWith('/confirmation') ||
			location.pathname.startsWith('/provider/plans') ||
			location.pathname.startsWith('/provider/payment-callback');

		// Allow /auth/legal-accept through without redirection — if the backend returns
		// LEGAL_REACCEPTANCE_REQUIRED (HTTP 428) during onboarding, the user is sent here.
		// Without this bypass the ProtectedRoute would immediately redirect them back to
		// /onboarding/provider-setup, creating an infinite redirect loop.
		const isLegalAcceptPath = location.pathname.startsWith('/auth/legal-accept');

		if (isPaymentPath || isLegalAcceptPath) return <>{children}</>;

		// Step 1: Platform fee not paid
		if (!user?.platformAccessActive) {
			if (location.pathname !== subscriptionRoute) {
				return <Navigate to={subscriptionRoute} replace />;
			}
			return <>{children}</>;
		}

		// Step 2: Onboarding form not submitted
		if (!profileSubmitted) {
			if (location.pathname !== onboardingRoute) {
				return <Navigate to={onboardingRoute} replace />;
			}
			return <>{children}</>;
		}

		// Step 3: Admin verification pending
		if (!verified) {
			if (location.pathname !== verificationRoute) {
				return <Navigate to={verificationRoute} replace />;
			}
			return <>{children}</>;
		}
	}

	return <>{children}</>;
}
