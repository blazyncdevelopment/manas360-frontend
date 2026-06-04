import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, signupWithPhone, verifyPhoneSignupOtp } from '../../api/auth';
import { clearGuestClinicalScreening, readCachedClinicalScreening } from '../../utils/guestScreeningCache';
import { patientApi } from '../../api/patient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { getPostLoginRoute, hasCorporateAccess, useAuth } from '../../context/AuthContext';

type SignupRole = 'patient' | 'therapist' | 'psychiatrist' | 'psychologist' | 'coach';

const VALID_SIGNUP_ROLES = new Set<SignupRole>(['patient', 'therapist', 'psychiatrist', 'psychologist', 'coach']);

const resolveSignupRole = (candidate: unknown): SignupRole | null => {
	if (typeof candidate !== 'string') {
		return null;
	}

	const normalized = candidate.trim().toLowerCase();
	return VALID_SIGNUP_ROLES.has(normalized as SignupRole) ? (normalized as SignupRole) : null;
};

const inferSignupRoleFromPath = (path: string | null | undefined): SignupRole | null => {
	const normalizedPath = String(path || '').trim().toLowerCase();
	if (!normalizedPath) {
		return null;
	}

	if (normalizedPath.startsWith('/psychiatrist')) return 'psychiatrist';
	if (normalizedPath.startsWith('/psychologist')) return 'psychologist';
	if (normalizedPath.startsWith('/coach')) return 'coach';
	if (normalizedPath.startsWith('/therapist') || normalizedPath.startsWith('/provider')) return 'therapist';

	return null;
};

const isSubscriptionActive = (subscription: any): boolean => {
	if (!subscription) return false;

	const status = String(subscription?.status || '').toLowerCase();
	if (status === 'active' || status === 'trialing') return true;
	if (subscription?.isActive === true || subscription?.active === true) return true;

	return false;
};

