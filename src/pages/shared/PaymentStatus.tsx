import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Home, Clock, AlertCircle, HelpCircle } from 'lucide-react';
import { me as meApi, type AuthUser } from '../../api/auth';
import { getPostLoginRoute, useAuth } from '../../context/AuthContext';
import { repairHashBasedRoute } from '../../lib/hashRouteRedirect';
import { http } from '../../lib/http';
import {
	PAYMENT_POLL_INTERVAL_MS,
	PAYMENT_POLL_MAX_ATTEMPTS,
	pollPaymentUntilSettled,
} from '../../lib/paymentVerification';
import {
	clearCart,
	isPatientSubscriptionTransaction,
	PATIENT_DASHBOARD_PATH,
	resolveGatewayPlanIdFromCart,
	resolvePostPaymentRedirectPath,
} from '../../lib/patientSubscriptionFlow';
import {
	finalizeProviderLeadPurchase,
	isLeadPurchaseTransaction,
} from '../../lib/providerLeadPurchaseFlow';
import { setMarketplaceBookingPending } from '../../lib/marketplaceBookingPending';

type PaymentState = 'loading' | 'pending' | 'success' | 'failed';

interface PaymentDetails {
	status?: string;
	failureReason?: string;
	metadata?: {
		redirectUrl?: string;
		successRedirectUrl?: string;
		type?: string;
		declineTitle?: string;
		declineMessage?: string;
		declineAction?: string;
		declineIsRetryable?: boolean;
		declineRetryAfterMinutes?: number;
	};
}

const FAILURE_STATES = new Set(['FAILED', 'DECLINED', 'PAYMENT_ERROR', 'PAYMENT_DECLINED']);

