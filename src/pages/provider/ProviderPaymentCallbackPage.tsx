import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
	getProviderOnboardingErrorMessage,
	resolveProviderIdForOnboarding,
	verifyPlatformPaymentSettled,
	type PlatformPaymentVerificationOutcome,
} from '../../api/providerOnboarding';
import { me } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import {
	setStoredPlatformTransactionId,
	getStoredPlatformTransactionId,
	clearOnboardingSubmittedFlag,
} from '../../utils/providerOnboardingStorage';

type VerifyState = 'idle' | 'verifying' | 'success' | 'timeout' | 'failed' | 'no_provider';

const STEPS = [
	{ label: 'Payment received', key: 'verifying' },
	{ label: 'Activating access', key: 'success' },
	{ label: 'Redirecting', key: 'done' },
] as const;

function StepIndicator({ state }: { state: VerifyState }) {
	const activeIndex = state === 'verifying' ? 0 : state === 'success' ? 2 : 0;
	return (
		<ol className="flex items-center justify-center gap-0 mb-8" aria-label="Verification steps">
			{STEPS.map((step, i) => {
				const isDone = i < activeIndex || state === 'success';
				const isCurrent = i === activeIndex && state === 'verifying';
				return (
					<li key={step.key} className="flex items-center">
						<span
							className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-500 ${isDone
								? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
								: isCurrent
									? 'bg-[#1f6f5f] text-white shadow-lg shadow-[#1f6f5f]/30 ring-4 ring-[#1f6f5f]/20'
									: 'bg-slate-100 text-slate-400'
								}`}
						>
							{isDone ? (
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							) : (
								i + 1
							)}
						</span>
						<span
							className={`ml-2 hidden sm:inline text-xs font-semibold transition-colors duration-300 ${isDone ? 'text-emerald-600' : isCurrent ? 'text-[#1f6f5f]' : 'text-slate-400'
								}`}
						>
							{step.label}
						</span>
						{i < STEPS.length - 1 && (
							<div className={`mx-3 h-0.5 w-10 rounded-full transition-colors duration-500 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} />
						)}
					</li>
				);
			})}
		</ol>
	);
}

export default function ProviderPaymentCallbackPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { checkAuth } = useAuth();

	const clearProfileSubmittedForCurrentUser = async () => {
		try {
			const freshUser = await me();
			const userKey = String(freshUser.id || freshUser.phone || freshUser.email || '').trim();
			if (userKey) {
				clearOnboardingSubmittedFlag(userKey);
			}
		} catch {
			// ignore — route guard will still send user to profile setup
		}
	};
	const [verifyState, setVerifyState] = useState<VerifyState>('idle');
	const [message, setMessage] = useState('Setting up your provider access…');
	const [errorDetail, setErrorDetail] = useState<string | null>(null);
	const hasStartedRef = useRef(false);

	const runVerification = useCallback(async () => {
		setVerifyState('verifying');
		setMessage('Verifying your payment…');
		setErrorDetail(null);

		// Retrieve transaction id from callback URL params or fallback to storage
		let txn = searchParams.get('txn') || searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
		if (!txn) {
			txn = getStoredPlatformTransactionId() || '';
		}
		if (!txn) {
			try {
				txn = localStorage.getItem('manas360_provider_platform_txn_persistent') || '';
			} catch {
				// ignore
			}
		}

		if (txn) {
			setStoredPlatformTransactionId(txn);
		}

		// Refresh auth session first
		await checkAuth({ force: true });

		const providerId = await resolveProviderIdForOnboarding();
		if (!providerId) {
			setVerifyState('no_provider');
			setMessage('Provider account not found.');
			return;
		}

		setMessage('Confirming platform access with our servers…');

		let outcome: PlatformPaymentVerificationOutcome;
		try {
			outcome = await verifyPlatformPaymentSettled(providerId, txn || null);
		} catch (err) {
			setVerifyState('failed');
			setErrorDetail(getProviderOnboardingErrorMessage(err, 'Payment verification failed.'));
			setMessage('Payment verification failed.');
			return;
		}

		if (outcome === 'success') {
			setVerifyState('success');
			setMessage('Access activated! Taking you to profile setup…');
			await checkAuth({ force: true });
			await clearProfileSubmittedForCurrentUser();
			window.setTimeout(() => {
				navigate('/onboarding/provider-setup', { replace: true });
			}, 1200);
			return;
		}

		if (outcome === 'timeout') {
			setVerifyState('timeout');
			setMessage('Verification is taking longer than expected.');
			return;
		}

		setVerifyState('failed');
		setMessage('Payment verification could not be confirmed.');
	}, [checkAuth, navigate, searchParams]);

	useEffect(() => {
		if (hasStartedRef.current) return;
		hasStartedRef.current = true;
		void runVerification();
	}, [runVerification]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/40 px-4">
			<div className="w-full max-w-md">
				<div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/60 text-center">
					{/* Logo / brand mark */}
					<div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1f6f5f]/10">
						{verifyState === 'success' ? (
							<svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						) : verifyState === 'timeout' ? (
							<svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						) : verifyState === 'failed' || verifyState === 'no_provider' ? (
							<svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						) : (
							<div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1f6f5f]/20 border-t-[#1f6f5f]" style={{ borderWidth: '3px' }} />
						)}
					</div>

					<StepIndicator state={verifyState} />

					<h1 className="font-display text-xl font-bold text-slate-900 mb-2">
						{verifyState === 'success'
							? 'Platform Access Activated!'
							: verifyState === 'timeout'
								? 'Almost there…'
								: verifyState === 'failed'
									? 'Verification Issue'
									: verifyState === 'no_provider'
										? 'Account Not Found'
										: 'Verifying Payment'}
					</h1>

					<p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>

					{errorDetail && (
						<p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-6 font-medium">{errorDetail}</p>
					)}

					{/* ── Timeout actions ── */}
					{verifyState === 'timeout' && (
						<div className="space-y-3">
							<p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-4 py-3 mb-2 font-medium">
								Your payment was received. Our system may take a few more moments to activate your access.
							</p>
							<button
								type="button"
								onClick={() => {
									hasStartedRef.current = false;
									void runVerification();
								}}
								className="w-full rounded-2xl bg-[#1f6f5f] py-3 text-sm font-black text-white hover:bg-[#145347] transition-colors shadow-lg shadow-[#1f6f5f]/20"
							>
								Retry Verification
							</button>
							<button
								type="button"
								onClick={() => {
									void clearProfileSubmittedForCurrentUser().finally(() => {
										navigate('/onboarding/provider-setup', { replace: true });
									});
								}}
								className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
							>
								Continue to Profile Setup →
							</button>
							<p className="text-[10px] text-slate-400 mt-1">
								You can always return to <a href="/provider/subscription" className="underline">payment settings</a> if the issue persists.
							</p>
						</div>
					)}

					{/* ── Failed / no provider actions ── */}
					{(verifyState === 'failed' || verifyState === 'no_provider') && (
						<div className="space-y-3">
							{verifyState === 'no_provider' && (
								<button
									type="button"
									onClick={() => navigate('/auth/login?role=therapist', { replace: true })}
									className="w-full rounded-2xl bg-[#1f6f5f] py-3 text-sm font-black text-white hover:bg-[#145347] transition-colors shadow-lg shadow-[#1f6f5f]/20"
								>
									Sign In Again
								</button>
							)}
							{verifyState === 'failed' && (
								<>
									<button
										type="button"
										onClick={() => {
											hasStartedRef.current = false;
											void runVerification();
										}}
										className="w-full rounded-2xl bg-[#1f6f5f] py-3 text-sm font-black text-white hover:bg-[#145347] transition-colors shadow-lg shadow-[#1f6f5f]/20"
									>
										Retry
									</button>
									<button
										type="button"
										onClick={() => navigate('/provider/subscription', { replace: true })}
										className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
									>
										← Back to Payment
									</button>
								</>
							)}
						</div>
					)}

					{verifyState === 'verifying' && (
						<p className="text-xs text-slate-400 mt-2">Please keep this window open.</p>
					)}
				</div>

				<p className="mt-4 text-center text-xs text-slate-400">
					Secured by PhonePe · Manas 360
				</p>
			</div>
		</div>
	);
}
