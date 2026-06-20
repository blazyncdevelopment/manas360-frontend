import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, signupWithPhone, verifyPhoneSignupOtp } from '../../api/auth';
import { resolveProviderIdForOnboarding } from '../../api/providerOnboarding';
import { clearGuestClinicalScreening, readCachedClinicalScreening } from '../../utils/guestScreeningCache';
import { patientApi } from '../../api/patient';
import Button from '../../components/ui/Button';

import PhoneInput from '../../components/ui/PhoneInput';
import OtpInput from '../../components/ui/OtpInput';
import { getPostLoginRoute, hasCorporateAccess, useAuth } from '../../context/AuthContext';
import { hasActivePaidPatientSubscription } from '../../lib/patientSubscriptionFlow';
import type { AuthUser } from '../../api/auth';

type SignupRole = 'patient' | 'therapist' | 'psychiatrist' | 'psychologist' | 'coach';
type LoginMode = 'standard' | 'corporate';

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
	if (!normalizedPath) return null;
	if (normalizedPath.startsWith('/psychiatrist')) return 'psychiatrist';
	if (normalizedPath.startsWith('/psychologist')) return 'psychologist';
	if (normalizedPath.startsWith('/coach')) return 'coach';
	if (normalizedPath.startsWith('/therapist') || normalizedPath.startsWith('/provider')) return 'therapist';
	return null;
};

const isProviderAuthRole = (role: SignupRole | string | null): boolean => (
	role === 'therapist' || role === 'psychiatrist' || role === 'psychologist' || role === 'coach'
);

