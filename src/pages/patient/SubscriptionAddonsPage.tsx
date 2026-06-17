import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEFAULT_ADDONS,
  getCheckoutSummaryMinor,
  getPlanById,
  loadCart,
  saveCart,
  type PatientAddonSelection,
} from '../../lib/patientSubscriptionFlow';

export default function SubscriptionAddonsPage() {
  const navigate = useNavigate();
  const [addons, setAddons] = useState<PatientAddonSelection>(DEFAULT_ADDONS);
  const [planId, setPlanId] = useState<'free' | 'monthly' | 'quarterly' | 'premium_monthly'>('monthly');

  useEffect(() => {
    const cart = loadCart();
    if (!cart) {
      navigate('/plans', { replace: true });
      return;
    }
    setPlanId(cart.planId);
    setAddons(cart.addons || DEFAULT_ADDONS);

    if (cart.planId === 'free') {
      navigate('/universal/checkout?type=patient', { replace: true });
    }
  }, [navigate]);

  const summary = useMemo(() => {
    return getCheckoutSummaryMinor({
      planId,
      addons,
      updatedAt: new Date().toISOString(),
    });
  }, [planId, addons]);

  const persistAndProceed = () => {
    saveCart({
      planId,
      addons,
      updatedAt: new Date().toISOString(),
    });
    navigate('/universal/checkout?type=patient');
  };

  const plan = getPlanById(planId);

  return (
    <div className="min-h-screen bg-[#fffdf7] px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4a6741]">Selected Plan</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Enhance your {plan.name} plan</h1>
          <p className="text-sm text-slate-600">Add-ons are optional. GST 18% will be added extra at checkout.</p>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">AnytimeBuddy Add-ons</h2>
          <p className="text-sm text-slate-600 mb-2">Monthly subscription tiers for the AI wellness companion. <strong>(1 hour per day limit on all tiers)</strong></p>
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              { key: 'none', label: 'None' },
              { key: 'anytime_buddy_basic', label: 'Basic INR 399' },
              { key: 'anytime_buddy_standard', label: 'Standard INR 999' },
              { key: 'anytime_buddy_premium', label: 'Premium INR 1699' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setAddons((prev) => ({ ...prev, anytimeBuddyPack: opt.key as any }))}
                className={`rounded-lg border px-3 py-2 text-sm ${addons.anytimeBuddyPack === opt.key ? 'border-[#4a6741] bg-[#e8f0e5]' : 'border-slate-200 bg-white'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-600">
            Time limit resets daily. Add-on is billed monthly along with your plan.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-1">
            <p>
              Current total: <strong>INR {(summary.totalMinor / 100).toFixed(2)}</strong> <span className="text-slate-500">(includes 18% GST extra)</span>
            </p>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal (before GST)</span>
              <span>INR {(summary.subtotalMinor / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>GST (18%)</span>
              <span>INR {(summary.gstMinor / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={persistAndProceed} className="rounded-xl border border-[#4a6741] px-4 py-2 text-sm font-semibold text-[#4a6741]">Skip Add-ons -&gt; Proceed</button>
            <button type="button" onClick={persistAndProceed} className="rounded-xl bg-[#4a6741] px-4 py-2 text-sm font-semibold text-white">Add Selected & Proceed</button>
          </div>
        </section>
      </div>
    </div>
  );
}