export default function LoginPage() {
	const { user, isAuthenticated, syncSessionAfterOtp } = useAuth();
	const navigate = useNavigate();
	const isCompletingLoginRef = useRef(false);
	const location = useLocation();
	const locationState = location.state as { from?: string; afterLogin?: string; role?: SignupRole } | null;
	const from = locationState?.from;
	const afterLogin = locationState?.afterLogin;
	const next = new URLSearchParams(location.search).get('next');
	const signupRoleFromQuery = resolveSignupRole(new URLSearchParams(location.search).get('role'));
	const signupRoleFromState = resolveSignupRole(locationState?.role);
	const signupRoleFromPath = inferSignupRoleFromPath(from || afterLogin || next);
	const signupRole = signupRoleFromState || signupRoleFromQuery || signupRoleFromPath;

	const [phone, setPhone] = useState('');
	const [otp, setOtp] = useState('');
	const [otpSent, setOtpSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [devOtp, setDevOtp] = useState<string | null>(null);

	const resolvePostLoginRouteWithSubscription = async (candidate: string | null, role: string | undefined, userOverride?: any) => {
		const effectiveUser = userOverride || user;

		if (hasCorporateAccess(effectiveUser)) {
			return '/corporate/dashboard';
		}

		if (!candidate || candidate.startsWith('/auth/')) {
			return getPostLoginRoute(effectiveUser);
		}

		const normalizedRole = String(role || '').toLowerCase();
		if (normalizedRole === 'learner') {
			return '/provider/dashboard';
		}
		const isPricingTarget = candidate.startsWith('/plans');
		if (normalizedRole !== 'patient' || !isPricingTarget) {
			return candidate;
		}

		try {
			const subscriptionResponse = await patientApi.getSubscription();
			const subscriptionPayload = (subscriptionResponse as any)?.data ?? subscriptionResponse;
			if (isSubscriptionActive(subscriptionPayload)) {
				return '/patient/dashboard';
			}
		} catch {
			// Keep original target when subscription lookup fails.
		}

		return candidate;
	};

	useEffect(() => {
		if (!isAuthenticated || !user || isCompletingLoginRef.current) {
			return;
		}

		const candidate = from || afterLogin || next || null;
		void (async () => {
			const postLoginRoute = await resolvePostLoginRouteWithSubscription(candidate, user.role, user);
			navigate(postLoginRoute, { replace: true });
		})();
	}, [afterLogin, from, isAuthenticated, navigate, next, user]);

	const requestOtp = async () => {
		setError(null);
		setLoading(true);
		try {
			const res = await signupWithPhone(phone.trim());
			setOtpSent(true);
			if (res?.devOtp) {
				setDevOtp(res.devOtp);
				setOtp(res.devOtp);
				console.log('[DEV] OTP:', res.devOtp);
			}
		} catch (err) {
			setError(getApiErrorMessage(err, 'Failed to send OTP'));
		} finally {
			setLoading(false);
		}
	};

	const verifyOtp = async () => {
		setError(null);
		setLoading(true);
		isCompletingLoginRef.current = true;
		try {
			const guestGameToken = localStorage.getItem('guest_game_token') || undefined;
			const cachedScreening = readCachedClinicalScreening();
			const result = await verifyPhoneSignupOtp(phone.trim(), otp.trim(), {
				acceptedTerms: true,
				...(cachedScreening ? {
					clinicalScreening: {
						type: cachedScreening.type,
						answers: cachedScreening.answers,
					},
				} : {}),
			}, guestGameToken);
			if (guestGameToken) {
				localStorage.removeItem('guest_game_token');
			}
			if (cachedScreening) {
				clearGuestClinicalScreening();
			}

			const resolvedUser = await syncSessionAfterOtp(result.user);

			// Check corporate access first - corporate admins bypass subscription checks
			if (hasCorporateAccess(resolvedUser)) {
				navigate('/corporate/dashboard', { replace: true });
				return;
			}
			
			// Redirect patients without subscription to plans
			if ((resolvedUser as any)?.requiresSubscription) {
				let hasActiveSubscription = false;
				try {
					const subscriptionResponse = await patientApi.getSubscription();
					const subscriptionPayload = (subscriptionResponse as any)?.data ?? subscriptionResponse;
					hasActiveSubscription = isSubscriptionActive(subscriptionPayload);
				} catch {
					hasActiveSubscription = false;
				}

				if (hasActiveSubscription) {
					const candidate = from || afterLogin || next || null;
					const postLoginRoute = await resolvePostLoginRouteWithSubscription(candidate, resolvedUser?.role, resolvedUser);
					navigate(postLoginRoute, { replace: true });
					return;
				}

				const candidate = from || afterLogin || next || null;
				const returnTo = candidate || '/';
				navigate(`/plans?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
				return;
			}
			const candidate = from || afterLogin || next || null;
			const postLoginRoute = await resolvePostLoginRouteWithSubscription(candidate, resolvedUser?.role, resolvedUser);
			navigate(postLoginRoute, { replace: true });
		} catch (err: any) {
			console.error('[LOGIN] verifyOtp error:', err?.response?.status, JSON.stringify(err?.response?.data));
			const message = String(err?.response?.data?.message || '');
			if (Number(err?.response?.status) === 422 && message.toLowerCase().includes('accept terms')) {
				const returnToCandidate = from || afterLogin || next || '/certifications';
				const searchParams = new URLSearchParams({ phone: phone.trim() });
				searchParams.set('returnTo', returnToCandidate);
				searchParams.set('reason', 'terms');
				const requestedUserType = new URLSearchParams(location.search).get('userType');
				if (requestedUserType) {
					searchParams.set('userType', requestedUserType);
				}
				if (signupRole) {
					searchParams.set('role', signupRole);
				}
				navigate(`/auth/signup?${searchParams.toString()}`, {
					replace: true,
					state: {
						from,
						afterLogin,
						role: signupRole,
					},
				});
				return;
			}
			setError(getApiErrorMessage(err, 'OTP verification failed'));
		} finally {
			isCompletingLoginRef.current = false;
			setLoading(false);
		}
	};

	return (
		<div className="bg-clean min-h-screen">
			<div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
				<div className="grid w-full items-stretch gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
					<section className="hidden lg:flex lg:flex-col lg:justify-center lg:animate-fadeIn">
						<blockquote className="max-w-2xl font-display text-4xl font-light leading-[1.15] sm:text-5xl lg:text-6xl" style={{ color: 'var(--color-ink)' }}>
							You&rsquo;re <span className="font-semibold text-sky">not alone</span>.
							<br />
							<span className="mt-2 inline-block">
								Let&rsquo;s take this <span className="font-semibold text-olive">together</span>.
							</span>
						</blockquote>
						<p className="mt-8 max-w-sm text-base italic text-muted animate-fadeInUp">Choose growth, one step at a time.</p>
					</section>

					<section className="card card-flat mx-auto w-full max-w-lg justify-self-center p-5 sm:p-8 lg:justify-self-end lg:animate-scaleIn">
						<h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl" style={{ color: 'var(--color-ink)' }}>Welcome back</h1>
						<p className="mt-2 text-sm text-muted sm:text-base">Continue your wellness journey</p>

						<div className="mt-6 space-y-4">
							<Input
								id="login-phone"
								label="Phone Number"
								type="tel"
								autoComplete="tel"
								placeholder="+919876543210"
								helperText="Use your phone number to continue"
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
								required
							/>

							{otpSent ? (
								<>
									<Input
										id="login-otp"
										label="One-Time Code"
										inputMode="numeric"
										pattern="\\d{4}"
										maxLength={4}
										autoComplete="one-time-code"
										placeholder="4-digit OTP"
										helperText="Check your WhatsApp for the OTP"
										value={otp}
										onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
										required
									/>
									{devOtp && (
										<div className="flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm">
											<span className="font-mono font-bold text-yellow-800">🔑 Dev OTP: {devOtp}</span>
											<button
												type="button"
												onClick={() => setDevOtp(null)}
												className="ml-3 text-yellow-600 hover:text-yellow-900 text-xs underline"
											>
												Hide
											</button>
										</div>
									)}
								</>
							) : null}

							{!otpSent ? (
								<Button
									type="button"
									fullWidth
									loading={loading}
									className="btn btn-primary btn-lg w-full !rounded-lg !bg-[var(--brand-navy)] hover:!bg-[var(--brand-navy-hover)]"
									onClick={requestOtp}
								>
									{loading ? 'Preparing...' : 'Continue'}
								</Button>
							) : (
								<Button
									type="button"
									fullWidth
									loading={loading}
									className="btn btn-primary btn-lg w-full !rounded-lg !bg-[var(--brand-navy)] hover:!bg-[var(--brand-navy-hover)]"
									onClick={verifyOtp}
								>
									{loading ? 'Verifying...' : 'Continue to wellness'}
								</Button>
							)}
						</div>

						<p className="callout callout-navy mt-3 text-xs font-medium">
							🔒 Your data is secure and confidential.
						</p>

						{error ? (
							<p role="alert" aria-live="polite" className="mt-3 text-sm text-error">
								{error}
							</p>
						) : null}

						<p className="mt-4 text-center text-sm text-muted">
							Need to create an account?{' '}
							<Link
								to={signupRole ? `/auth/signup?role=${encodeURIComponent(signupRole)}` : '/auth/signup'}
								state={signupRole ? { role: signupRole } : undefined}
								className="font-semibold text-sky underline underline-offset-4 transition-colors duration-150 hover:text-[var(--brand-sky-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]/35 focus-visible:ring-offset-2"
							>
								Register here
							</Link>
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}
