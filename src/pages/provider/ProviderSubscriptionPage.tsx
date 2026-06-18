import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  initiatePlatformPayment,
  getProviderOnboardingErrorMessage,
  resolveProviderIdForOnboarding,
} from '../../api/providerOnboarding';
import {
  DEFAULT_PROVIDER_ADDONS,
  PROVIDER_LEAD_PLANS,
  formatInr,
  getLeadPlanAmountMinor,
  saveProviderCart,
  type ProviderBillingCycle,
  type ProviderLeadPlanId,
} from '../../lib/providerSubscriptionFlow';
import { setStoredPlatformTransactionId } from '../../utils/providerOnboardingStorage';
import { hasProviderSubmittedOnboarding } from '../../lib/providerOnboardingFlow';
import { fetchLeadMarketplacePricing, type LeadMarketplacePricing } from '../../api/provider';

const DEFAULT_LEAD_PRICING: LeadMarketplacePricing = { hot: 299, warm: 199, cold: 99 };

export default function ProviderSubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlatformCycle] = useState<ProviderBillingCycle>('quarterly');
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [leadPricing, setLeadPricing] = useState<LeadMarketplacePricing>(DEFAULT_LEAD_PRICING);

  useEffect(() => {
    fetchLeadMarketplacePricing()
      .then(setLeadPricing)
      .catch(() => setLeadPricing(DEFAULT_LEAD_PRICING));
  }, []);

  const isPlatformActive = user?.platformAccessActive;
  const isOnboardingComplete = hasProviderSubmittedOnboarding(user);
  const canChoosePlan = isPlatformActive && isOnboardingComplete;

  useEffect(() => {
    if (!user || isPlatformActive) return;
    void resolveProviderIdForOnboarding(user, { allowPhoneLookup: false });
  }, [user, isPlatformActive]);

  const handlePlatformPayment = async () => {
    const providerId = await resolveProviderIdForOnboarding(user);
    if (!providerId) {
      setPaymentError(
        'We could not find your provider account. Please log out, sign in again with your registered mobile number, then retry payment.',
      );
      return;
    }

    setPaymentError(null);
    setLoading(true);
    try {
      const result = await initiatePlatformPayment(providerId);
      if (result.transaction_id) {
        // Store in both session AND local storage so it survives the PhonePe full-page redirect
        setStoredPlatformTransactionId(result.transaction_id);
        try {
          localStorage.setItem('manas360_provider_platform_txn_persistent', result.transaction_id);
        } catch {
          // ignore
        }
      }
      if (result.bypassed) {
        alert('Payment Confirmation: ₹99 Platform access activated successfully!');
        window.location.reload();
        return;
      }
      if (!result.payment_url) {
        setPaymentError('Payment could not be started. Please try again.');
        return;
      }
      window.location.href = result.payment_url;
    } catch (err) {
      setPaymentError(getProviderOnboardingErrorMessage(err, 'Failed to start platform payment'));
    } finally {
      setLoading(false);
    }
  };

  const startFlow = (leadPlanId: ProviderLeadPlanId) => {
    if (!canChoosePlan) return;
    saveProviderCart({
      leadPlanId,
      platformCycle: selectedPlatformCycle, // Use the selected one or the one they bought? 
      // Actually, if they are already active, they have a cycle. 
      // For lead plans, cycle doesn't really matter as much for the current backend implementation 
      // but we send it for checkout.
      addons: { ...DEFAULT_PROVIDER_ADDONS },
      updatedAt: new Date().toISOString(),
    });
    if (leadPlanId === 'free') {
      navigate('/universal/checkout?type=provider&planId=lead-free');
      return;
    }
    navigate('/provider/plans/addons');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="mx-auto max-w-7xl px-6 pt-12 space-y-12">
        <header className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => navigate('/provider/dashboard')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1.5 rounded-lg"
            >
              ← Back to Dashboard
            </button>
            <span className="text-[10px] font-black tracking-widest text-[#1f6f5f] uppercase bg-[#1f6f5f]/10 px-2 py-0.5 rounded">
              Provider Hub
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Expand Your Practice</h1>
          <p className="text-slate-500 max-w-2xl leading-relaxed text-lg">
            A simple 2-step process to go live: Activate platform access, verify your profile, and choose your lead growth plan.
          </p>
        </header>

        {/* Step 1: Platform Access */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f6f5f] text-white text-sm font-black">1</span>
              Platform Access
            </h2>
            {isPlatformActive && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-tight shadow-sm shadow-emerald-200/50">
                <CheckCircle2 className="h-4 w-4" /> Activated & Active
              </span>
            )}
          </div>

          {!isPlatformActive ? (
            <div className="rounded-3xl border-2 border-[#1f6f5f]/20 bg-white p-8 shadow-xl shadow-[#1f6f5f]/10">
              <h3 className="text-lg font-bold text-slate-900">Step 1: Platform Access Fee</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">₹99</span>
                <span className="text-sm font-bold text-slate-400">one-time setup</span>
              </div>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                Activate your provider profile, dashboard, and lead marketplace access. Payment is processed securely via PhonePe.
              </p>
              {paymentError ? (
                <p role="alert" className="mt-4 text-sm font-medium text-red-600">{paymentError}</p>
              ) : null}
              <button
                type="button"
                onClick={handlePlatformPayment}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-3 bg-[#1f6f5f] hover:bg-[#145347] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#1f6f5f]/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Pay ₹99</>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4 text-emerald-800">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="font-bold">Platform Status: Active</p>
                <p className="text-sm opacity-90">You have active platform access. Please ensure your clinical profile is verified to unlock lead plans.</p>
              </div>
            </div>
          )}
        </section>

        {/* Marketplace Lead Pricing Reference */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Marketplace Lead Pricing</h2>
          <p className="text-xs text-slate-500 mb-4">Buy additional leads beyond your weekly plan allocation. First-come, first-served.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-sm font-black text-red-700">Hot Lead</p>
                <p className="text-xl font-black text-slate-900">₹{leadPricing.hot}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Score 90–100 · ~70% conversion</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <span className="text-2xl">🌟</span>
              <div>
                <p className="text-sm font-black text-amber-700">Warm Lead</p>
                <p className="text-xl font-black text-slate-900">₹{leadPricing.warm}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Score 70–89 · ~50% conversion</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <span className="text-2xl">❄️</span>
              <div>
                <p className="text-sm font-black text-blue-700">Cold Lead</p>
                <p className="text-xl font-black text-slate-900">₹{leadPricing.cold}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Score 50–69 · ~25% conversion</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">Standard plan gets 10% off · Premium plan gets 20% off on all marketplace purchases. Your weekly subscription leads are included at no extra charge.</p>
        </section>

        {/* Step 2: Lead Growth Plans */}
        <section className={`space-y-8 ${!canChoosePlan ? 'opacity-50' : ''}`}>
          <div className="relative">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-sm font-black">2</span>
              Growth Plans
            </h2>
            {!canChoosePlan && (
              <div className="mt-6 p-6 rounded-2xl bg-white border border-slate-200 border-dashed flex items-center gap-5">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Lead Plans Unlocked After Verification</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {!isPlatformActive
                      ? "Pay the platform access fee (Step 1) to continue."
                      : "Your clinical documents are being verified. We'll notify you once unlocked."}
                  </p>
                  {!isOnboardingComplete && isPlatformActive && (
                    <button
                      type="button"
                      onClick={() => navigate('/onboarding/provider-setup')}
                      className="mt-3 text-xs font-black text-[#1f6f5f] hover:underline"
                    >
                      Complete profile setup →
                    </button>
                  )}
                  {isOnboardingComplete && isPlatformActive && (
                    <button
                      type="button"
                      onClick={() => navigate('/provider/verification-pending')}
                      className="mt-3 text-xs font-black text-[#1f6f5f] hover:underline"
                    >
                      View verification status →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-4 ${!canChoosePlan ? 'pointer-events-none' : ''}`}>
            {PROVIDER_LEAD_PLANS.map((plan) => {
              const leadAmountMinor = getLeadPlanAmountMinor(plan.id, 'quarterly');
              return (
                <article key={plan.id} className="relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm border-b-4 border-b-slate-100">
                  {plan.badge && (
                    <span className="absolute -top-3 left-6 inline-flex rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black text-amber-950 uppercase tracking-tighter">
                      {plan.badge}
                    </span>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-3xl font-black text-slate-900 mt-1">{formatInr(leadAmountMinor)}<span className="text-xs text-slate-400 font-bold">/plan</span></p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1f6f5f] mt-1 opacity-80">Manual One-time Purchase</p>
                  </div>

                  <p className="text-xs font-semibold text-slate-500 mb-6 leading-relaxed flex-grow">{plan.subtitle}</p>

                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[11px] text-slate-600 font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={!canChoosePlan}
                    onClick={() => startFlow(plan.id)}
                    className={`w-full rounded-2xl py-3.5 text-sm font-black transition-all ${canChoosePlan
                        ? 'bg-[#1f6f5f] text-white hover:bg-[#145347] shadow-lg shadow-[#1f6f5f]/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                  >
                    {!canChoosePlan ? 'Pending Verification' : plan.id === 'free' ? 'Select Free Tier' : 'Upgrade Now'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="pt-10 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Secured & Verified Provider Enrollment. Payment processed by PhonePe.
          </p>
        </footer>
      </div>
    </div>
  );
}
