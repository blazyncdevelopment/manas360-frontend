import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  getAdminPricingConfig,
  updateAdminPricingConfig,
  toggleGlobalFreeSignups,
  waiveUserSubscription,
  type AdminPricingPlanItem,
  type AdminPricingBundleItem,
  type AdminPricingConfig,
  type AdminPricingSessionItem,
} from '../../api/admin.api';
import { isPlatformAdminUser, useAuth } from '../../context/AuthContext';

type SessionEdit = { providerType: string; durationMinutes: number; price: number };
type BundleEdit  = { bundleName: string; minutes: number; price: number };
type PlanEdit    = { planKey: string; planName: string; price: number; billingCycle: string; active: boolean; description?: string | null };
type ProviderPlanEdit = {
  planKey: string; planName: string; monthly: number; quarterly: number; leads: number;
  hotLeads: number; warmLeads: number; coldLeads: number;
  discount: number; claim: number;
  leadsPerMonth: number; leadQualityMix: string; leadDelivery: string; profileListing: string; dashboardAccess: string;
  certificationBadge: string; support: string; recommendedFor: string;
};

const labelForProviderType = (value: string): string => {
  const key = String(value || '').toLowerCase().replace(/_/g, '-');
  const map: Record<string, string> = {
    'clinical-psychologist': 'Clinical Psychologist',
    'psychiatrist':          'Psychiatrist (MD)',
    'nlp-coach':             'NLP Coach',
    'executive-coach':       'Executive Coach',
    'couple-therapist':      'Couple Therapist',
    'sleep-therapist':       'Sleep Therapist',
    'specialized-therapist': 'Specialized Therapist',
    'psychologist':          'Psychologist',
    'therapist':             'Therapist',
    'nri-psychologist':      'NRI Psychologist',
    'nri-psychiatrist':      'NRI Psychiatrist (MD)',
    'nri-therapist':         'NRI Therapist',
    'nri-coach':             'NRI Coach',
  };
  return map[key] ?? value;
};

const isNri      = (v: string) => String(v).toLowerCase().startsWith('nri');
const isSpecialty = (v: string) => { const k = String(v).toLowerCase(); return k === 'couple-therapist' || k === 'sleep-therapist'; };

