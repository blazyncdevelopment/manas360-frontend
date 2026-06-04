import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { AuthUser } from '../../api/auth';
import { patientApi } from '../../api/patient';
import { hasCorporateAccess, useAuth } from '../../context/AuthContext';
import { FRONTEND_URL } from '../../lib/runtimeEnv';
import {
  PATIENT_PLANS,
  DEFAULT_ADDONS,
  saveCart,
  buildPatientSubscriptionSuccessRedirect,
  PATIENT_SUBSCRIPTION_SUCCESS_REDIRECT,
  isFreeLikeSubscription,
  isSubscriptionStatusActive,
  resolveActivePatientPlanId,
  type PatientPlanId,
  type PatientSubscriptionRecord,
} from '../../lib/patientSubscriptionFlow';
import './PricingPage.css';

type PricingRole = 'patient' | 'provider' | 'corporate';

const ROLE_TABS: Array<{ id: PricingRole; icon: string; label: string }> = [
  { id: 'patient', icon: '🧑', label: 'Patient' },
  { id: 'provider', icon: '👨‍⚕️', label: 'Provider / Therapist' },
  { id: 'corporate', icon: '🏢', label: 'Corporate' },
];

function parseRoleParam(value: string | null): PricingRole {
  if (value === 'provider' || value === 'corporate') return value;
  return 'patient';
}

const PROVIDER_PRICING_ROLES = new Set(['therapist', 'psychiatrist', 'psychologist', 'coach']);

function resolveLockedPricingRole(user: AuthUser | null | undefined): PricingRole | null {
  if (!user) return null;

  const normalized = String(user.role || '').toLowerCase().replace(/_/g, '');

  if (PROVIDER_PRICING_ROLES.has(normalized)) {
    return 'provider';
  }

  if (hasCorporateAccess(user)) {
    return 'corporate';
  }

  if (normalized === 'patient') {
    return 'patient';
  }

  return null;
}

