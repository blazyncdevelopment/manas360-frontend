export type PatientPlanId = 'free' | 'monthly' | 'quarterly' | 'premium_monthly';

export interface PatientAddonSelection {
  premiumLibraryPack: 'none' | '1h' | '3h' | '5h';
}

export interface PatientSubscriptionCart {
  planId: PatientPlanId;
  addons: PatientAddonSelection;
  updatedAt: string;
}

export const PATIENT_CART_KEY = 'manas360.patient.subscription.cart.v1';

export const PATIENT_PLANS: Array<{
  id: PatientPlanId;
  name: string;
  displayPrice: string;
  gatewayPlanKey: string;
  trialDays: number;
  cta: string;
  badge?: string;
  amountMinor: number;
  features: string[];
}> = [
    {
      id: 'free',
      name: 'Free',
      displayPrice: 'INR 0',
      gatewayPlanKey: 'free',
      trialDays: 0,
      cta: 'Start Free',
      amountMinor: 0,
      features: [
        '3 sound tracks per day',
        'Basic AI chatbot',
        'Basic self-help content',
        'No therapist matching',
      ],
    },
    {
      id: 'monthly',
      name: 'Monthly',
      displayPrice: 'INR 99 / month',
      gatewayPlanKey: 'monthly',
      trialDays: 21,
      cta: 'Start 21-Day Trial',
      amountMinor: 9900,
      features: [
        'Full platform access',
        'PHQ-9 and GAD-7 assessments',
        'Therapist matching',
        'Mood tracking + analytics',
      ],
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      displayPrice: 'INR 279 / quarter',
      gatewayPlanKey: 'quarterly',
      trialDays: 21,
      cta: 'Start 21-Day Trial',
      badge: 'Most Chosen',
      amountMinor: 27900,
      features: [
        'Everything in Monthly',
        'Priority therapist matching',
        'All assessments in multiple languages',
        'Unlimited AI insights',
      ],
    },
    {
      id: 'premium_monthly',
      name: 'Premium Library',
      displayPrice: 'INR 299 / month',
      gatewayPlanKey: 'premium_monthly',
      trialDays: 21,
      cta: 'Start 21-Day Trial',
      amountMinor: 29900,
      features: [
        'Everything in Quarterly',
        'Premium library access packs',
        'Screen-time based library usage',
        'Advanced mood analytics',
      ],
    },
  ];

export const DEFAULT_ADDONS: PatientAddonSelection = {
  premiumLibraryPack: 'none',
};

const PREMIUM_LIBRARY_PACK_PRICING: Record<PatientAddonSelection['premiumLibraryPack'], number> = {
  none: 0,
  '1h': 39900,
  '3h': 99900,
  '5h': 169900,
};

export const formatInr = (minor: number): string => {
  const major = minor / 100;
  return Number.isInteger(major) ? `INR ${major.toFixed(0)}` : `INR ${major.toFixed(2)}`;
};

export const getPlanById = (id: PatientPlanId) => PATIENT_PLANS.find((plan) => plan.id === id) || PATIENT_PLANS[0];

export const getPlanAmountMinor = (id: PatientPlanId): number => getPlanById(id).amountMinor;

export const getAddonSubtotalMinor = (cart: PatientSubscriptionCart): number => {
  const { addons } = cart;
  const pack = addons?.premiumLibraryPack || 'none';
  return PREMIUM_LIBRARY_PACK_PRICING[pack] || 0;
};

export const getCheckoutSummaryMinor = (cart: PatientSubscriptionCart) => {
  const planMinor = getPlanAmountMinor(cart.planId);
  const addonsMinor = getAddonSubtotalMinor(cart);
  const subtotalMinor = planMinor + addonsMinor;
  const gstMinor = Math.round(subtotalMinor * 0.18);
  const totalMinor = subtotalMinor + gstMinor;
  return { planMinor, addonsMinor, subtotalMinor, gstMinor, totalMinor };
};

export const saveCart = (cart: PatientSubscriptionCart): void => {
  localStorage.setItem(PATIENT_CART_KEY, JSON.stringify(cart));
};