export default function AdminPricingManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const canAccess = isPlatformAdminUser(user);

  // ── all state ──────────────────────────────────────────────────────────────
  const [config,       setConfig]       = useState<AdminPricingConfig | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);

  const [platformFee,  setPlatformFee]  = useState('99');
  const [surcharge,    setSurcharge]    = useState('20');
  const [planRows,     setPlanRows]     = useState<PlanEdit[]>([]);
  const [providerPlanRows, setProviderPlanRows] = useState<ProviderPlanEdit[]>([]);
  const [editingProviderPlanIndex, setEditingProviderPlanIndex] = useState<number | null>(null);
  const [sessionRows,  setSessionRows]  = useState<SessionEdit[]>([]);
  const [bundleRows,   setBundleRows]   = useState<BundleEdit[]>([]);

  const [showChanged,  setShowChanged]  = useState(true);
  const [addingRow,    setAddingRow]    = useState(false);
  const [newRow,       setNewRow]       = useState<SessionEdit>({ providerType: '', durationMinutes: 50, price: 0 });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editBuffer,   setEditBuffer]   = useState<SessionEdit | null>(null);

  const [freeDays,     setFreeDays]     = useState('30');
  const [waiveForm,    setWaiveForm]    = useState({ userId: '', planKey: 'basic', durationDays: '30', reason: '' });

  // ── all memo (must be before early returns) ────────────────────────────────
  const impact             = config?.impactSummary;
  const currentPlatformFee = Number(config?.platformFee?.monthlyFee ?? 0);
  const nextPlatformFee    = Number(platformFee || 0);
  const platformFeeDelta   = Number.isFinite(nextPlatformFee) ? nextPlatformFee - currentPlatformFee : 0;
  const feeChangePending   = Number.isFinite(nextPlatformFee) && nextPlatformFee !== currentPlatformFee;

  const lockedRatio = useMemo(() => {
    if (!impact || impact.activeSubscriptions <= 0) return 0;
    return Math.round((impact.lockedToPreviousPrice / impact.activeSubscriptions) * 100);
  }, [impact]);

  const alignedRatio = useMemo(() => {
    if (!impact || impact.activeSubscriptions <= 0) return 0;
    return Math.round((impact.alignedWithCurrentPrice / impact.activeSubscriptions) * 100);
  }, [impact]);

  const projectedLocked = useMemo(() => {
    if (!impact) return 0;
    return feeChangePending ? impact.activeSubscriptions : impact.lockedToPreviousPrice;
  }, [impact, feeChangePending]);

  const projectedAligned = useMemo(() => {
    if (!impact) return 0;
    return feeChangePending ? 0 : impact.alignedWithCurrentPrice;
  }, [impact, feeChangePending]);

  const projected30dDelta = useMemo(() => {
    if (!impact || !Number.isFinite(platformFeeDelta)) return 0;
    return platformFeeDelta * impact.renewalsNext30Days;
  }, [impact, platformFeeDelta]);

  const sessionDeltaRows = useMemo(() => {
    const baseline = new Map<string, number>();
    for (const row of config?.sessionPricing || []) {
      baseline.set(`${row.providerType}::${row.durationMinutes}`, Number(row.price) || 0);
    }
    return sessionRows
      .map((row) => {
        const key = `${row.providerType}::${row.durationMinutes}`;
        const oldPrice = baseline.get(key) ?? 0;
        const newPrice = Number(row.price) || 0;
        return { providerType: row.providerType, durationMinutes: row.durationMinutes, oldPrice, newPrice, delta: newPrice - oldPrice };
      })
      .sort((a, b) => a.providerType.localeCompare(b.providerType) || a.durationMinutes - b.durationMinutes);
  }, [config?.sessionPricing, sessionRows]);

  const changedRows  = useMemo(() => sessionDeltaRows.filter((r) => r.delta !== 0), [sessionDeltaRows]);
  const totalDelta   = useMemo(() => changedRows.reduce((s, r) => s + r.delta, 0), [changedRows]);
  const visibleDelta = useMemo(() => (showChanged ? changedRows : sessionDeltaRows), [showChanged, changedRows, sessionDeltaRows]);

  const groupedPreview = useMemo(() => {
    const map = new Map<string, SessionEdit[]>();
    for (const row of sessionRows) {
      if (!map.has(row.providerType)) map.set(row.providerType, []);
      map.get(row.providerType)!.push(row);
    }
    return Array.from(map.entries());
  }, [sessionRows]);

  // ── data loading ───────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await getAdminPricingConfig();
      const data = res?.data;
      setConfig(data);
      setPlatformFee(String(data?.platformFee?.monthlyFee ?? 99));
      setSurcharge(String(data?.surchargePercent ?? 20));
      setPlanRows((data?.platformPlans || []).map((r: AdminPricingPlanItem) => ({
        planKey: r.planKey, planName: r.planName, price: r.price,
        billingCycle: r.billingCycle, active: r.active, description: r.description ?? null,
      })));
      setSessionRows((data?.sessionPricing || []).map((r: AdminPricingSessionItem) => ({
        providerType: r.providerType, durationMinutes: r.durationMinutes, price: r.price,
      })));
      setBundleRows((data?.premiumBundles || []).map((r: AdminPricingBundleItem) => ({
        bundleName: r.bundleName, minutes: r.minutes, price: r.price,
      })));

      const defaultProviderPlans: ProviderPlanEdit[] = [
        { 
          planKey: 'free', planName: 'Free', monthly: 0, quarterly: 0, leads: 0,
          hotLeads: 0, warmLeads: 0, coldLeads: 0,
          discount: 0, claim: 0,
          leadsPerMonth: 0, leadQualityMix: '—', leadDelivery: '—', profileListing: 'Basic (text only)',
          dashboardAccess: 'Basic stats only', certificationBadge: '❌ No', support: 'Self-serve FAQ', recommendedFor: 'Profile only'
        },
        { 
          planKey: 'basic', planName: 'Basic', monthly: 199, quarterly: 549, leads: 3,
          hotLeads: 0, warmLeads: 1, coldLeads: 2,
          discount: 0, claim: 24,
          leadsPerMonth: 12, leadQualityMix: 'Warm + Cold only', leadDelivery: 'Auto-pushed every Mon & Thu', profileListing: 'Enhanced (photo + video intro)',
          dashboardAccess: 'Full analytics + conversion tracking', certificationBadge: '✅ Verified Provider', support: 'Email support (48h response)', recommendedFor: 'New providers (testing the waters)'
        },
        { 
          planKey: 'standard', planName: 'Standard', monthly: 299, quarterly: 829, leads: 6,
          hotLeads: 1, warmLeads: 2, coldLeads: 3,
          discount: 10, claim: 24,
          leadsPerMonth: 24, leadQualityMix: 'Hot + Warm + Cold', leadDelivery: 'Auto-pushed every Mon, Wed & Fri', profileListing: 'Featured (search priority)',
          dashboardAccess: 'Full analytics + patient insights', certificationBadge: '✅ Verified + Preferred', support: 'Priority email (24h response)', recommendedFor: 'Active providers (building practice)'
        },
        { 
          planKey: 'premium', planName: 'Premium', monthly: 399, quarterly: 1099, leads: 7,
          hotLeads: 3, warmLeads: 2, coldLeads: 2,
          discount: 20, claim: 48,
          leadsPerMonth: 28, leadQualityMix: 'Priority Hot leads (first access)', leadDelivery: 'Auto-pushed daily (7 days/week)', profileListing: 'Spotlight (top of results + badge)',
          dashboardAccess: 'Full analytics + AI recommendations', certificationBadge: '✅ Verified + Premium', support: 'Dedicated manager + WhatsApp', recommendedFor: 'Full-time providers (max patient flow)'
        },
      ];
      setProviderPlanRows(defaultProviderPlans.map(dp => {
        const p = data?.providerPlans?.[dp.planKey];
        return p ? {
          ...dp,
          monthly: p.price ?? dp.monthly,
          quarterly: p.quarterlyPrice ?? dp.quarterly,
          leads: p.leadsPerWeek ?? dp.leads,
          hotLeads: p.hotLeads ?? dp.hotLeads,
          warmLeads: p.warmLeads ?? dp.warmLeads,
          coldLeads: p.coldLeads ?? dp.coldLeads,
          discount: p.discount ?? dp.discount,
          claim: p.claimWindowHours ?? dp.claim,
          leadsPerMonth: p.leadsPerMonth ?? dp.leadsPerMonth,
          leadQualityMix: p.leadQualityMix ?? dp.leadQualityMix,
          leadDelivery: p.leadDelivery ?? dp.leadDelivery,
          profileListing: p.profileListing ?? dp.profileListing,
          dashboardAccess: p.dashboardAccess ?? dp.dashboardAccess,
          certificationBadge: p.certificationBadge ?? dp.certificationBadge,
          support: p.support ?? dp.support,
          recommendedFor: p.recommendedFor ?? dp.recommendedFor,
        } : dp;
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load pricing configuration.');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) { setLoading(false); return; }
    void load();
  }, [canAccess]);

  // ── early returns (after all hooks) ───────────────────────────────────────
  if (authLoading) {
    return <div className="rounded-lg border border-ink-100 bg-white px-4 py-3 text-sm text-ink-600">Checking permissions...</div>;
  }
  if (!canAccess) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // ── handlers ──────────────────────────────────────────────────────────────
  const removeSessionRow = (index: number) => {
    if (editingIndex === index) { setEditingIndex(null); setEditBuffer(null); }
    setSessionRows(sessionRows.filter((_, i) => i !== index));
  };

  const startEditRow = (index: number, row: SessionEdit) => {
    setEditingIndex(index);
    setEditBuffer({ ...row });
  };

  const saveEditRow = () => {
    if (editingIndex === null || !editBuffer) return;
    const trimmed = editBuffer.providerType.trim();
    if (!trimmed) { setError('Provider type is required.'); return; }
    const conflict = sessionRows.findIndex(
      (r, i) => i !== editingIndex && r.providerType === trimmed && r.durationMinutes === editBuffer.durationMinutes
    );
    if (conflict !== -1) { setError(`Row for "${trimmed}" / ${editBuffer.durationMinutes} min already exists.`); return; }
    const next = [...sessionRows];
    next[editingIndex] = { providerType: trimmed, durationMinutes: editBuffer.durationMinutes, price: editBuffer.price };
    setSessionRows(next);
    setEditingIndex(null);
    setEditBuffer(null);
    setError(null);
  };

  const cancelEditRow = () => { setEditingIndex(null); setEditBuffer(null); setError(null); };

  const updateBundlePrice = (index: number, val: string) => {
    const next = [...bundleRows];
    const p = Number(val);
    next[index] = { ...next[index], price: Number.isFinite(p) ? p : 0 };
    setBundleRows(next);
  };

  const updatePlanRow = (index: number, patch: Partial<PlanEdit>) => {
    const next = [...planRows];
    next[index] = { ...next[index], ...patch };
    setPlanRows(next);
  };

  const updateProviderPlanRow = (index: number, patch: Partial<ProviderPlanEdit>) => {
    const next = [...providerPlanRows];
    next[index] = { ...next[index], ...patch };
    setProviderPlanRows(next);
  };

  const addSessionRow = () => {
    const pt = newRow.providerType.trim();
    if (!pt) { setError('Provider type is required.'); return; }
    if (sessionRows.some((r) => r.providerType === pt && r.durationMinutes === newRow.durationMinutes)) {
      setError(`Row for "${pt}" / ${newRow.durationMinutes} min already exists.`);
      return;
    }
    setSessionRows([...sessionRows, { ...newRow }]);
    setNewRow({ providerType: '', durationMinutes: 50, price: 0 });
    setAddingRow(false);
    setError(null);
  };

  const onSave = async () => {
    setError(null);
    setSuccess(null);
    const fee       = Number(platformFee);
    const surchPct  = Number(surcharge);
    if (!Number.isFinite(fee) || fee < 0)                        { setError('Platform fee must be a valid non-negative number.'); return; }
    if (!Number.isFinite(surchPct) || surchPct < 0 || surchPct > 100) { setError('Surcharge must be 0–100.'); return; }
    if (sessionRows.some((r) => !Number.isFinite(r.price) || r.price < 0)) { setError('All session prices must be valid.'); return; }
    if (bundleRows.some((r) => !Number.isFinite(r.price)  || r.price < 0)) { setError('All add-on prices must be valid.'); return; }

    setSaving(true);
    try {
      await updateAdminPricingConfig({
        platform_fee: fee,
        preferred_time_surcharge: surchPct,
        plans: planRows.map((r) => ({
          planKey: r.planKey, planName: r.planName, price: r.price,
          billingCycle: r.billingCycle, description: r.description ?? null, active: r.active,
        })),
        session_pricing: sessionRows.map((r) => ({
          providerType: r.providerType,
          durationMinutes: r.durationMinutes,
          price: r.price,
          providerShare: Math.round(r.price * 0.6),
          platformShare: r.price - Math.round(r.price * 0.6),
          active: true,
        })),
        premium_bundles: bundleRows.map((r) => ({
          bundleName: r.bundleName, minutes: r.minutes, price: r.price, active: true,
        })),
        providerPlans: providerPlanRows.reduce((acc, r) => {
          acc[r.planKey] = {
            price: r.monthly,
            quarterlyPrice: r.quarterly,
            leadsPerWeek: r.leads,
            hotLeads: r.hotLeads,
            warmLeads: r.warmLeads,
            coldLeads: r.coldLeads,
            discount: r.discount,
            claimWindowHours: r.claim,
            leadsPerMonth: r.leadsPerMonth,
            leadQualityMix: r.leadQualityMix,
            leadDelivery: r.leadDelivery,
            profileListing: r.profileListing,
            dashboardAccess: r.dashboardAccess,
            certificationBadge: r.certificationBadge,
            support: r.support,
            recommendedFor: r.recommendedFor,
          };
          return acc;
        }, {} as Record<string, any>),
      });
      await load();
      setSuccess('Pricing saved successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to save pricing.');
    } finally {
      setSaving(false);
    }
  };

  const onToggleFree = async () => {
    setSaving(true);
    try {
      await toggleGlobalFreeSignups(Number(freeDays));
      setSuccess(`Offer activated: new sign-ups are free for ${freeDays} days.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update global offer.');
    } finally {
      setSaving(false);
    }
  };

  const onWaive = async () => {
    if (!waiveForm.userId.trim()) return;
    setSaving(true);
    try {
      const res = await waiveUserSubscription({
        userId: waiveForm.userId, planKey: waiveForm.planKey,
        durationDays: Number(waiveForm.durationDays), reason: waiveForm.reason,
      });
      setSuccess(res?.data?.message || 'Waiver granted.');
      setWaiveForm({ userId: '', planKey: 'basic', durationDays: '30', reason: '' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to grant waiver.');
    } finally {
      setSaving(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-24">

      {/* Header */}
      <div className="rounded-xl border border-ink-100 bg-white p-5">
        <h2 className="font-display text-xl font-bold text-ink-800">Pricing Management</h2>
        <p className="mt-1 text-sm text-ink-600">
          Set session prices, subscription plans, and add-on tiers. Changes take effect immediately after saving.
        </p>
      </div>

      {/* Alerts */}
      {loading  && <div className="rounded-lg border border-ink-100 bg-white px-4 py-3 text-sm text-ink-500">Loading pricing data...</div>}
      {error    && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success  && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {/* Subscription impact cards */}
      {impact && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          <ImpactCard label="Total Subs"     value={String(impact.totalSubscriptions)} />
          <ImpactCard label="Active Subs"    value={String(impact.activeSubscriptions)} />
          <ImpactCard label="Locked Prev"    value={String(impact.lockedToPreviousPrice)}  note={`${lockedRatio}% of active`}  tone={lockedRatio  >= 60 ? 'warning' : lockedRatio  >= 30 ? 'neutral' : 'good'} />
          <ImpactCard label="Aligned Now"    value={String(impact.alignedWithCurrentPrice)} note={`${alignedRatio}% of active`} tone={alignedRatio >= 70 ? 'good'    : alignedRatio >= 40 ? 'neutral' : 'warning'} />
          <ImpactCard label="Renewals 7d"    value={String(impact.renewalsNext7Days)}   note="Immediate window" tone={impact.renewalsNext7Days  >= 20 ? 'warning' : 'neutral'} />
          <ImpactCard label="Renewals 30d"   value={String(impact.renewalsNext30Days)}  note="Near-term impact"  tone={impact.renewalsNext30Days >= 50 ? 'warning' : 'neutral'} />
        </div>
      )}

      {/* Impact simulation */}
      {impact && (
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold text-ink-800">Pre-Save Impact Simulation</h3>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${feeChangePending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {feeChangePending ? 'Fee change pending' : 'No fee change pending'}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500">Heuristic preview — based on active subscriptions and 30-day renewals.</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-ink-100 bg-ink-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Platform Fee Delta</p>
              <p className="mt-1 text-sm font-semibold text-ink-800">₹{currentPlatformFee} → ₹{Number.isFinite(nextPlatformFee) ? nextPlatformFee : currentPlatformFee}</p>
              <p className={`mt-1 text-xs font-semibold ${platformFeeDelta > 0 ? 'text-amber-700' : platformFeeDelta < 0 ? 'text-emerald-700' : 'text-ink-500'}`}>
                {platformFeeDelta > 0 ? '+' : ''}₹{platformFeeDelta}
              </p>
            </div>
            <div className="rounded-lg border border-ink-100 bg-ink-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Projected Immediate Mix</p>
              <p className="mt-1 text-sm text-ink-700">Locked: <span className="font-semibold">{projectedLocked}</span></p>
              <p className="text-sm text-ink-700">Aligned: <span className="font-semibold">{projectedAligned}</span></p>
            </div>
            <div className="rounded-lg border border-ink-100 bg-ink-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Est. 30d Revenue Delta</p>
              <p className={`mt-1 text-sm font-semibold ${projected30dDelta >= 0 ? 'text-ink-800' : 'text-emerald-700'}`}>
                {projected30dDelta >= 0 ? '+' : ''}₹{projected30dDelta}
              </p>
              <p className="mt-1 text-xs text-ink-500">{impact.renewalsNext30Days} renewals × proposed fee</p>
            </div>
          </div>

          {/* Session delta table */}
          <div className="mt-3 rounded-lg border border-ink-100 bg-ink-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Session Pricing Delta</p>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-600">
                  <input type="checkbox" checked={showChanged} onChange={(e) => setShowChanged(e.target.checked)} className="h-3.5 w-3.5 rounded border border-ink-200" />
                  Changed only
                </label>
                <p className="text-xs text-ink-600">
                  {changedRows.length} changed · Total delta:{' '}
                  <span className={`font-semibold ${totalDelta > 0 ? 'text-amber-700' : totalDelta < 0 ? 'text-emerald-700' : 'text-ink-800'}`}>
                    {totalDelta > 0 ? '+' : ''}₹{totalDelta}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-100">
                <thead>
                  <tr>
                    {['Provider','Duration','Old','New','Delta'].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {visibleDelta.length === 0
                    ? <tr><td colSpan={5} className="px-2 py-3 text-center text-xs text-ink-400">No changed rows.</td></tr>
                    : visibleDelta.map((r) => (
                        <tr key={`${r.providerType}-${r.durationMinutes}`}>
                          <td className="px-2 py-1.5 text-xs text-ink-700">{labelForProviderType(r.providerType)}</td>
                          <td className="px-2 py-1.5 text-xs text-ink-600">{r.durationMinutes} min</td>
                          <td className="px-2 py-1.5 text-xs text-ink-600">₹{r.oldPrice}</td>
                          <td className="px-2 py-1.5 text-xs text-ink-600">₹{r.newPrice}</td>
                          <td className={`px-2 py-1.5 text-xs font-semibold ${r.delta > 0 ? 'text-amber-700' : r.delta < 0 ? 'text-emerald-700' : 'text-ink-400'}`}>
                            {r.delta > 0 ? '+' : ''}₹{r.delta}
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Platform fee + surcharge */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <h3 className="font-display text-base font-bold text-ink-800">Platform Monthly Fee</h3>
          <p className="mt-0.5 text-xs text-ink-500">Base subscription fee charged to patients per month.</p>
          <label className="mt-3 block text-sm text-ink-700">
            Amount (₹)
            <input
              type="number" min={0} value={platformFee}
              onChange={(e) => setPlatformFee(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2"
            />
          </label>
        </div>
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <h3 className="font-display text-base font-bold text-ink-800">Preferred-Time Surcharge</h3>
          <p className="mt-0.5 text-xs text-ink-500">Extra % charged for peak-hour appointment slots.</p>
          <label className="mt-3 block text-sm text-ink-700">
            Surcharge (%)
            <input
              type="number" min={0} max={100} value={surcharge}
              onChange={(e) => setSurcharge(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2"
            />
          </label>
        </div>
      </div>

      {/* Patient Platform Plans (read-only reference) */}
      <div className="rounded-xl border border-blue-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-ink-800">Patient Platform Plans</h3>
            <p className="mt-0.5 text-xs text-ink-400">Subscription tiers available to patients. Configured in code; edit via platform config to override.</p>
          </div>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">Read-only reference</span>
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-ink-100">
          <table className="min-w-full divide-y divide-ink-100">
            <thead className="bg-blue-50">
              <tr>
                {['Plan', 'Key', 'Price', 'Duration', 'Billing'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {[
                { plan: 'Free', key: 'free', price: 0, duration: '-', billing: 'None' },
                { plan: 'Basic Monthly', key: 'monthly', price: 99, duration: '30 days', billing: 'Monthly' },
                { plan: 'Quarterly', key: 'quarterly', price: 299, duration: '90 days', billing: 'Quarterly' },
                { plan: 'Premium Monthly', key: 'premium_monthly', price: 299, duration: '30 days', billing: 'Monthly' },
                { plan: 'Premium Annual', key: 'premium_annual', price: 2999, duration: '365 days', billing: 'Annual' },
              ].map((r) => (
                <tr key={r.key} className="hover:bg-ink-50/40">
                  <td className="px-3 py-2 text-sm font-medium text-ink-800">{r.plan}</td>
                  <td className="px-3 py-2 text-xs font-mono text-ink-400">{r.key}</td>
                  <td className="px-3 py-2 text-sm font-semibold text-blue-700">{r.price === 0 ? 'Free' : `₹${r.price.toLocaleString('en-IN')}`}</td>
                  <td className="px-3 py-2 text-sm text-ink-500">{r.duration}</td>
                  <td className="px-3 py-2 text-sm text-ink-500">{r.billing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider Platform Plans */}
      <div className="rounded-xl border border-emerald-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-ink-800">Provider Platform Plans</h3>
            <p className="mt-0.5 text-xs text-ink-400">Subscription tiers for providers. Determines lead allocation, marketplace access, and lead discount.</p>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-ink-100">
          <table className="min-w-full divide-y divide-ink-100">
            <thead className="bg-emerald-50">
              <tr>
                {['Plan', 'Monthly (₹)', 'Quarterly (₹)', 'Leads/Week', 'Claim (h)', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {providerPlanRows.map((r, i) => (
                <tr key={r.planKey} className="hover:bg-ink-50/40">
                  <td className="px-3 py-3 text-sm font-medium text-ink-800">{r.planName}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-emerald-700">{r.monthly === 0 ? 'Free' : `₹${r.monthly}`}</td>
                  <td className="px-3 py-3 text-sm text-ink-600">{r.quarterly === 0 ? 'Free' : `₹${r.quarterly}`}</td>
                  <td className="px-3 py-3 text-sm text-ink-600">{r.leads === 0 ? '—' : r.leads}</td>
                  <td className="px-3 py-3 text-sm text-ink-600">{r.claim === 0 ? '—' : r.claim}</td>
                  <td className="px-3 py-3 text-sm">
                    {r.planKey !== 'free' && (
                      <button 
                        onClick={() => setEditingProviderPlanIndex(i)} 
                        className="rounded bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                      >
                        Edit Plan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-ink-400">Click "Edit Plan" to modify comprehensive features (delivery schedule, marketplace discount, etc).</p>
      </div>

      {/* Subscription plans */}
      {planRows.length > 0 && (
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold text-ink-800">Subscription Plans</h3>
            <p className="text-xs text-ink-400">Edit name, billing cycle, price, and active state.</p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-100">
              <thead className="bg-ink-50">
                <tr>
                  {['Key','Plan Name','Billing','Price (₹)','Active'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {planRows.map((row, i) => (
                  <tr key={row.planKey}>
                    <td className="px-3 py-2 text-sm text-ink-400">{row.planKey}</td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.planName} onChange={(e) => updatePlanRow(i, { planName: e.target.value })}
                        className="w-full rounded-lg border border-ink-100 px-2 py-1.5 text-sm outline-none ring-sage-500 focus:ring-2" />
                    </td>
                    <td className="px-3 py-2">
                      <select value={row.billingCycle} onChange={(e) => updatePlanRow(i, { billingCycle: e.target.value })}
                        className="w-full rounded-lg border border-ink-100 px-2 py-1.5 text-sm outline-none ring-sage-500 focus:ring-2">
                        <option value="none">None</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} value={row.price} onChange={(e) => updatePlanRow(i, { price: Number(e.target.value) })}
                        className="w-28 rounded-lg border border-ink-100 px-2 py-1.5 text-sm outline-none ring-sage-500 focus:ring-2" />
                    </td>
                    <td className="px-3 py-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700">
                        <input type="checkbox" checked={row.active} onChange={(e) => updatePlanRow(i, { active: e.target.checked })}
                          className="h-4 w-4 rounded border border-ink-200" />
                        On
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Session pricing */}
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-ink-800">Session Pricing</h3>
            <p className="mt-0.5 text-xs text-ink-400">Split: Provider 60% / Platform 40%. Video = standard +10% (applied at booking).</p>
          </div>
          <button type="button" onClick={() => { setAddingRow((v) => !v); setError(null); }}
            className="rounded-lg border border-sage-300 bg-sage-50 px-3 py-1.5 text-xs font-semibold text-sage-700 hover:bg-sage-100">
            {addingRow ? 'Cancel' : '+ Add Row'}
          </button>
        </div>

        {/* Add row form */}
        {addingRow && (
          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-sage-200 bg-sage-50 p-3">
            <label className="flex flex-col gap-1 text-xs text-ink-700">
              Provider Type
              <input type="text" value={newRow.providerType} placeholder="e.g. nlp-coach"
                onChange={(e) => setNewRow({ ...newRow, providerType: e.target.value })}
                className="w-48 rounded-lg border border-ink-200 px-2 py-1.5 text-sm outline-none ring-sage-500 focus:ring-2" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-700">
              Duration (min)
              <input type="number" min={1} value={newRow.durationMinutes}
                onChange={(e) => setNewRow({ ...newRow, durationMinutes: Number(e.target.value) })}
                className="w-24 rounded-lg border border-ink-200 px-2 py-1.5 text-sm outline-none ring-sage-500 focus:ring-2" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-700">
              Price (₹)
              <input type="number" min={0} value={newRow.price}
                onChange={(e) => setNewRow({ ...newRow, price: Number(e.target.value) })}
                className="w-28 rounded-lg border border-ink-200 px-2 py-1.5 text-sm outline-none ring-sage-500 focus:ring-2" />
            </label>
            <button type="button" onClick={addSessionRow}
              className="rounded-lg bg-sage-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sage-700">
              Add
            </button>
          </div>
        )}

        {/* Grouped tables */}
        {(['domestic', 'specialty', 'nri'] as const).map((group) => {
          const rows = sessionRows.map((row, index) => ({ row, index })).filter(({ row }) => {
            if (group === 'nri')      return isNri(row.providerType);
            if (group === 'specialty') return !isNri(row.providerType) && isSpecialty(row.providerType);
            return !isNri(row.providerType) && !isSpecialty(row.providerType);
          });
          if (rows.length === 0) return null;
          const labels: Record<string, string> = { domestic: 'Domestic Sessions', specialty: 'Specialty Services', nri: 'NRI Sessions' };
          const colors: Record<string, string> = { domestic: 'text-sage-700', specialty: 'text-purple-600', nri: 'text-orange-600' };
          const bgHd: Record<string, string>   = { domestic: 'bg-sage-50', specialty: 'bg-purple-50', nri: 'bg-orange-50' };
          return (
            <div key={group} className="mt-5">
              <p className={`mb-2 text-[11px] font-bold uppercase tracking-widest ${colors[group]}`}>{labels[group]}</p>
              <div className="overflow-x-auto rounded-lg border border-ink-100">
                <table className="min-w-full divide-y divide-ink-100">
                  <thead className={bgHd[group]}>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Provider Type</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Duration</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Price (₹)</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Provider 60%</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Platform 40%</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Video +10%</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {rows.map(({ row, index }) => {
                      const isEditing = editingIndex === index;
                      const buf = isEditing ? editBuffer! : row;
                      const provShare  = Math.round(buf.price * 0.6);
                      const platShare  = buf.price - provShare;
                      const videoPrice = Math.round(buf.price * 1.1);
                      return (
                        <tr key={`${row.providerType}-${row.durationMinutes}-${index}`}
                          className={isEditing ? 'bg-amber-50' : 'hover:bg-ink-50/40'}>
                          <td className="px-3 py-2">
                            {isEditing
                              ? <input type="text" value={editBuffer!.providerType}
                                  onChange={(e) => setEditBuffer({ ...editBuffer!, providerType: e.target.value })}
                                  className="w-44 rounded-lg border border-amber-300 px-2 py-1.5 text-sm outline-none ring-amber-400 focus:ring-2" />
                              : <span className="text-sm font-medium text-ink-800">{labelForProviderType(row.providerType)}<br /><span className="text-[11px] text-ink-400">{row.providerType}</span></span>
                            }
                          </td>
                          <td className="px-3 py-2">
                            {isEditing
                              ? <input type="number" min={1} value={editBuffer!.durationMinutes}
                                  onChange={(e) => setEditBuffer({ ...editBuffer!, durationMinutes: Number(e.target.value) })}
                                  className="w-20 rounded-lg border border-amber-300 px-2 py-1.5 text-sm outline-none ring-amber-400 focus:ring-2" />
                              : <span className="text-sm text-ink-500">{row.durationMinutes} min</span>
                            }
                          </td>
                          <td className="px-3 py-2">
                            {isEditing
                              ? <input type="number" min={0} value={editBuffer!.price}
                                  onChange={(e) => setEditBuffer({ ...editBuffer!, price: Number(e.target.value) || 0 })}
                                  className="w-28 rounded-lg border border-amber-300 px-2 py-1.5 text-sm font-semibold outline-none ring-amber-400 focus:ring-2" />
                              : <span className="text-sm font-semibold text-ink-800">₹{row.price.toLocaleString('en-IN')}</span>
                            }
                          </td>
                          <td className="px-3 py-2 text-sm font-semibold text-emerald-700">₹{provShare.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2 text-sm text-ink-400">₹{platShare.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2 text-sm text-indigo-600">₹{videoPrice.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1.5">
                              {isEditing ? (
                                <>
                                  <button type="button" onClick={saveEditRow}
                                    className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600">
                                    Save
                                  </button>
                                  <button type="button" onClick={cancelEditRow}
                                    className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs text-ink-500 hover:bg-ink-50">
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button type="button" onClick={() => startEditRow(index, row)}
                                    className="rounded-lg border border-sage-200 bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700 hover:bg-sage-100">
                                    Edit
                                  </button>
                                  <button type="button" onClick={() => removeSessionRow(index)}
                                    className="rounded-lg border border-red-100 px-2.5 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600">
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* AnytimeBuddy add-ons */}
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <h3 className="font-display text-base font-bold text-ink-800">AnytimeBuddy Add-ons</h3>
        <p className="mt-0.5 text-xs text-ink-400">Monthly subscription tiers for the AI wellness companion.</p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-ink-100">
          <table className="min-w-full divide-y divide-ink-100">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Tier</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">Price (₹/month)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {bundleRows.length === 0
                ? <tr><td colSpan={2} className="px-3 py-3 text-center text-xs text-ink-400">No add-ons found. Save once to seed defaults.</td></tr>
                : bundleRows.map((row, i) => (
                    <tr key={`${row.bundleName}-${row.minutes}`}>
                      <td className="px-3 py-2 text-sm font-medium text-ink-800">{row.bundleName}</td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={row.price}
                          onChange={(e) => updateBundlePrice(i, e.target.value)}
                          className="w-32 rounded-lg border border-ink-100 px-2 py-1.5 text-sm outline-none ring-sage-500 focus:ring-2" />
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing preview cards */}
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <h3 className="font-display text-base font-bold text-ink-800">Pricing Preview</h3>
        <p className="mt-0.5 text-xs text-ink-400">Standard price shown. Video = standard +10%.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {groupedPreview.map(([providerType, rows]) => {
            const main = rows[0];
            const nriTag      = isNri(providerType);
            const specialtyTag = isSpecialty(providerType);
            const tagCls = nriTag ? 'bg-orange-100 text-orange-700' : specialtyTag ? 'bg-purple-100 text-purple-700' : 'bg-sage-100 text-sage-700';
            const tagText = nriTag ? 'NRI' : specialtyTag ? 'Specialty' : 'Domestic';
            return (
              <div key={providerType} className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-semibold leading-tight text-ink-800">{labelForProviderType(providerType)}</p>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tagCls}`}>{tagText}</span>
                </div>
                {main && (
                  <>
                    <p className="mt-1 text-xs text-ink-600">{main.durationMinutes} min</p>
                    <p className="text-xs text-ink-700">Standard: <span className="font-semibold">₹{main.price}</span></p>
                    <p className="text-xs text-indigo-600">Video: ₹{Math.round(main.price * 1.1)}</p>
                  </>
                )}
              </div>
            );
          })}
          {groupedPreview.length === 0 && (
            <p className="col-span-4 text-xs text-ink-400">No session pricing loaded yet.</p>
          )}
        </div>
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-100 bg-white px-6 py-3 flex items-center justify-between gap-4 shadow-lg">
        <p className="text-xs text-ink-500">
          {changedRows.length > 0
            ? `${changedRows.length} session row(s) changed · delta ₹${totalDelta > 0 ? '+' : ''}${totalDelta}`
            : 'No unsaved session changes.'}
        </p>
        <button type="button" onClick={() => void onSave()} disabled={saving || loading || !config}
          className="rounded-lg bg-sage-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Pricing'}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-ink-200 pt-8">
        <h3 className="font-display text-base font-bold text-ink-800">Access Controls</h3>
        <p className="mt-1 text-xs text-ink-400">Grant free access or waive subscription for specific users.</p>
      </div>

      {/* Global offer + waiver */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-indigo-100 bg-white p-5">
          <h4 className="font-display text-base font-bold text-ink-800">Make New Sign-ups Free</h4>
          <p className="mt-1 text-sm text-ink-500">All new users get the platform free for N days.</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex-1">
              <input type="number" value={freeDays} onChange={(e) => setFreeDays(e.target.value)}
                className="w-full rounded-lg border border-ink-100 py-2.5 pl-4 pr-12 text-sm font-semibold outline-none ring-indigo-400 focus:ring-2" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400">days</span>
            </div>
            <button onClick={onToggleFree} disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              Activate
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white p-5">
          <h4 className="font-display text-base font-bold text-ink-800">Manual Access Waiver</h4>
          <p className="mt-1 text-sm text-ink-500">Give a specific user free access for a duration.</p>
          <div className="mt-4 space-y-3">
            <input type="text" placeholder="User ID (UUID)" value={waiveForm.userId}
              onChange={(e) => setWaiveForm({ ...waiveForm, userId: e.target.value })}
              className="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none ring-emerald-400 focus:ring-2" />
            <div className="grid grid-cols-2 gap-3">
              <select value={waiveForm.planKey} onChange={(e) => setWaiveForm({ ...waiveForm, planKey: e.target.value })}
                className="rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none ring-emerald-400 focus:ring-2">
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="pro">Pro</option>
              </select>
              <div className="relative">
                <input type="number" value={waiveForm.durationDays} onChange={(e) => setWaiveForm({ ...waiveForm, durationDays: e.target.value })}
                  className="w-full rounded-lg border border-ink-100 py-2.5 pl-3 pr-10 text-sm outline-none ring-emerald-400 focus:ring-2" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400">days</span>
              </div>
            </div>
            <input type="text" placeholder="Reason (e.g. Beta Tester)" value={waiveForm.reason}
              onChange={(e) => setWaiveForm({ ...waiveForm, reason: e.target.value })}
              className="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-sm outline-none ring-emerald-400 focus:ring-2" />
            <button onClick={onWaive} disabled={saving || !waiveForm.userId.trim()}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              Grant Free Access
            </button>
          </div>
        </div>
      </div>
      
      {/* Provider Plan Edit Modal */}
      {editingProviderPlanIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
              <h3 className="text-lg font-bold text-ink-800">Edit {providerPlanRows[editingProviderPlanIndex].planName} Plan</h3>
              <button onClick={() => setEditingProviderPlanIndex(null)} className="text-ink-400 hover:text-ink-600 font-bold text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                
                {/* Core Metrics */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-emerald-800 border-b border-emerald-100 pb-2">Core Metrics</h4>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-600">Monthly Price (₹)</label>
                    <input type="number" value={providerPlanRows[editingProviderPlanIndex].monthly} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { monthly: Number(e.target.value) })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-600">Quarterly Price (₹)</label>
                    <input type="number" value={providerPlanRows[editingProviderPlanIndex].quarterly} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { quarterly: Number(e.target.value) })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-600">Total Leads / Week</label>
                      <input type="number" value={providerPlanRows[editingProviderPlanIndex].leads} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { leads: Number(e.target.value) })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-600">Leads / Month</label>
                      <input type="number" value={providerPlanRows[editingProviderPlanIndex].leadsPerMonth} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { leadsPerMonth: Number(e.target.value) })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-600">Hot Leads</label>
                      <input type="number" value={providerPlanRows[editingProviderPlanIndex].hotLeads} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { hotLeads: Number(e.target.value) })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-600">Warm Leads</label>
                      <input type="number" value={providerPlanRows[editingProviderPlanIndex].warmLeads} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { warmLeads: Number(e.target.value) })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-600">Cold Leads</label>
                      <input type="number" value={providerPlanRows[editingProviderPlanIndex].coldLeads} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { coldLeads: Number(e.target.value) })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-600">Marketplace Discount (%)</label>
                      <input type="number" value={providerPlanRows[editingProviderPlanIndex].discount} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { discount: Number(e.target.value) })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-600">Claim Window (Hours)</label>
                      <input type="number" value={providerPlanRows[editingProviderPlanIndex].claim} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { claim: Number(e.target.value) })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-emerald-800 border-b border-emerald-100 pb-2">Features Display</h4>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-600">Lead Quality Mix</label>
                    <input type="text" value={providerPlanRows[editingProviderPlanIndex].leadQualityMix} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { leadQualityMix: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-600">Lead Delivery</label>
                    <input type="text" value={providerPlanRows[editingProviderPlanIndex].leadDelivery} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { leadDelivery: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-600">Profile Listing</label>
                    <input type="text" value={providerPlanRows[editingProviderPlanIndex].profileListing} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { profileListing: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-600">Dashboard Access</label>
                    <input type="text" value={providerPlanRows[editingProviderPlanIndex].dashboardAccess} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { dashboardAccess: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-600">Certification Badge</label>
                    <input type="text" value={providerPlanRows[editingProviderPlanIndex].certificationBadge} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { certificationBadge: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-600">Support</label>
                    <input type="text" value={providerPlanRows[editingProviderPlanIndex].support} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { support: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-600">Recommended For</label>
                    <input type="text" value={providerPlanRows[editingProviderPlanIndex].recommendedFor} onChange={e => updateProviderPlanRow(editingProviderPlanIndex, { recommendedFor: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none ring-sage-500 focus:ring-2" />
                  </div>
                </div>

              </div>
            </div>
            <div className="border-t border-ink-100 bg-ink-50 px-6 py-4 flex justify-end">
              <button 
                onClick={() => setEditingProviderPlanIndex(null)}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImpactCard({ label, value, note, tone = 'neutral' }: { label: string; value: string; note?: string; tone?: 'good' | 'neutral' | 'warning' }) {
  const cls = tone === 'good' ? 'border-emerald-200 bg-emerald-50' : tone === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-ink-100 bg-white';
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-ink-800">{value}</p>
      {note && <p className="mt-0.5 text-[11px] text-ink-500">{note}</p>}
    </div>
  );
}