function FeatureList({
  items,
  compact,
}: {
  items: Array<{ text: ReactNode; excluded?: boolean }>;
  compact?: boolean;
}) {
  return (
    <ul className={`card-features${compact ? ' card-features-sm' : ''}`}>
      {items.map((item, index) => (
        <li key={index} className={item.excluded ? 'no' : undefined}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}

function CardCta({
  children,
  filled,
  large,
  small,
  disabled,
  onClick,
}: {
  children: ReactNode;
  filled?: boolean;
  large?: boolean;
  small?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const classes = [
    'card-cta',
    filled ? 'filled' : '',
    large ? 'card-cta-lg' : '',
    small ? 'card-cta-sm' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const lockedRole = useMemo(() => resolveLockedPricingRole(user), [user]);
  const [activeRole, setActiveRole] = useState<PricingRole>(() => parseRoleParam(searchParams.get('role')));
  const [subscribingPlanId, setSubscribingPlanId] = useState<PatientPlanId | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscription, setSubscription] = useState<PatientSubscriptionRecord | null>(null);

  const loadSubscription = useCallback(async () => {
    setSubscriptionLoading(true);
    try {
      const current = await patientApi.getSubscription();
      setSubscription((current as PatientSubscriptionRecord) || null);
    } catch {
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await checkAuth({ force: true });
      } catch {
        // Continue loading subscription snapshot even if profile refresh fails.
      }
      await loadSubscription();
    })();
  }, [checkAuth, loadSubscription]);

  useEffect(() => {
    if (lockedRole) {
      setActiveRole(lockedRole);
      const urlRole = searchParams.get('role');
      if (urlRole && parseRoleParam(urlRole) !== lockedRole) {
        setSearchParams(lockedRole === 'patient' ? {} : { role: lockedRole }, { replace: true });
      }
      return;
    }

    const role = parseRoleParam(searchParams.get('role'));
    setActiveRole(role);
  }, [searchParams, lockedRole, setSearchParams]);

  const switchRole = (role: PricingRole) => {
    if (lockedRole) return;
    setActiveRole(role);
    setSearchParams(role === 'patient' ? {} : { role }, { replace: true });
  };

  const authSubscriptionActive = Boolean(user?.patientSubscriptionActive);

  const subscriptionActive = useMemo(
    () => authSubscriptionActive || isSubscriptionStatusActive(subscription),
    [authSubscriptionActive, subscription],
  );

  const onFreePlan = useMemo(
    () => !authSubscriptionActive && isFreeLikeSubscription(subscription),
    [authSubscriptionActive, subscription],
  );

  const hasPaidActiveSubscription = subscriptionActive && !onFreePlan;

  const activePlanId = useMemo(() => {
    // Subscription API result is always fresher than the JWT — prefer it when it
    // shows a paid plan, to avoid stale "free" from auth context overriding it.
    const fromApi = resolveActivePatientPlanId(subscription);
    if (fromApi && fromApi !== 'free') return fromApi;

    if (user?.patientSubscriptionPlan) {
      const fromAuth = resolveActivePatientPlanId({
        planKey: user.patientSubscriptionPlan,
        status: 'active',
      });
      if (fromAuth && fromAuth !== 'free') return fromAuth;
    }

    return fromApi ?? 'free';
  }, [user?.patientSubscriptionPlan, subscription]);

  const renewalLabel = useMemo(() => {
    if (!subscription?.renewalDate) return '';
    const renewal = new Date(subscription.renewalDate);
    if (Number.isNaN(renewal.getTime())) return '';
    return renewal.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [subscription]);

  const getPlanButtonState = (planId: PatientPlanId) => {
    const plan = PATIENT_PLANS.find((item) => item.id === planId);
    if (!plan) {
      return { disabled: true, label: 'Unavailable', isCurrentPlan: false };
    }

    const isCurrentPlan = subscriptionActive && activePlanId === planId;
    const isProcessing = subscribingPlanId === planId;

    if (isProcessing) {
      return { disabled: true, label: 'Processing...', isCurrentPlan };
    }

    if (isCurrentPlan) {
      return { disabled: true, label: 'Subscribed', isCurrentPlan };
    }

    if (hasPaidActiveSubscription && planId === 'free') {
      return { disabled: true, label: 'Included in paid plan', isCurrentPlan };
    }

    return { disabled: false, label: plan.cta.replace('21-Day', '6-Day'), isCurrentPlan };
  };

  const onStartSubscription = async (planId: PatientPlanId) => {
    const { disabled, isCurrentPlan } = getPlanButtonState(planId);
    if (disabled) {
      if (isCurrentPlan) {
        toast.success('This is already your active plan.');
      }
      return;
    }

    const selectedPlan = PATIENT_PLANS.find((plan) => plan.id === planId);
    if (!selectedPlan) {
      toast.error('Selected plan is not available.');
      return;
    }

    if (hasPaidActiveSubscription && planId === 'free') {
      toast.error('Manage downgrades from Settings → Billing.');
      return;
    }

    if (selectedPlan.id !== 'free') {
      saveCart({
        planId: selectedPlan.id,
        addons: DEFAULT_ADDONS,
        updatedAt: new Date().toISOString(),
      });
      navigate('/plans/addons');
      return;
    }

    setSubscribingPlanId(planId);
    try {
      const response = await patientApi.upgradeSubscription({
        planKey: selectedPlan.gatewayPlanKey,
        redirectUrl: buildPatientSubscriptionSuccessRedirect(FRONTEND_URL),
      });
      const payload = (response as { redirectUrl?: string; data?: { redirectUrl?: string } }) ?? response;

      toast.success('Subscription activated successfully.');
      const redirectTarget = payload?.redirectUrl || payload?.data?.redirectUrl;
      if (redirectTarget) {
        window.location.href = String(redirectTarget);
        return;
      }
      await loadSubscription();
      navigate(PATIENT_SUBSCRIPTION_SUCCESS_REDIRECT, { replace: true });
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      const status = Number(err?.response?.status || 0);
      if (status === 409) {
        toast.error(
          err?.response?.data?.message
            || 'A subscription update is already in progress. Please retry shortly.',
        );
      } else {
        toast.error(err?.response?.data?.message || 'Could not initiate subscription.');
      }
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const patientCta = (
    planId: PatientPlanId,
    filled?: boolean,
    large?: boolean,
    small?: boolean,
    labelSuffix = '',
  ) => {
    const { disabled, label, isCurrentPlan } = getPlanButtonState(planId);
    const displayLabel = subscriptionLoading ? 'Loading...' : `${label}${labelSuffix}`;
    return (
      <CardCta
        filled={filled || isCurrentPlan}
        large={large}
        small={small}
        disabled={disabled || subscriptionLoading}
        onClick={() => void onStartSubscription(planId)}
      >
        {displayLabel}
      </CardCta>
    );
  };

  const cardClass = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

  return (
    <div className="pricing-page">
      <header className="pg-header">
        <h1>MANAS360 Pricing Plans</h1>
        <p className="sub">
          Transparent pricing · <strong>6-day free trial for everyone</strong> · Payment via PhonePe
        </p>
      </header>

      <div
        className={cardClass('role-tabs', lockedRole ? 'role-tabs--locked' : undefined)}
        role="tablist"
        aria-label="Pricing audience"
      >
        {ROLE_TABS.map((tab) => {
          const isActive = activeRole === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={lockedRole ? true : undefined}
              tabIndex={lockedRole ? -1 : undefined}
              className={cardClass('role-tab', isActive && 'active')}
              onClick={() => switchRole(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="content">
        <nav className="page-nav" aria-label="Page navigation">
          <button type="button" className="page-nav-btn page-nav-btn-back" onClick={() => navigate(-1)}>
            Go Back
          </button>
          <button
            type="button"
            className="page-nav-btn page-nav-btn-dashboard"
            onClick={() => navigate('/patient/dashboard', { replace: true })}
          >
            Dashboard
          </button>
        </nav>

        {/* PATIENT */}
        <div
          id="panel-patient"
          role="tabpanel"
          className={cardClass('role-panel', activeRole === 'patient' && 'active')}
        >
          <div className="section-label">Platform Access</div>
          <h2 className="section-title">Choose Your Plan</h2>
          <p className="section-desc">
            Platform subscription gives you access to assessments, therapist matching, streaming, and AI tools.
            Therapy sessions are booked and paid separately.
          </p>
          {!subscriptionLoading && subscriptionActive && (
            <div className="subscription-badge">
              Active plan: {subscription?.planName || 'Current Plan'}
              {renewalLabel ? ` · Valid until ${renewalLabel}` : ''}
            </div>
          )}

          <div className="cards-row cards-4 plan-cards-row">
            <article
              className={cardClass(
                'card card-compact',
                subscriptionActive && activePlanId === 'free' && 'current-plan',
              )}
            >
              <div className="card-icon card-icon-sm">🆓</div>
              <div className="card-name card-name-sm">Free</div>
              <div className="card-price">
                <span className="amt amt-sm">₹0</span>
              </div>
              <div className="card-target">First-time users</div>
              <FeatureList
                compact
                items={[
                  { text: '3 sound tracks / day' },
                  { text: 'AI chatbot (basic)' },
                  { text: 'Basic self-help content' },
                  { text: 'No assessments', excluded: true },
                  { text: 'No therapist matching', excluded: true },
                ]}
              />
              {patientCta('free', false, false, true)}
            </article>

            <article className="card">
              <div className="card-icon">💡</div>
              <div className="card-name">Monthly</div>
              <div className="card-price">
                <span className="amt">₹99</span>
                <span className="per">/month</span>
              </div>
              <div className="card-target">Trial users</div>
              <FeatureList
                items={[
                  { text: 'Full platform access' },
                  { text: 'PHQ-9 & GAD-7 assessments' },
                  { text: 'Therapist matching' },
                  { text: 'Standard streaming' },
                  { text: 'Mood tracking + analytics' },
                  { text: 'Priority matching', excluded: true },
                  { text: 'Downloads / AI insights', excluded: true },
                ]}
              />
              {patientCta('monthly')}
            </article>

            <article
              className={cardClass(
                'card mvp',
                subscriptionActive && activePlanId === 'quarterly' && 'current-plan',
              )}
            >
              <div className="card-icon">⭐</div>
              <div className="card-name">Quarterly</div>
              <div className="card-price">
                <span className="amt">₹279</span>
                <span className="per">/quarter</span>
                <span className="save">₹93/mo</span>
              </div>
              <div className="card-target">Primary B2C plan</div>
              <div className="card-callout card-callout-blue">
                📱 78% of smartphone users selected this plan
              </div>
              <FeatureList
                items={[
                  { text: 'Full platform access' },
                  { text: 'All assessments (5 languages)' },
                  { text: <><strong>Priority</strong> therapist matching</> },
                  { text: 'Standard streaming' },
                  { text: 'Mood tracking + analytics' },
                  { text: 'Session recordings access' },
                  { text: 'Unlimited streaming / AI insights', excluded: true },
                ]}
              />
              {patientCta('quarterly', true, true, false, ' →')}
            </article>

            <article
              className={cardClass(
                'card popular',
                subscriptionActive && activePlanId === 'premium_monthly' && 'current-plan',
              )}
            >
              <div className="card-icon">🏆</div>
              <div className="card-name">Premium</div>
              <div className="card-price">
                <span className="amt">₹299</span>
                <span className="per">/month</span>
              </div>
              <div className="card-target">Power users</div>
              <FeatureList
                items={[
                  { text: 'Everything in Quarterly' },
                  { text: <><strong>Unlimited</strong> streaming</> },
                  { text: 'Offline downloads' },
                  { text: 'AI-powered insights' },
                  { text: 'Priority support' },
                  { text: 'Advanced mood analytics' },
                  { text: 'Digital Pet Hub (all pets)' },
                ]}
              />
              {patientCta('premium_monthly', true)}
            </article>
          </div>

          <div className="section-label">Therapy Sessions</div>
          <h2 className="section-title">Session Fees (Paid Per Session)</h2>
          <p className="section-desc">
            Sessions are booked and paid separately via PhonePe. Revenue split: Provider 60% / MANAS360 40%.
            Video sessions include +10% surcharge.
          </p>
          <table>
            <thead>
              <tr>
                <th>Provider Type</th>
                <th>Standard Fee</th>
                <th>Video (+10%)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>🧠 Clinical Psychologist</td>
                <td><strong>₹699</strong></td>
                <td>₹769</td>
                <td>Assessment, testing, CBT/DBT</td>
              </tr>
              <tr>
                <td>⚕️ Psychiatrist (MD)</td>
                <td><strong>₹999</strong></td>
                <td>₹1,099</td>
                <td>Diagnosis, e-Prescription, medication</td>
              </tr>
              <tr>
                <td>🌟 NLP Coach</td>
                <td><strong>₹999</strong></td>
                <td>₹1,099</td>
                <td>NLP + Neuro Associative Conditioning</td>
              </tr>
              <tr>
                <td>👔 Executive Coach</td>
                <td><strong>₹1,999</strong></td>
                <td>₹2,199</td>
                <td>Leadership, career, performance</td>
              </tr>
              <tr>
                <td>🌏 NRI Coach</td>
                <td><strong>₹2,999</strong></td>
                <td>₹3,299</td>
                <td>Cross-cultural, dual timezone</td>
              </tr>
            </tbody>
          </table>

          <div className="section-label">Specialty Services</div>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Price</th>
                <th>Format</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>💑 Couple Therapy</td>
                <td><strong>₹1,499</strong>/session</td>
                <td>Video 60 min</td>
                <td>By appointment</td>
              </tr>
              <tr>
                <td>😴 Sleep Therapy</td>
                <td><strong>₹1,499</strong>/session</td>
                <td>Video 45 min</td>
                <td>Evening slots</td>
              </tr>
              <tr>
                <td>🌏 NRI — Psychologist</td>
                <td><strong>₹2,999</strong>/session</td>
                <td>Video 50 min</td>
                <td>IST eve / NRI AM</td>
              </tr>
              <tr>
                <td>🌏 NRI — Psychiatrist</td>
                <td><strong>₹3,499</strong>/session</td>
                <td>Video 30 min</td>
                <td>IST eve / NRI AM</td>
              </tr>
              <tr>
                <td>🌏 NRI — Therapist</td>
                <td><strong>₹3,599</strong>/session</td>
                <td>Video 50 min</td>
                <td>IST eve / NRI AM</td>
              </tr>
              <tr>
                <td>👔 Executive (Weekend)</td>
                <td><strong>₹1,999</strong>/session</td>
                <td>Video 60 min</td>
                <td>Sat & Sun only</td>
              </tr>
            </tbody>
          </table>

          <div className="section-label">Add-On Features (À la Carte)</div>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>1 Hour</th>
                <th>3 Hours ⭐</th>
                <th>5 Hours</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>🤖 AnytimeBuddy</td>
                <td>₹399</td>
                <td><strong>₹999</strong></td>
                <td>₹1,699</td>
                <td>On-demand emotional support chat (24/7 AI companion)</td>
              </tr>
              <tr>
                <td>🐾 Digital Pet Hub</td>
                <td colSpan={3}>Free starter + Premium unlock via subscription</td>
                <td>Neurotransmitter companions (Chintu, Bholu, Mithi, Dheeraj)</td>
              </tr>
              <tr>
                <td>📞 IVR Therapy</td>
                <td colSpan={3}>Pay-per-session (same as standard fees)</td>
                <td>Voice-based therapy + PHQ screening via phone call</td>
              </tr>
              <tr>
                <td>💬 VentBuddy</td>
                <td colSpan={3}>3 free/day, Premium unlimited</td>
                <td>Anonymous venting with trained AI listener</td>
              </tr>
              <tr>
                <td>🎵 Sound Therapy</td>
                <td colSpan={2}>₹30/track</td>
                <td>₹250/bundle (10 tracks)</td>
                <td>Own forever, unlimited play + download</td>
              </tr>
            </tbody>
          </table>
          <p className="tbl-note">
            ASHA referral patients: First 3 sessions free/subsidized · Student/Employee pricing: As per corporate contract
          </p>
        </div>

        {/* PROVIDER */}
        <div
          id="panel-provider"
          role="tabpanel"
          className={cardClass('role-panel', activeRole === 'provider' && 'active')}
        >
          <div className="section-label">Platform Access (Required)</div>
          <h2 className="section-title">₹99/month Platform Access</h2>
          <p className="section-desc">
            All providers pay ₹99/M (or ₹279/Q) for platform access — profile hosting, credential verification,
            dashboard, payment processing. Required before any lead delivery. Payment method collected at profile creation.
          </p>

          <div className="section-label">Lead Subscription Tiers</div>
          <h2 className="section-title">Choose Your Lead Plan</h2>
          <p className="section-desc">
            Guaranteed weekly leads auto-pushed to your dashboard. Revenue split on sessions: You keep 60%, platform
            takes 40%. Lead subscription fees are separate.
          </p>

          <div className="cards-row cards-4">
            <article className="card card-compact">
              <div className="card-icon card-icon-sm">🆓</div>
              <div className="card-name card-name-sm">Free</div>
              <div className="card-price">
                <span className="amt amt-sm">₹0</span>
                <span className="per">/month</span>
              </div>
              <div className="card-target">Profile only</div>
              <FeatureList
                compact
                items={[
                  { text: 'Basic text profile' },
                  { text: 'Basic stats dashboard' },
                  { text: 'Self-serve FAQ support' },
                  { text: '0 leads / week', excluded: true },
                  { text: 'No marketplace', excluded: true },
                ]}
              />
              <CardCta small onClick={() => navigate('/provider-landing')}>
                Create Profile
              </CardCta>
            </article>

            <article className="card">
              <div className="card-icon">💡</div>
              <div className="card-name">Basic</div>
              <div className="card-price">
                <span className="amt">₹199</span>
                <span className="per">/month</span>
              </div>
              <div className="card-target">New providers · testing the waters</div>
              <FeatureList
                items={[
                  { text: <><strong>3 leads/week</strong> (~12/month)</> },
                  { text: 'Warm + Cold leads' },
                  { text: 'Enhanced profile (photo + video)' },
                  { text: 'Full analytics + conversion tracking' },
                  { text: 'Marketplace at full price' },
                  { text: '✅ Verified Provider badge' },
                  { text: 'Email support (48h)' },
                ]}
              />
              <CardCta onClick={() => navigate('/provider/subscription')}>Start 6-Day Trial</CardCta>
            </article>

            <article className="card popular card-hero card-hero-sage">
              <div className="card-icon">⭐</div>
              <div className="card-name">Standard</div>
              <div className="card-price">
                <span className="amt">₹299</span>
                <span className="per">/month</span>
                <span className="save">₹829/Q</span>
              </div>
              <div className="card-target">Active providers · building practice</div>
              <div className="card-callout card-callout-green">
                💰 Providers wanting to increase their income by 70% have opted this plan
              </div>
              <FeatureList
                items={[
                  { text: <><strong>6 leads/week</strong> (~24/month)</> },
                  { text: 'Hot + Warm + Cold leads' },
                  { text: 'Featured profile (search priority)' },
                  { text: 'Full analytics + patient insights' },
                  { text: <>Marketplace at <strong>10% off</strong></> },
                  { text: '✅ Verified + Preferred badge' },
                  { text: 'Priority email (24h)' },
                ]}
              />
              <CardCta filled large onClick={() => navigate('/provider/subscription')}>
                Start 6-Day Trial →
              </CardCta>
            </article>

            <article className="card">
              <div className="card-icon">🏆</div>
              <div className="card-name">Premium</div>
              <div className="card-price">
                <span className="amt">₹399</span>
                <span className="per">/month</span>
                <span className="save">₹1,099/Q</span>
              </div>
              <div className="card-target">Full-time providers · max patient flow</div>
              <FeatureList
                items={[
                  { text: <><strong>7 leads/week</strong> (~28/month) — daily!</> },
                  { text: 'Priority Hot leads (first access)' },
                  { text: 'Spotlight profile (top + badge)' },
                  { text: 'Full analytics + AI recommendations' },
                  { text: <>Marketplace at <strong>20% off</strong></> },
                  { text: '✅ Verified + Premium badge' },
                  { text: 'Dedicated manager + WhatsApp' },
                ]}
              />
              <CardCta filled onClick={() => navigate('/provider/subscription')}>
                Start 6-Day Trial
              </CardCta>
            </article>
          </div>

          <div className="section-label">Marketplace Add-On</div>
          <h2 className="section-title">Buy Additional Leads Beyond Your Weekly Allocation</h2>
          <table>
            <thead>
              <tr>
                <th>Lead Type</th>
                <th>Price</th>
                <th>Match Score</th>
                <th>Conversion</th>
                <th>Characteristics</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="tag tag-hot">🔥 HOT</span></td>
                <td><strong>₹299</strong></td>
                <td>90–100</td>
                <td>~70%</td>
                <td>3+ specialization match, language + budget aligned</td>
              </tr>
              <tr>
                <td><span className="tag tag-warm">🌟 WARM</span></td>
                <td><strong>₹199</strong></td>
                <td>70–89</td>
                <td>~50%</td>
                <td>2 specialization match, language aligned</td>
              </tr>
              <tr>
                <td><span className="tag tag-cold">❄️ COLD</span></td>
                <td><strong>₹99</strong></td>
                <td>50–69</td>
                <td>~25%</td>
                <td>1 specialization match, budget stretch</td>
              </tr>
            </tbody>
          </table>
          <p className="tbl-note">
            Free tier has NO marketplace access · Subscription leads expire in 48h (72h for Premium) · Marketplace
            leads: first-come, first-served
          </p>

          <div className="section-label">Session Revenue</div>
          <h2 className="section-title">You Keep 60% of Every Session</h2>
          <table>
            <thead>
              <tr>
                <th>Your Type</th>
                <th>Session Fee</th>
                <th>You Get (60%)</th>
                <th>Platform (40%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Therapist</td>
                <td>₹500–₹2,000</td>
                <td><strong>₹300–₹1,200</strong></td>
                <td>₹200–₹800</td>
              </tr>
              <tr>
                <td>Psychologist</td>
                <td>₹699–₹2,500</td>
                <td><strong>₹419–₹1,500</strong></td>
                <td>₹280–₹1,000</td>
              </tr>
              <tr>
                <td>Psychiatrist</td>
                <td>₹999–₹5,000</td>
                <td><strong>₹599–₹3,000</strong></td>
                <td>₹400–₹2,000</td>
              </tr>
              <tr>
                <td>NLP Coach</td>
                <td>₹500–₹1,500</td>
                <td><strong>₹300–₹900</strong></td>
                <td>₹200–₹600</td>
              </tr>
              <tr>
                <td>Executive Coach</td>
                <td>₹1,500–₹5,000</td>
                <td><strong>₹900–₹3,000</strong></td>
                <td>₹600–₹2,000</td>
              </tr>
            </tbody>
          </table>

          <div className="roi-box">
            <h4>💰 Your ROI — Why Upgrading Makes Sense</h4>
            <p className="section-desc" style={{ maxWidth: '100%' }}>
              Assuming ₹1,500 avg session fee · 40-55% conversion · 2.5-3 sessions/patient/month
            </p>
            <div className="roi-grid">
              <div className="roi-stat">
                <div className="val">₹11,501</div>
                <div className="lbl">Basic Net Income/Mo</div>
              </div>
              <div className="roi-stat">
                <div className="val">₹26,701</div>
                <div className="lbl">Standard Net Income/Mo</div>
              </div>
              <div className="roi-stat">
                <div className="val">₹40,101</div>
                <div className="lbl">Premium Net Income/Mo</div>
              </div>
              <div className="roi-stat">
                <div className="val">10,050%</div>
                <div className="lbl">Premium ROI on Fee</div>
              </div>
            </div>
            <p className="tbl-note" style={{ marginTop: 10 }}>
              Key pitch: &quot;₹199/month generates ₹11,500+ in income — that&apos;s 58× return&quot; · MANAS360 Academy
              certified providers get 20% more Hot leads
            </p>
          </div>

          <div className="section-label">Monthly Earning Potential</div>
          <table>
            <thead>
              <tr>
                <th>Provider Type</th>
                <th>Session Range</th>
                <th>With Basic</th>
                <th>With Standard</th>
                <th>With Premium</th>
                <th>+ Marketplace</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Therapist</td>
                <td>₹500–₹2,000</td>
                <td>₹8K–₹22K</td>
                <td>₹18K–₹54K</td>
                <td><strong>₹24K–₹80K</strong></td>
                <td>+₹5K–₹20K</td>
              </tr>
              <tr>
                <td>Psychologist</td>
                <td>₹699–₹2,500</td>
                <td>₹10K–₹28K</td>
                <td>₹24K–₹68K</td>
                <td><strong>₹32K–₹1L</strong></td>
                <td>+₹7K–₹25K</td>
              </tr>
              <tr>
                <td>Psychiatrist</td>
                <td>₹999–₹5,000</td>
                <td>₹15K–₹56K</td>
                <td>₹36K–₹1.35L</td>
                <td><strong>₹48K–₹2L</strong></td>
                <td>+₹10K–₹50K</td>
              </tr>
              <tr>
                <td>NLP Coach</td>
                <td>₹500–₹1,500</td>
                <td>₹8K–₹17K</td>
                <td>₹18K–₹41K</td>
                <td><strong>₹24K–₹60K</strong></td>
                <td>+₹5K–₹15K</td>
              </tr>
              <tr>
                <td>Executive Coach</td>
                <td>₹1,500–₹5,000</td>
                <td>₹22K–₹56K</td>
                <td>₹54K–₹1.35L</td>
                <td><strong>₹80K–₹2L</strong></td>
                <td>+₹15K–₹50K</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CORPORATE */}
        <div
          id="panel-corporate"
          role="tabpanel"
          className={cardClass('role-panel', activeRole === 'corporate' && 'active')}
        >
          <div className="section-label">Corporate EAP</div>
          <h2 className="section-title">Employee Assistance Programs</h2>
          <p className="section-desc">
            CSR-aligned (Section 135, Companies Act 2013) · 60% cheaper than traditional EAPs · Tax deduction eligible ·
            All tiers include 24/7 AI chatbot, crisis support, corporate dashboard
          </p>

          <div className="cards-row cards-3">
            <article className="card">
              <div className="card-icon">🚀</div>
              <div className="card-name">Startup</div>
              <div className="card-price">
                <span className="amt">₹2L</span>
                <span className="per">/year</span>
              </div>
              <div className="card-target">50–200 employees · ₹1,000/employee/mo</div>
              <FeatureList
                items={[
                  { text: 'Unlimited 1:1 therapy sessions' },
                  { text: 'AI chatbot (24/7)' },
                  { text: '4 group sessions/year' },
                  { text: 'Crisis support hotline' },
                  { text: 'Basic corporate dashboard' },
                  { text: '25% CSR tax deduction' },
                ]}
              />
              <CardCta onClick={() => navigate('/corporate-landing')}>Get Quote</CardCta>
            </article>

            <article className="card popular card-hero card-hero-sage">
              <div className="card-icon">📈</div>
              <div className="card-name">Growth</div>
              <div className="card-price">
                <span className="amt">₹5L</span>
                <span className="per">/year</span>
              </div>
              <div className="card-target">200–1,000 employees · ₹500/emp/mo</div>
              <div className="card-callout card-callout-green">
                🏛️ 75% of CSR-funded companies serious on mental health enhancement & productivity increase have opted
                this plan
              </div>
              <FeatureList
                items={[
                  { text: 'All Startup features' },
                  { text: 'Aggregate analytics dashboard' },
                  { text: 'Dedicated Customer Success Manager' },
                  { text: 'Quarterly wellness reports' },
                  { text: 'Manager training workshops' },
                  { text: '25% CSR tax deduction' },
                ]}
              />
              <CardCta filled large onClick={() => navigate('/corporate/onboarding')}>
                Get Growth Quote →
              </CardCta>
            </article>

            <article className="card">
              <div className="card-icon">🏢</div>
              <div className="card-name">Enterprise</div>
              <div className="card-price">
                <span className="amt">₹12L</span>
                <span className="per">/year</span>
              </div>
              <div className="card-target">1,000–5,000 employees · ₹250/emp/mo</div>
              <FeatureList
                items={[
                  { text: 'All Growth features' },
                  { text: 'SSO integration' },
                  { text: 'Custom reporting' },
                  { text: 'API access' },
                  { text: 'Onsite wellness events' },
                  { text: '30% CSR tax deduction' },
                ]}
              />
              <CardCta onClick={() => navigate('/corporate/onboarding')}>Get Quote</CardCta>
            </article>
          </div>

          <div className="section-label">Executive Wellness (Premium B2B)</div>
          <h2 className="section-title">Leadership Mental Health Programs</h2>

          <div className="cards-row cards-3">
            <article className="card">
              <div className="card-icon">🎖️</div>
              <div className="card-name">Corporate Certified</div>
              <div className="card-price">
                <span className="amt">₹5,996</span>
                <span className="per">/month</span>
              </div>
              <div className="card-target">Mid-level managers</div>
              <FeatureList
                items={[
                  { text: '4 sessions/month' },
                  { text: 'Video only' },
                  { text: 'Provider split: 80% / 20%' },
                  { text: 'Certified therapist assigned' },
                  { text: 'Progress reports to HR (anonymized)' },
                ]}
              />
              <CardCta onClick={() => navigate('/corporate/onboarding')}>Enroll Team</CardCta>
            </article>

            <article className="card popular">
              <div className="card-icon">🎯</div>
              <div className="card-name">Executive Concierge</div>
              <div className="card-price">
                <span className="amt">₹10,496</span>
                <span className="per">/month</span>
              </div>
              <div className="card-target">Senior leaders</div>
              <FeatureList
                items={[
                  { text: '4 sessions/month' },
                  { text: 'Video + House visits' },
                  { text: 'Provider split: 75% / 25%' },
                  { text: 'Dedicated executive therapist' },
                  { text: 'Wellness concierge (WhatsApp)' },
                ]}
              />
              <CardCta filled onClick={() => navigate('/corporate/onboarding')}>
                Enroll Leaders
              </CardCta>
            </article>

            <article className="card">
              <div className="card-icon">👑</div>
              <div className="card-name">Leadership Elite</div>
              <div className="card-price">
                <span className="amt">₹19,996</span>
                <span className="per">/month</span>
              </div>
              <div className="card-target">C-suite / Founders</div>
              <FeatureList
                items={[
                  { text: <><strong>Unlimited</strong> sessions</> },
                  { text: 'Video + House visits (unlimited)' },
                  { text: 'Provider split: 70% / 30%' },
                  { text: 'Personal therapist on retainer' },
                  { text: 'Family extension available' },
                ]}
              />
              <CardCta onClick={() => navigate('/corporate/onboarding')}>Contact Us</CardCta>
            </article>
          </div>

          <div className="section-label">Institutional Partnerships</div>
          <table>
            <thead>
              <tr>
                <th>Partner Type</th>
                <th>Model</th>
                <th>Pricing</th>
                <th>Revenue Flow</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>🏥 Medical Colleges (34 in KA)</td>
                <td>Referral + Training</td>
                <td>Free / Subsidized</td>
                <td>Volume-based</td>
                <td>DIMHANS Dharwad</td>
              </tr>
              <tr>
                <td>🏛️ Government (DMHP)</td>
                <td>Integration</td>
                <td>Per-referral fee</td>
                <td>Government funded</td>
                <td>ASHA referral program</td>
              </tr>
              <tr>
                <td>🛡️ Insurance Companies</td>
                <td>Covered benefit</td>
                <td>Per-member/month</td>
                <td>Insurer pays</td>
                <td>EAP add-on to group health</td>
              </tr>
              <tr>
                <td>💊 Pharmacy Chains</td>
                <td>Referral partner</td>
                <td>Revenue share</td>
                <td>Pharmacy refers</td>
                <td>Apollo / MedPlus tie-up</td>
              </tr>
            </tbody>
          </table>
          <p className="tbl-note">
            ASHA incentive: ₹200/referral (₹50 registration + ₹100 first session + ₹50 engagement bonus at 30 days)
          </p>
        </div>
      </div>

      <footer className="pg-footer">
        🌿 <strong>MANAS360</strong> · All prices in INR · GST 18% additional · Revenue split: Provider 60% / Platform
        40%
        <br />
        6-day free trial for all plans · ₹1 authorization (auto-refunded) · Payment via PhonePe exclusively
      </footer>
    </div>
  );
}