export const loadCart = (): PatientSubscriptionCart | null => {
  try {
    const raw = localStorage.getItem(PATIENT_CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as any;
    if (!parsed || !parsed.planId || !parsed.addons) return null;

    const premiumLibraryPack = parsed?.addons?.premiumLibraryPack || parsed?.addons?.anytimeBuddyPack || 'none';

    return {
      planId: parsed.planId,
      addons: {
        premiumLibraryPack: premiumLibraryPack === '1h' || premiumLibraryPack === '3h' || premiumLibraryPack === '5h'
          ? premiumLibraryPack
          : 'none',
      },
      updatedAt: String(parsed.updatedAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
};

export const clearCart = (): void => {
  localStorage.removeItem(PATIENT_CART_KEY);
};

export const PATIENT_DASHBOARD_PATH = '/patient/sessions';

export const PATIENT_SUBSCRIPTION_SUCCESS_REDIRECT = PATIENT_DASHBOARD_PATH;

/** Gateway plan ids used by universal checkout / verify APIs. */
export const PATIENT_GATEWAY_PLAN_MAP: Record<PatientPlanId, string> = {
  free: 'patient-free',
  monthly: 'patient-1month',
  quarterly: 'patient-3month',
  premium_monthly: 'patient-1year',
};

export const resolveGatewayPlanIdFromCart = (): string | null => {
  const cart = loadCart();
  if (!cart?.planId) return null;
  return PATIENT_GATEWAY_PLAN_MAP[cart.planId] || null;
};

export type PatientSubscriptionRecord = {
  status?: string;
  renewalDate?: string;
  planKey?: string;
  plan_name?: string;
  planName?: string;
  price?: number;
};

export const isFreeLikeSubscription = (subscription: PatientSubscriptionRecord | null | undefined): boolean => {
  if (!subscription) return true;
  const planLabel = String(
    subscription.planKey || subscription.plan_name || subscription.planName || '',
  ).toLowerCase();
  if (planLabel.includes('free')) return true;
  const price = Number(subscription.price);
  return Number.isFinite(price) && price <= 0;
};

export const isSubscriptionStatusActive = (subscription: PatientSubscriptionRecord | null | undefined): boolean => {
  if (!subscription) return false;
  const raw = subscription as PatientSubscriptionRecord & { isActive?: boolean; active?: boolean; is_active?: boolean };
  if (raw.isActive === true || raw.active === true || raw.is_active === true) return true;
  const status = String(subscription.status || '').toLowerCase();
  const renewal = subscription.renewalDate ? new Date(subscription.renewalDate) : null;
  const stillValid = renewal ? renewal.getTime() > Date.now() : true;
  return ['active', 'trial', 'trialing', 'grace'].includes(status) && stillValid;
};

/** True when the patient has a paid, currently active subscription (auth flag or subscription API). */
export const hasActivePaidPatientSubscription = (
  user: { patientSubscriptionActive?: boolean } | null | undefined,
  subscription: PatientSubscriptionRecord | null | undefined,
): boolean => {
  if (user?.patientSubscriptionActive) return true;
  if (!subscription || !isSubscriptionStatusActive(subscription)) return false;
  return !isFreeLikeSubscription(subscription);
};

export const resolveActivePatientPlanId = (
  subscription: PatientSubscriptionRecord | null | undefined,
): PatientPlanId | null => {
  const rawPlan = String(
    subscription?.planKey || subscription?.plan_name || subscription?.planName || '',
  ).toLowerCase();
  const normalized = rawPlan.replace(/\s+/g, '_');
  const match = PATIENT_PLANS.find(
    (plan) => plan.gatewayPlanKey === normalized || plan.id === normalized,
  );
  return match?.id || (isFreeLikeSubscription(subscription) ? 'free' : null);
};

const HOME_OR_HERO_PATHS = new Set(['/', '/hero', '/intro']);

export const isPatientSubscriptionTransaction = (transactionId: string): boolean =>
  transactionId.startsWith('SUB_') || transactionId.toUpperCase().includes('SUBSCRIPTION');

/** Normalize redirect targets so payment success never lands on marketing/home routes. */
export const resolvePostPaymentRedirectPath = (
  rawRedirect: string | null | undefined,
  options?: { isProvider?: boolean; preferSubscriptionDashboard?: boolean },
): string => {
  const isProvider = options?.isProvider === true;
  const defaultPath = isProvider ? '/provider/dashboard' : PATIENT_DASHBOARD_PATH;

  if (options?.preferSubscriptionDashboard && !isProvider) {
    return PATIENT_DASHBOARD_PATH;
  }

  const candidates = [rawRedirect].filter((value): value is string => Boolean(value && String(value).trim()));

  for (const candidate of candidates) {
    let decoded = String(candidate).trim();
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // keep raw value
    }

    let pathWithQuery = decoded;
    if (!pathWithQuery.startsWith('/')) {
      try {
        const parsed = new URL(pathWithQuery, typeof window !== 'undefined' ? window.location.origin : 'https://www.manas360.com');
        pathWithQuery = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        continue;
      }
    }

    const pathname = pathWithQuery.split('?')[0]?.split('#')[0] || '';
    if (!pathname || HOME_OR_HERO_PATHS.has(pathname)) {
      continue;
    }

    if (pathname.startsWith('/patient/dashboard')) {
      return pathWithQuery.replace('/patient/dashboard', '/patient/sessions');
    }
    if (pathname.startsWith('/provider/dashboard')) {
      return pathWithQuery;
    }

    if (pathname.startsWith('/plans') && !isProvider) {
      // Subscription checkout should land on dashboard, not pricing.
      return PATIENT_DASHBOARD_PATH;
    }

    return pathWithQuery;
  }

  return defaultPath;
};

export const buildPatientSubscriptionSuccessRedirect = (frontendOrigin: string): string => {
  const base = frontendOrigin.replace(/\/$/, '');
  const params = new URLSearchParams({
    redirect: PATIENT_SUBSCRIPTION_SUCCESS_REDIRECT,
    successRedirect: PATIENT_SUBSCRIPTION_SUCCESS_REDIRECT,
    type: 'patient',
    verify: 'universal',
  });
  const gatewayPlanId = resolveGatewayPlanIdFromCart();
  if (gatewayPlanId) {
    params.set('planId', gatewayPlanId);
  }
  // Path-based URL for BrowserRouter; PhonePe hash callbacks are normalized in main.tsx.
  return `${base}/payment/status?${params.toString()}`;
};

/** Path-based success URL for universal checkout (no `/#/` hash — BrowserRouter safe). */
export const buildUniversalPatientPaymentSuccessUrl = (
  frontendOrigin: string,
  planId: string,
  transactionId?: string,
): string => {
  const params = new URLSearchParams({
    type: 'patient',
    planId,
  });
  if (transactionId) {
    params.set('transactionId', transactionId);
  }
  return `${frontendOrigin.replace(/\/$/, '')}/universal/payment-success?${params.toString()}`;
};