export default function LoginPage() {
	const { user, isAuthenticated, syncSessionAfterOtp } = useAuth();
	const navigate = useNavigate();
	const isCompletingLoginRef = useRef(false);
	const location = useLocation();
	const locationState = location.state as { from?: string; afterLogin?: string; role?: SignupRole } | null;
	const from = locationState?.from;
	const afterLogin = locationState?.afterLogin;
	const next = new URLSearchParams(location.search).get('next');
	const loginSearchParams = new URLSearchParams(location.search);
	const signupRoleFromQuery = resolveSignupRole(loginSearchParams.get('role'));
	const signupRoleFromUserType = resolveSignupRole(loginSearchParams.get('userType'));
	const signupRoleFromState = resolveSignupRole(locationState?.role);
	const signupRoleFromPath = inferSignupRoleFromPath(from || afterLogin || next);
	const signupRole = signupRoleFromState || signupRoleFromQuery || signupRoleFromUserType || signupRoleFromPath;
	const isProviderLogin = isProviderAuthRole(signupRole);

	const modeParam = loginSearchParams.get('mode');
	const [loginMode, setLoginMode] = useState<LoginMode>(modeParam === 'corporate' ? 'corporate' : 'standard');

	// Standard login state
	const [phone, setPhone] = useState('');
	const [otp, setOtp] = useState('');
	const [otpSent, setOtpSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const switchMode = (mode: LoginMode) => {
		setLoginMode(mode);
		setError(null);
		setOtpSent(false);
		setOtp('');
	};

	const resolvePostLoginRouteWithSubscription = async (
		candidate: string | null,
		role: string | undefined,
		userOverride?: AuthUser | null,
	) => {
		const effectiveUser = userOverride || user;
		if (hasCorporateAccess(effectiveUser)) return '/corporate/dashboard';
		const normalizedRole = String(role || '').toLowerCase();
		if (normalizedRole === 'learner') return '/learner/dashboard';

		if (normalizedRole === 'patient') {
			if (effectiveUser?.patientSubscriptionActive) {
				return '/patient/sessions';
			}
			try {
				const subscriptionPayload = await patientApi.getSubscription();
				if (hasActivePaidPatientSubscription(effectiveUser, subscriptionPayload)) {
					return '/patient/sessions';
				}
			} catch (err) {
				console.error('[resolvePostLoginRouteWithSubscription] Failed to fetch subscription:', err);
			}
		}

		if (!candidate || candidate.startsWith('/auth/')) return getPostLoginRoute(effectiveUser);
		const isPricingTarget = candidate.startsWith('/plans');
		if (normalizedRole !== 'patient' || !isPricingTarget) return candidate;
		return candidate;
	};

	useEffect(() => {
		if (!isAuthenticated || !user || isCompletingLoginRef.current) return;

		if (hasCorporateAccess(user)) {
			navigate('/corporate/dashboard', { replace: true });
			return;
		}

		if (isProviderAuthRole(resolveSignupRole(user.role))) {
			void resolveProviderIdForOnboarding(user);
			if (!user.platformAccessActive) {
				navigate('/plans', { replace: true });
				return;
			}
			navigate(getPostLoginRoute(user), { replace: true });
			return;
		}

		const rawCandidate = from || afterLogin || next || null;
		const candidate = rawCandidate && (rawCandidate.startsWith('/patient/dashboard') || rawCandidate === '/patient' || rawCandidate === '/patient/')
			? '/patient/sessions'
			: rawCandidate;
		void (async () => {
			const postLoginRoute = await resolvePostLoginRouteWithSubscription(candidate, user.role, user);
			navigate(postLoginRoute, { replace: true });
		})();
	}, [afterLogin, from, isAuthenticated, navigate, next, user]);

	// ── Standard OTP request ─────────────────────────────────────────────────
	const requestOtp = async () => {
		if (!phone.trim()) { setError('Please enter your phone number.'); return; }
		setError(null);
		setLoading(true);
		try {
			await signupWithPhone(phone.trim(), undefined, true);
			setOtpSent(true);
		} catch (err) {
			setError(getApiErrorMessage(err, 'Failed to send OTP'));
		} finally {
			setLoading(false);
		}
	};

	// ── Standard OTP verification ────────────────────────────────────────────
	const verifyOtp = async () => {
		setError(null);
		setLoading(true);
		isCompletingLoginRef.current = true;
		try {
			const guestGameToken = localStorage.getItem('guest_game_token') || undefined;
			const cachedScreening = readCachedClinicalScreening();
			const result = await verifyPhoneSignupOtp(phone.trim(), otp.trim(), undefined, guestGameToken);
			if (guestGameToken) localStorage.removeItem('guest_game_token');
			if (cachedScreening) clearGuestClinicalScreening();

			const resolvedUser = await syncSessionAfterOtp(result.user);

			// Corporate MUST be checked first — admin may have a provider-type role in the backend
			if (hasCorporateAccess(resolvedUser)) {
				navigate('/corporate/dashboard', { replace: true });
				return;
			}

			if (isProviderAuthRole(resolveSignupRole(resolvedUser.role) ?? resolvedUser.role)) {
				await resolveProviderIdForOnboarding(resolvedUser);
				if (!resolvedUser.platformAccessActive) {
					navigate('/plans', { replace: true });
					return;
				}
				const candidate = from || afterLogin || next || null;
				const postLoginRoute = candidate && !candidate.startsWith('/auth/')
					? candidate
					: getPostLoginRoute(resolvedUser);
				navigate(postLoginRoute, { replace: true });
				return;
			}

			if ((resolvedUser as AuthUser)?.requiresSubscription) {
				let hasBookedSession = false;
				let hasActiveSubscription = Boolean(resolvedUser?.patientSubscriptionActive);

				if (!hasActiveSubscription) {
					try {
						const [subscriptionResponse, upcomingRes, historyRes] = await Promise.all([
							patientApi.getSubscription().catch(() => null),
							patientApi.getUpcomingSessions().catch(() => ({ data: [] })),
							patientApi.getSessionHistory().catch(() => ({ data: [] }))
						]);

						hasActiveSubscription = hasActivePaidPatientSubscription(
							resolvedUser,
							subscriptionResponse,
						);

						const upcoming = Array.isArray((upcomingRes as any)?.data) ? (upcomingRes as any).data : Array.isArray(upcomingRes) ? upcomingRes : [];
						const history = Array.isArray((historyRes as any)?.data) ? (historyRes as any).data : Array.isArray(historyRes) ? historyRes : [];

						if (upcoming.length > 0 || history.length > 0) {
							hasBookedSession = true;
						}
					} catch {
						hasActiveSubscription = Boolean(resolvedUser?.patientSubscriptionActive);
						hasBookedSession = false;
					}
				}

				if (hasActiveSubscription || hasBookedSession) {
					navigate('/patient/dashboard', { replace: true });
					return;
				}
				const rawCandidate = from || afterLogin || next || null;
				const candidate = rawCandidate && (rawCandidate.startsWith('/patient/dashboard') || rawCandidate === '/patient' || rawCandidate === '/patient/')
					? '/patient/dashboard'
					: rawCandidate;
				navigate(candidate || '/patient/dashboard', { replace: true });
				return;
			}

			const rawCandidate = from || afterLogin || next || null;
			const candidate = rawCandidate && (rawCandidate.startsWith('/patient/dashboard') || rawCandidate === '/patient' || rawCandidate === '/patient/')
				? '/patient/sessions'
				: rawCandidate;
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
				if (requestedUserType) searchParams.set('userType', requestedUserType);
				if (signupRole) searchParams.set('role', signupRole);

				toast.error('Please review and accept our terms to continue.', { duration: 5000 });

				navigate(`/auth/signup?${searchParams.toString()}`, {
					replace: true,
					state: { from, afterLogin, role: signupRole },
				});
				return;
			}
			setError(getApiErrorMessage(err, 'OTP verification failed'));
		} finally {
			isCompletingLoginRef.current = false;
			setLoading(false);
		}
	};

	// Removed requestCorpOtp and verifyCorpOtp because standard login works perfectly
	// and does not accidentally create a new company account on login.

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

						{/* ── Login Mode Tabs ── */}
						<div className="mt-4 inline-flex rounded-full bg-slate-100 p-1">
							<button
								type="button"
								id="standard-login-tab"
								onClick={() => switchMode('standard')}
								className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${loginMode === 'standard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
							>
								Patient / Provider
							</button>
							<button
								type="button"
								id="corporate-login-tab"
								onClick={() => switchMode('corporate')}
								className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${loginMode === 'corporate' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
							>
								🏢 Corporate
							</button>
						</div>

						{/* ── STANDARD LOGIN ── */}
						{loginMode === 'standard' && (
							<>
								<p className="mt-3 text-sm text-muted sm:text-base">
									{isProviderLogin ? 'Sign in with your registered mobile number' : 'Continue your wellness journey'}
								</p>

								<div className="mt-6 space-y-4">
									{!otpSent && (
										<PhoneInput
											id="login-phone"
											label="Phone Number"
											helperText={isProviderLogin ? 'OTP will be sent to your registered number' : 'Use your phone number to continue'}
											value={phone}
											onChange={(value) => setPhone(value)}
											required
										/>
									)}

									{otpSent && (
										<>
											<OtpInput
												label="One-Time Code"
												length={4}
												helperText="Enter the code sent to your WhatsApp / SMS"
												value={otp}
												onChange={setOtp}
											/>


										</>
									)}

									{!otpSent ? (
										<Button
											type="button"
											fullWidth
											loading={loading}
											className="btn btn-primary btn-lg w-full !rounded-lg hover:!bg-[var(--brand-navy-hover)]"
											onClick={requestOtp}
										>
											{loading ? 'Sending OTP...' : 'Send OTP'}
										</Button>
									) : (
										<Button
											type="button"
											fullWidth
											loading={loading}
											className="btn btn-primary btn-lg w-full !rounded-lg hover:!bg-[var(--brand-navy-hover)]"
											onClick={verifyOtp}
										>
											{loading ? 'Verifying...' : (isProviderLogin ? 'Verify & Continue' : 'Continue to wellness')}
										</Button>
									)}
								</div>

								<p className="callout callout-navy mt-3 text-xs font-medium">
									🔒 Your data is secure and confidential.
								</p>

								{error && (
									<p role="alert" aria-live="polite" className="mt-3 text-sm text-error">
										{error}
									</p>
								)}

								<p className="mt-4 text-center text-sm text-muted">
									{isProviderLogin ? 'New provider? ' : 'Need to create an account? '}
									<Link
										to={signupRole ? `/auth/signup?role=${encodeURIComponent(signupRole)}` : '/auth/signup'}
										state={signupRole ? { role: signupRole } : undefined}
										className="font-semibold text-sky underline underline-offset-4 transition-colors duration-150 hover:text-[var(--brand-sky-hover)]"
									>
										Register here
									</Link>
								</p>
							</>
						)}

						{/* ── CORPORATE LOGIN ── */}
						{loginMode === 'corporate' && (
							<>
								<p className="mt-3 text-sm text-muted sm:text-base">
									Sign in to your corporate admin account
								</p>

								<div className="mt-6 space-y-4">
									{!otpSent ? (
										<>
											<PhoneInput
												id="corp-login-phone"
												label="Registered Phone Number"
												helperText="The phone number used for your corporate admin account"
												value={phone}
												onChange={(value) => setPhone(value)}
												required
											/>
										</>
									) : (
										<>
											<div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
												<p className="text-xs font-medium text-blue-900">
													OTP sent to <strong>{phone}</strong>. Enter it below to sign in.
												</p>
											</div>
											<OtpInput
												label="One-Time Code"
												length={4}
												helperText="Enter the code sent to your WhatsApp / SMS"
												value={otp}
												onChange={setOtp}
											/>
										</>
									)}

									{!otpSent ? (
										<Button
											type="button"
											fullWidth
											loading={loading}
											className="btn btn-primary btn-lg w-full !rounded-lg hover:!bg-[var(--brand-navy-hover)]"
											onClick={requestOtp}
										>
											{loading ? 'Sending OTP...' : 'Send OTP'}
										</Button>
									) : (
										<Button
											type="button"
											fullWidth
											loading={loading}
											className="btn btn-primary btn-lg w-full !rounded-lg hover:!bg-[var(--brand-navy-hover)]"
											onClick={verifyOtp}
										>
											{loading ? 'Verifying...' : 'Sign In as Admin'}
										</Button>
									)}
								</div>

								{error && (
									<p role="alert" aria-live="polite" className="mt-3 text-sm text-error">
										{error}
									</p>
								)}

								<p className="mt-4 text-center text-sm text-muted">
									New corporate account?{' '}
									<Link
										to="/corporate"
										className="font-semibold text-sky underline underline-offset-4 transition-colors duration-150 hover:text-[var(--brand-sky-hover)]"
									>
										Register here
									</Link>
								</p>
							</>
						)}
					</section >
				</div >
			</div >
		</div >
	);
}