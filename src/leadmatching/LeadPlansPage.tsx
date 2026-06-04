import { useState, useEffect } from 'react';
import { fetchAvailableLeadPlans, selectLeadPlan } from './api';
import { LeadPlanConfig } from './types';
import { Sparkles, Check, Info, Shield, HelpCircle, ArrowRight } from 'lucide-react';

export function LeadPlansPage({ providerId = '60129658-2e05-496f-bf73-e9dfcc4a5402' }: { providerId?: string }) {
  const [plans, setPlans] = useState<LeadPlanConfig[]>([]);
  const [platformFee, setPlatformFee] = useState<number>(99);
  const [revenueSplit, setRevenueSplit] = useState<{ therapist: number; platform: number }>({ therapist: 60, platform: 40 });
  const [marketplaceNote, setMarketplaceNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchAvailableLeadPlans();
        setPlans(response.plans);
        setPlatformFee(response.platform_fee);
        setRevenueSplit(response.revenue_split);
        setMarketplaceNote(response.marketplace_note);
      } catch (err: any) {
        setError(err.message || 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    setPurchasingPlan(planId);
    setError(null);
    try {
      const result = await selectLeadPlan(providerId, planId);
      setSuccessResponse(result);
    } catch (err: any) {
      setError(err.message || 'Failed to select plan');
    } finally {
      setPurchasingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-white bg-slate-950 p-6 rounded-2xl border border-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-slate-400 font-medium">Fetching lead tier details...</p>
      </div>
    );
  }

  if (successResponse) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 text-white shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Plan Selected Successfully!</h2>
        <p className="text-emerald-400 font-medium text-lg mb-6 capitalize">{successResponse.plan} Plan Enrolled</p>
        <p className="text-slate-300 max-w-md mx-auto mb-8 text-base leading-relaxed">
          {successResponse.message}
        </p>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl text-left max-w-md mx-auto mb-8">
          <h3 className="font-semibold text-slate-200 mb-2">Next Step Required:</h3>
          <p className="text-sm text-slate-400 mb-4">You need to pass the "5 Whys" clinical assessment scenario setup before receiving active matching leads.</p>
          <a
            href={successResponse.certification_url}
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            Start Certification <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            Leads Marketplace Tiers
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Select Your Lead Match Plan
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Gain verified, location-specific patient matches tailored to your specialty. Select a plan to begin unlocking clinical assessments.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/35 text-red-400 p-4 rounded-xl mb-8 flex items-center gap-3">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan) => {
            const isPopular = plan.popular;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 rounded-2xl transition-all duration-300 ${
                  isPopular
                    ? 'bg-slate-900 border-2 border-emerald-500/60 shadow-xl shadow-emerald-500/5 transform md:-translate-y-2'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 right-6 flex items-center gap-1 px-3 py-1 bg-emerald-500 text-slate-950 text-xs font-bold uppercase rounded-full shadow-md">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                )}

                <div>
                  {/* Name and Quality Range */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-100">{plan.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
                        plan.match_quality === 'platinum' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        plan.match_quality === 'hot' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        plan.match_quality === 'warm' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {plan.match_quality}
                      </span>
                      <span className="text-xs text-slate-400">Match score: {plan.match_range}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="my-6">
                    <span className="text-4xl font-extrabold text-white">₹{plan.lead_price}</span>
                    <span className="text-sm text-slate-400"> / lead accept</span>
                  </div>

                  {/* Limits and specific details */}
                  <div className="border-t border-slate-800/80 pt-4 pb-6 space-y-3.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Monthly quota limit:</span>
                      <span className="text-slate-200 font-semibold">
                        {plan.leads_per_month === 9999 ? 'Unlimited' : `${plan.leads_per_month} leads`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Refund Guarantee:</span>
                      <span className="text-slate-200 font-semibold">{plan.refund_pct}% refund</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.corporate_leads && (
                      <li className="flex items-start gap-2.5 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-emerald-400/90 font-medium">B2B Corporate Access</span>
                      </li>
                    )}
                    {plan.nri_leads && (
                      <li className="flex items-start gap-2.5 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-indigo-400/90 font-medium">Global NRI Pool Certified</span>
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={purchasingPlan !== null}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isPopular
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasingPlan === plan.id ? 'Selecting...' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footnotes & Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-900 pt-12 text-slate-400 text-sm">
          
          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900/60">
            <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Platform Fee & Split
            </h4>
            <p className="leading-relaxed">
              Active platform listing has an access fee of ₹{platformFee}/month. Successful patient sessions operate on a {revenueSplit.therapist}% (Therapist) / {revenueSplit.platform}% (Platform) split.
            </p>
          </div>

          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900/60">
            <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" /> Pricing Degradation
            </h4>
            <p className="leading-relaxed">
              {marketplaceNote}. Leads drop in pricing tier every 24 hours to maximize conversion opportunities.
            </p>
          </div>

          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900/60">
            <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-400" /> Refund Guarantee
            </h4>
            <p className="leading-relaxed">
              If a patient no-shows or if the provider fails to schedule contact within 48 hours, a 50% refund is credited back to your balance immediately.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
export default LeadPlansPage;