export default function PaymentStatusPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { checkAuth } = useAuth();
	const refreshedUserRef = useRef<AuthUser | null>(null);
	const [state, setState] = useState<PaymentState>('loading');
	const [pollAttempt, setPollAttempt] = useState(0);
	const [statusMessage, setStatusMessage] = useState('Verifying your payment, please do not close this window...');
	const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

	const statusFromUrl = (searchParams.get('status') || searchParams.get('code') || '').toUpperCase();
	const transactionId = searchParams.get('transactionId') || searchParams.get('id') || '';
	const orderId = searchParams.get('orderId') || '';
	const verifyId = transactionId || orderId;
	const planIdFromUrl = searchParams.get('planId');
	const resolvedPlanId = planIdFromUrl || resolveGatewayPlanIdFromCart() || null;
	const paymentType = searchParams.get('type') || 'patient';
	const hasUniversalCheckoutParams = Boolean(resolvedPlanId) && searchParams.has('type');
	const useUniversalVerify =
		Boolean(orderId)
		|| searchParams.get('verify') === 'universal'
		|| (Boolean(transactionId) && hasUniversalCheckoutParams)
		|| isPatientSubscriptionTransaction(transactionId);
	const isLeadPurchasePayment = isLeadPurchaseTransaction(transactionId);
	const isProviderTransaction = transactionId.startsWith('PROV_') || paymentType === 'provider' || isLeadPurchasePayment;
	const redirectAfterSuccess = searchParams.get('redirect') || searchParams.get('successRedirect') || '';
	const isSubscriptionPayment = useMemo(
		() => isPatientSubscriptionTransaction(transactionId),
		[transactionId],
	);

	useEffect(() => {
		repairHashBasedRoute();
	}, []);

	const resolveRedirectTarget = useCallback(
		(metadataRedirect?: string) =>
			resolvePostPaymentRedirectPath(metadataRedirect || redirectAfterSuccess, {
				isProvider: isProviderTransaction,
				preferSubscriptionDashboard: isSubscriptionPayment,
			}),
		[redirectAfterSuccess, isProviderTransaction, isSubscriptionPayment],
	);

	useEffect(() => {
		if (state !== 'failed' || !verifyId) return;

		const fetchPaymentDetails = async () => {
			try {
				const response = await http.get(`/v1/payments/status/${verifyId}`);
				const details = response.data?.data as PaymentDetails | undefined;
				if (details) {
					setPaymentDetails(details);
				}
			} catch (err) {
				console.warn('Failed to fetch payment details for error display', err);
			}
		};

		void fetchPaymentDetails();
	}, [state, verifyId]);

	useEffect(() => {
		if (!verifyId) {
			setState('failed');
			setStatusMessage('Invalid payment session. Missing transaction identifier.');
			return;
		}

		if (FAILURE_STATES.has(statusFromUrl)) {
			setState('failed');
			setStatusMessage('Payment was declined or failed. Please try again.');
			return;
		}

		const controller = new AbortController();
		let active = true;

		const verifyPayment = async () => {
			setState('pending');
			setStatusMessage('Verifying your payment, please do not close this window...');

			if (isLeadPurchasePayment && transactionId) {
				try {
					await finalizeProviderLeadPurchase(transactionId, {
						onProgress: (attempt, maxAttempts, paymentState) => {
							if (!active) return;
							setPollAttempt(attempt);
							setStatusMessage(
								paymentState === 'PENDING' || paymentState === 'PENDING_PAYMENT'
									? `Confirming lead purchase... Checking payment (${attempt}/${maxAttempts})`
									: `Verifying lead purchase payment... (${attempt}/${maxAttempts})`,
							);
						},
					});
					setState('success');
					setStatusMessage('Lead purchased successfully! The patient session is being assigned to you.');
					return;
				} catch (err: any) {
					const serverMessage = err?.response?.data?.message;
					setState('failed');
					setStatusMessage(serverMessage || err?.message || 'Unable to verify lead purchase payment.');
					return;
				}
			}

			const outcome = await pollPaymentUntilSettled({
				mode: useUniversalVerify ? 'universal' : 'standard',
				transactionId: verifyId,
				universalParams: {
					type: paymentType,
					planId: resolvedPlanId,
					orderId: orderId || null,
					transactionId: transactionId || null,
				},
				maxAttempts: PAYMENT_POLL_MAX_ATTEMPTS,
				intervalMs: PAYMENT_POLL_INTERVAL_MS,
				signal: controller.signal,
				onProgress: (attempt, maxAttempts, paymentState) => {
					if (!active) return;
					setPollAttempt(attempt);
					setStatusMessage(
						paymentState === 'PENDING' || paymentState === 'PENDING_PAYMENT'
							? `Payment processing... Checking status (Attempt ${attempt}/${maxAttempts})`
							: `Verifying your payment... (Attempt ${attempt}/${maxAttempts})`,
					);
				},
			});

			if (!active) return;

			if (outcome === 'success') {
				const shouldClearCart =
					!isProviderTransaction
					&& (isSubscriptionPayment || paymentType === 'patient' || Boolean(resolvedPlanId));

				if (shouldClearCart) {
					clearCart();
				}

				setStatusMessage('Payment verified successfully! Syncing your profile...');
				try {
					refreshedUserRef.current = await meApi();
				} catch (err) {
					console.warn('Profile refresh after payment failed', err);
					refreshedUserRef.current = null;
				}
				try {
					await checkAuth({ force: true });
				} catch (err) {
					console.warn('Auth context sync after payment failed', err);
				}

				setState('success');
				setStatusMessage('Subscription activated! Redirecting...');
				return;
			}

			if (outcome === 'failed') {
				setState('failed');
				setStatusMessage('Payment was declined or failed. Please try again.');
				return;
			}

			setState('failed');
			setStatusMessage(
				'Payment status verification timed out. If money was debited, your plan will activate shortly.',
			);
		};

		void verifyPayment().catch((err) => {
			if ((err as Error)?.name === 'AbortError') return;
			console.error('Payment verification failed', err);
			if (!active) return;
			setState('failed');
			setStatusMessage('Unable to verify payment. Please try again or contact support.');
		});

		return () => {
			active = false;
			controller.abort();
		};
	}, [
		verifyId,
		orderId,
		transactionId,
		statusFromUrl,
		useUniversalVerify,
		paymentType,
		resolvedPlanId,
		isProviderTransaction,
		isSubscriptionPayment,
		isLeadPurchasePayment,
	]);

	useEffect(() => {
		if (state !== 'success') return;

		const timer = window.setTimeout(() => {
			void (async () => {
				if (!isProviderTransaction) {
					if (transactionId) {
						const pendingKey = `manas360.smartmatch.pending.${transactionId}`;
						const pendingRaw = localStorage.getItem(pendingKey);
						if (pendingRaw) {
							try {
								const pendingPayload = JSON.parse(pendingRaw);
								localStorage.removeItem(pendingKey);
								const smartMatchSummary = pendingPayload?.smartMatchSummary || null;
								if (smartMatchSummary) {
									window.sessionStorage.setItem('manas360.smartmatch.lastSummary', JSON.stringify(smartMatchSummary));
								}
								setMarketplaceBookingPending({
									savedAt: new Date().toISOString(),
									transactionId,
									smartMatchSummary: smartMatchSummary || undefined,
								});
								navigate('/patient/sessions', {
									replace: true,
									state: {
										smartMatchSummary,
										assessmentResults: pendingPayload?.assessmentResults || [],
										paymentConfirmed: true,
									},
								});
								return;
							} catch (err) {
								console.warn('Failed to restore marketplace session summary after payment', err);
							}
						}

						if (transactionId.startsWith('MKT_SESS_')) {
							setMarketplaceBookingPending({
								savedAt: new Date().toISOString(),
								transactionId,
							});
							navigate('/patient/sessions', {
								replace: true,
								state: { paymentConfirmed: true },
							});
							return;
						}
					}

					const metadataRedirect =
						paymentDetails?.metadata?.successRedirectUrl
						|| paymentDetails?.metadata?.redirectUrl
						|| '';

					const refreshedUser = refreshedUserRef.current;
					let destination = resolveRedirectTarget(metadataRedirect);
					if (refreshedUser) {
						const routeFromProfile = getPostLoginRoute(refreshedUser);
						if (routeFromProfile && routeFromProfile !== '/plans') {
							destination = routeFromProfile;
						}
					}
					if (isSubscriptionPayment && destination.startsWith('/plans')) {
						destination = PATIENT_DASHBOARD_PATH;
					}

					navigate(destination, { replace: true });
					return;
				}

				if (isLeadPurchasePayment) {
					navigate('/provider/leads', { replace: true });
					return;
				}

				navigate(`/provider/confirmation?transactionId=${encodeURIComponent(transactionId)}`, { replace: true });
			})();
		}, 2000);

		return () => window.clearTimeout(timer);
	}, [
		state,
		navigate,
		isProviderTransaction,
		transactionId,
		paymentDetails,
		resolveRedirectTarget,
		isLeadPurchasePayment,
	]);

	const dashboardPath = isProviderTransaction ? '/provider/dashboard' : PATIENT_DASHBOARD_PATH;
	const successSubtitle = isLeadPurchasePayment
		? 'Payment verified. Your lead has been assigned — opening marketplace...'
		: isSubscriptionPayment
			? 'Payment verified. Your plan is active — opening your dashboard...'
			: 'Payment received successfully. We are now confirming your booking.';

	if (state === 'loading' || state === 'pending') {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
				{state === 'loading' ? (
					<Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
				) : (
					<Clock className="h-12 w-12 text-amber-600 animate-pulse" />
				)}
				<p className="mt-4 max-w-md text-center text-sm font-medium text-slate-600">{statusMessage}</p>
				{state === 'pending' && pollAttempt > 0 && (
					<p className="mt-2 text-xs text-slate-400">
						Attempt {pollAttempt} of {PAYMENT_POLL_MAX_ATTEMPTS}. Please do not refresh.
					</p>
				)}
				{verifyId && (
					<p className="mt-4 rounded-lg bg-white px-3 py-2 text-center text-xs font-mono text-slate-500">
						Transaction: {verifyId}
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
			<div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
				{state === 'success' && (
					<>
						<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
							<CheckCircle className="h-10 w-10 text-emerald-600" />
						</div>
						<h1 className="mt-6 text-center text-2xl font-bold text-slate-900">Payment Successful!</h1>
						<p className="mt-2 text-center text-sm text-slate-500">{successSubtitle}</p>
						{verifyId && (
							<p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-mono text-slate-500">
								Transaction: {verifyId}
							</p>
						)}

					</>
				)}

				{state === 'failed' && (
					<>
						<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
							<XCircle className="h-10 w-10 text-red-600" />
						</div>
						<h1 className="mt-6 text-center text-2xl font-bold text-slate-900">Payment Failed</h1>
						<p className="mt-3 text-center text-sm text-slate-500">{statusMessage}</p>

						{paymentDetails?.metadata?.declineTitle && (
							<div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
								<div className="flex gap-3">
									<AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
									<div className="flex-1">
										<h3 className="font-semibold text-red-900">{paymentDetails.metadata.declineTitle}</h3>
										{paymentDetails.metadata.declineMessage && (
											<p className="mt-1 text-sm text-red-800">{paymentDetails.metadata.declineMessage}</p>
										)}
										{paymentDetails.metadata.declineAction && (
											<div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-900">
												<strong>What to do:</strong> {paymentDetails.metadata.declineAction}
											</div>
										)}
									</div>
								</div>
							</div>
						)}

						{verifyId && (
							<p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-mono text-slate-500">
								Transaction: {verifyId}
							</p>
						)}

						<div className="mt-8 flex flex-col gap-3">
							{paymentDetails?.metadata?.declineIsRetryable !== false && (
								<button
									type="button"
									onClick={() => navigate(isProviderTransaction ? '/provider/checkout' : '/checkout', { replace: true })}
									className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
								>
									<ArrowLeft className="h-4 w-4" /> Retry Payment
								</button>
							)}

							{paymentDetails?.metadata?.declineIsRetryable === false && (
								<a
									href="https://wa.me/918848220077?text=I%20need%20help%20with%20my%20payment"
									target="_blank"
									rel="noreferrer"
									className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
								>
									<HelpCircle className="h-4 w-4" /> Contact Support
								</a>
							)}

							<button
								type="button"
								onClick={() => navigate(dashboardPath, { replace: true })}
								className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
							>
								<Home className="h-4 w-4" /> Go to Dashboard
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
