import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, signupWithPhone, verifyPhoneSignupOtp } from '../../api/auth';
import { resolveProviderIdForOnboarding } from '../../api/providerOnboarding';
import { clearGuestClinicalScreening, readCachedClinicalScreening } from '../../utils/guestScreeningCache';
import { patientApi } from '../../api/patient';
import { corporateApi } from '../../api/corporate.api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
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
	const { user, isAuthenticated, syncSessionAfterOtp, checkAuth } = useAuth();
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
	const [devOtp, setDevOtp] = useState<string | null>(null);

	// Corporate login state
	const [corpPhone, setCorpPhone] = useState('');
	const [corpCompanyName, setCorpCompanyName] = useState('');
	const [corpOtp, setCorpOtp] = useState('');
	const [corpOtpSent, setCorpOtpSent] = useState(false);
	const [corpLoading, setCorpLoading] = useState(false);
	const [corpError, setCorpError] = useState<string | null>(null);
	const [devCorpOtp, setDevCorpOtp] = useState<string | null>(null);

	// Development environment check
	const isDevelopment = process.env.NODE_ENV === 'development';

	const switchMode = (mode: LoginMode) => {
		setLoginMode(mode);
		setError(null);
		setCorpError(null);
		setOtpSent(false);
		setCorpOtpSent(false);
		setOtp('');
		setCorpOtp('');
		setDevOtp(null);
		setDevCorpOtp(null);
	};

	const resolvePostLoginRouteWithSubscription = async (
		candidate: string | null,
		role: string | undefined,
		userOverride?: AuthUser | null,
	) => {
		const effectiveUser = userOverride || user;
		if (hasCorporateAccess(effectiveUser)) return '/corporate/dashboard';
		const normalizedRole = String(role || '').toLowerCase();
		if (normalizedRole === 'learner') return '/provider/dashboard';

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
				navigate('/provider/subscription', { replace: true });
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
			await signupWithPhone(phone.trim());
			setOtpSent(true);

			// Development: Mock OTP for testing
			if (isDevelopment) {
				const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
				setDevOtp(mockOtp);
				console.log('[DEV] Mock OTP:', mockOtp);
			}
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
			const result = await verifyPhoneSignupOtp(phone.trim(), otp.trim(), {
				acceptedTerms: true,
			}, guestGameToken);
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
					navigate('/provider/subscription', { replace: true });
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
					navigate('/patient/sessions', { replace: true });
					return;
				}
				const rawCandidate = from || afterLogin || next || null;
				const candidate = rawCandidate && (rawCandidate.startsWith('/patient/dashboard') || rawCandidate === '/patient' || rawCandidate === '/patient/')
					? '/patient/sessions'
					: rawCandidate;
				navigate(`/patient/preferences?returnTo=${encodeURIComponent(candidate || '/')}`, { replace: true });
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

	// ── Corporate OTP request ────────────────────────────────────────────────
	const requestCorpOtp = async () => {
		if (!corpPhone.trim()) { setCorpError('Please enter your phone number.'); return; }
		setCorpError(null);
		setCorpLoading(true);
		try {
			await corporateApi.requestCorporateOtp({
				companyName: corpCompanyName.trim() || 'My Company',
				phone: corpPhone.trim(),
			});
			setCorpOtpSent(true);

			// Development: Mock OTP for testing
			if (isDevelopment) {
				const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
				setDevCorpOtp(mockOtp);
				console.log('[DEV] Mock Corporate OTP:', mockOtp);
			}
		} catch (err) {
			setCorpError(getApiErrorMessage(err, 'Failed to send OTP'));
		} finally {
			setCorpLoading(false);
		}
	};

	// ── Corporate OTP verification / login ───────────────────────────────────
	const verifyCorpOtp = async () => {
		setCorpError(null);
		setCorpLoading(true);
		isCompletingLoginRef.current = true;
		try {
			const result = await corporateApi.createCorporateAccount({
				companyName: corpCompanyName.trim() || 'My Company',
				phone: corpPhone.trim(),
				otp: corpOtp.trim(),
			});
			const responseUser = (result as any)?.user;
			if (responseUser?.id) {
				await syncSessionAfterOtp(responseUser);
			} else {
				await checkAuth({ force: true });
			}
			navigate('/corporate/dashboard', { replace: true });
		} catch (err) {
			setCorpError(getApiErrorMessage(err, 'OTP verification failed'));
		} finally {
			isCompletingLoginRef.current = false;
			setCorpLoading(false);
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
										<Input
											id="login-phone"
											label="Phone Number"
											type="tel"
											autoComplete="tel"
											placeholder="+919876543210"
											helperText={isProviderLogin ? 'OTP will be sent to your registered number' : 'Use your phone number to continue'}
											value={phone}
											onChange={(event) => setPhone(event.target.value)}
											required
										/>
									)}

									{otpSent && (
										<>
											<Input
												id="login-otp"
												label="One-Time Code"
												inputMode="numeric"
												pattern="\d{4}"
												maxLength={4}
												autoComplete="one-time-code"
												placeholder="4-digit OTP"
												helperText="Enter the code sent to your WhatsApp / SMS"
												value={otp}
												onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
												required
											/>

											{/* ── Development OTP Display ── */}
											{isDevelopment && devOtp && (
												<div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-3 shadow-sm">
													<p className="text-xs font-semibold text-yellow-800">
														🔧 Development Mode - Test OTP
													</p>
													<div className="mt-2 flex items-center justify-between gap-2">
														<code className="flex-1 rounded bg-yellow-100 px-2 py-1.5 font-mono text-sm font-bold text-yellow-900">
															{devOtp}
														</code>
														<button
															type="button"
															onClick={() => {
																setOtp(devOtp);
																navigator.clipboard.writeText(devOtp).catch(() => { });
															}}
															className="rounded bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yellow-700"
														>
															Copy & Fill
														</button>
													</div>
												</div>
											)}
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
									{!corpOtpSent ? (
										<>
											<Input
												id="corp-login-phone"
												label="Registered Phone Number"
												type="tel"
												autoComplete="tel"
												placeholder="+919876543210"
												helperText="The phone number used when creating your corporate account"
												value={corpPhone}
												onChange={(e) => setCorpPhone(e.target.value)}
												required
											/>
											<Input
												id="corp-login-company"
												label="Company Name (optional)"
												type="text"
												placeholder="TechCorp India"
												helperText="Enter your company name if required"
												value={corpCompanyName}
												onChange={(e) => setCorpCompanyName(e.target.value)}
											/>
										</>
									) : (
										<>
											<div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
												<p className="text-xs font-medium text-blue-900">
													OTP sent to <strong>{corpPhone}</strong>. Enter it below to sign in.
												</p>
											</div>
											<Input
												id="corp-login-otp"
												label="One-Time Code"
												inputMode="numeric"
												pattern="\d{4}"
												maxLength={4}
												autoComplete="one-time-code"
												placeholder="4-digit OTP"
												helperText="Enter the code sent to your WhatsApp"
												value={corpOtp}
												onChange={(e) => setCorpOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
												required
											/>

											{/* ── Development OTP Display ── */}
											{isDevelopment && devCorpOtp && (
												<div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-3 shadow-sm">
													<p className="text-xs font-semibold text-yellow-800">
														🔧 Development Mode - Test OTP
													</p>
													<div className="mt-2 flex items-center justify-between gap-2">
														<code className="flex-1 rounded bg-yellow-100 px-2 py-1.5 font-mono text-sm font-bold text-yellow-900">
															{devCorpOtp}
														</code>
														<button
															type="button"
															onClick={() => {
																setCorpOtp(devCorpOtp);
																navigator.clipboard.writeText(devCorpOtp).catch(() => { });
															}}
															className="rounded bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yellow-700"
														>
															Copy & Fill
														</button>
													</div>
												</div>
											)}

											<button
												type="button"
												onClick={() => { setCorpOtpSent(false); setCorpOtp(''); setDevCorpOtp(null); }}
												className="text-xs text-sky underline hover:text-[var(--brand-sky-hover)]"
											>
												Change phone number
											</button>
										</>
									)}

									{!corpOtpSent ? (
										<Button
											type="button"
											fullWidth
											loading={corpLoading}
											className="btn btn-primary btn-lg w-full !rounded-lg !bg-[#1E6C61] hover:!bg-[#18574F]"
											onClick={requestCorpOtp}
										>
											{corpLoading ? 'Sending OTP...' : 'Send OTP'}
										</Button>
									) : (
										<Button
											type="button"
											fullWidth
											loading={corpLoading}
											className="btn btn-primary btn-lg w-full !rounded-lg !bg-[#1E6C61] hover:!bg-[#18574F]"
											onClick={verifyCorpOtp}
										>
											{corpLoading ? 'Signing in...' : 'Sign in to Corporate Dashboard'}
										</Button>
									)}
								</div>

								<p className="callout callout-navy mt-3 text-xs font-medium">
									🔒 Your data is secure and confidential.
								</p>

								{corpError && (
									<p role="alert" aria-live="polite" className="mt-3 text-sm text-error">
										{corpError}
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
					</section>
				</div>
			</div>
		</div>
	);
}