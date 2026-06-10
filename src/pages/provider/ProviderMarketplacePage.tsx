import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Filter, Lock, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchProviderMarketplace, fetchProviderLeadStats, fetchProviderLeads, purchaseProviderLead } from '../../api/provider';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  finalizeProviderLeadPurchase,
  isLeadPurchaseTransaction,
  savePendingLeadPurchase,
} from '../../lib/providerLeadPurchaseFlow';
import { severityFromClinicalScore } from '../../utils/clinicalAssessments';

interface MarketplaceLead {
  id: string;
  status?: string;
  leadType: string;
  matchScore: number | null;
  matchBand?: string | null;
  scoreExpertise?: number | null;
  scoreCommunication?: number | null;
  scoreQuality?: number | null;
  issue?: string[];
  quality?: number;
  basePrice: number;
  discount: number;
  finalPrice: number;
  createdAt: string;
  expiresAt?: string;
  scheduledAt?: string | null;
  appointmentType?: string | null;
  patientName?: string | null;
  city?: string | null;
  phq9Score?: number | null;
  phq9Severity?: string | null;
  gad7Score?: number | null;
  gad7Severity?: string | null;
  primaryLanguage?: string | null;
  languages?: string[];
}

const LANGUAGE_CODE_MAP: Record<string, string> = {
  english: 'EN',
  en: 'EN',
  hindi: 'HI',
  hi: 'HI',
  kannada: 'KN',
  kn: 'KN',
  tamil: 'TA',
  ta: 'TA',
  telugu: 'TE',
  te: 'TE',
  marathi: 'MR',
  mr: 'MR',
  bengali: 'BN',
  bn: 'BN',
  gujarati: 'GU',
  gu: 'GU',
};

const formatPhq9Severity = (severity: string): string =>
  severity
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const normalizeLanguageCodes = (values: unknown): string[] => {
  if (!values) return [];
  const list = Array.isArray(values) ? values : [values];
  return list
    .map((value) => {
      const raw = String(value || '').trim();
      if (!raw) return '';
      const mapped = LANGUAGE_CODE_MAP[raw.toLowerCase()];
      if (mapped) return mapped;
      if (/^[a-z]{2}$/i.test(raw)) return raw.toUpperCase();
      return raw;
    })
    .filter(Boolean);
};

const toScore = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeMarketplaceLead = (lead: any): MarketplaceLead => {
  const preview = lead.previewData ?? lead.preview ?? lead.patientPreview ?? lead.patientSnapshot ?? {};
  const patient = lead.patient ?? preview.patient ?? {};

  const patientName =
    preview.patientName
    ?? lead.patientName
    ?? patient.name
    ?? patient.firstName
    ?? null;

  const city =
    preview.city
    ?? lead.city
    ?? lead.patientCity
    ?? lead.location
    ?? patient.city
    ?? patient.location
    ?? null;

  const phq9Score = toScore(
    preview.phq9Score
    ?? preview.phq9?.score
    ?? preview.phqScore
    ?? lead.phq9Score
    ?? lead.phqScore
    ?? lead.phq9?.score
    ?? lead.assessments?.phq9?.score
    ?? lead.assessment?.phq9Score,
  );

  const gad7Score = toScore(
    preview.gad7Score
    ?? preview.gad7?.score
    ?? preview.gadScore
    ?? lead.gad7Score
    ?? lead.gadScore
    ?? lead.gad7?.score
    ?? lead.assessments?.gad7?.score
    ?? lead.assessment?.gad7Score,
  );

  const phq9SeverityRaw =
    preview.phq9Severity
    ?? preview.phq9?.severity
    ?? lead.phq9Severity
    ?? lead.phq9?.severity
    ?? lead.assessments?.phq9?.severity
    ?? null;
  const phq9Severity = phq9SeverityRaw
    ? formatPhq9Severity(String(phq9SeverityRaw))
    : phq9Score != null
      ? formatPhq9Severity(severityFromClinicalScore('PHQ-9', phq9Score))
      : null;

  const gad7SeverityRaw =
    preview.gad7Severity
    ?? preview.gad7?.severity
    ?? lead.gad7Severity
    ?? lead.gad7?.severity
    ?? lead.assessments?.gad7?.severity
    ?? null;
  const gad7Severity = gad7SeverityRaw
    ? formatPhq9Severity(String(gad7SeverityRaw))
    : gad7Score != null
      ? formatPhq9Severity(severityFromClinicalScore('GAD-7', gad7Score))
      : null;

  const languages = normalizeLanguageCodes(
    preview.language
      ? [preview.language]
      : preview.languages
      ?? lead.languages
      ?? lead.preferredLanguages
      ?? (lead.preferredLanguage ? [lead.preferredLanguage] : null)
      ?? patient.languages
      ?? patient.preferredLanguages
      ?? (patient.preferredLanguage ? [patient.preferredLanguage] : null),
  );

  const amountMinor = toScore(lead.amountMinor ?? lead.priceMinor);
  const legacyPrice = toScore(lead.price ?? lead.finalPrice);
  const finalPrice = amountMinor != null
    ? Math.round(amountMinor / 100)
    : legacyPrice != null
      ? Math.round(legacyPrice)
      : 0;

  const concerns = Array.isArray(preview.concerns)
    ? preview.concerns.map((c: unknown) => String(c).trim()).filter(Boolean)
    : Array.isArray(lead.concerns)
      ? lead.concerns.map((c: unknown) => String(c).trim()).filter(Boolean)
      : Array.isArray(lead.issue)
        ? lead.issue
        : [];

  return {
    ...lead,
    id: lead.id,
    status: lead.status,
    leadType: (['hot', 'warm', 'cold'].includes(String(lead.tier || lead.leadType || '').toLowerCase())
      ? String(lead.tier || lead.leadType).toLowerCase()
      : 'cold'),
    matchScore: lead.score ?? lead.matchScore ?? null,
    issue: concerns,
    finalPrice,
    basePrice: lead.basePrice != null ? Math.round(Number(lead.basePrice) / (lead.basePrice > 999 ? 100 : 1)) : finalPrice,
    discount: lead.discount ?? 0,
    createdAt: lead.createdAt,
    expiresAt: lead.expiresAt,
    scheduledAt: preview.scheduledAt ?? lead.scheduledAt ?? null,
    appointmentType: preview.appointmentType ?? lead.appointmentType ?? null,
    patientName,
    city,
    phq9Score,
    phq9Severity,
    gad7Score,
    gad7Severity,
    primaryLanguage: languages[0] ?? null,
    languages,
  };
};

const LeadPatientPreview = ({ lead }: { lead: MarketplaceLead }) => (
  <div className="mb-4 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3">
    <p className="text-xs font-semibold text-slate-900 truncate">
      {lead.patientName || 'Patient'}
      {lead.city ? <span className="font-normal text-slate-500"> · {lead.city}</span> : null}
    </p>

    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] leading-relaxed text-slate-500">
      <span>
        PHQ-9{' '}
        <span className="font-semibold text-slate-800">
          {lead.phq9Score != null ? lead.phq9Score : '—'}
        </span>
      </span>
      <span>
        GAD-7{' '}
        <span className="font-semibold text-slate-800">
          {lead.gad7Score != null ? lead.gad7Score : '—'}
        </span>
      </span>
      <span>
        Lang{' '}
        <span className="font-semibold text-slate-800">
          {lead.primaryLanguage || (lead.languages && lead.languages.length > 0 ? lead.languages.join(', ') : '—')}
        </span>
      </span>
    </div>

    {lead.issue && lead.issue.length > 0 ? (
      <div className="mt-2.5 flex flex-wrap gap-1">
        {lead.issue.map((concern) => (
          <span
            key={concern}
            className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium capitalize text-teal-700"
          >
            {concern.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    ) : (
      <p className="mt-2 text-[10px] text-slate-400">No concerns listed</p>
    )}
  </div>
);

const ScoreBar = ({ label, value, max, color }: { label: string; value: number | null | undefined; max: number; color: string }) => {
  const pct = value != null ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] font-semibold text-slate-500">
        <span>{label}</span>
        <span>{value ?? '—'}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

interface LeadStats {
  currentPlan: string;
  leadsPerWeek: number;
  leadsAssigned: number;
  leadsClaimed: number;
  leadsRemaining: number;
}

const typeColors: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  hot: { bg: 'bg-red-50', text: 'text-red-700', label: 'Hot', emoji: '🔥' },
  warm: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Warm', emoji: '🌟' },
  cold: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Cold', emoji: '❄️' },
};

const getRemainingTime = (expiresAt: string): string => {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const diffMins = Math.round(diffMs / 1000 / 60);
  if (diffMins < 60) return `${diffMins}m left`;
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  return `${diffHours}h ${remainingMins}m left`;
};

export default function ProviderMarketplacePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [tab, setTab] = useState<'marketplace' | 'purchased'>('marketplace');
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [purchasedLeads, setPurchasedLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const paymentReturnHandledRef = useRef(false);

  const isPlatformActive = user?.platformAccessActive;
  const leadsRemaining = stats?.leadsRemaining ?? 0;
  const isQuotaExhausted = leadsRemaining === 0;
  const canPurchase = Boolean(isPlatformActive);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchProviderMarketplace(),
      fetchProviderLeadStats().catch(() => null),
      fetchProviderLeads().catch(() => []),
    ])
      .then(([marketplaceData, statsData, myLeads]) => {
        const rawLeads = (marketplaceData as any)?.items
          ?? (marketplaceData as any)?.leads
          ?? (Array.isArray(marketplaceData) ? marketplaceData : []);
        const normalizedLeads = rawLeads.map((lead: any) => normalizeMarketplaceLead(lead));

        // Sort available leads so that the latest lead is at the top, filtering out expired ones
        const sortedLeads = normalizedLeads
          .filter((lead: any) => !lead.expiresAt || new Date(lead.expiresAt).getTime() > Date.now())
          .sort((a: MarketplaceLead, b: MarketplaceLead) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

        setLeads(sortedLeads);
        setStats(statsData);

        const normalizedMyLeads = (Array.isArray(myLeads) ? myLeads : []).map((lead: any) => {
          const normalized = normalizeMarketplaceLead(lead);
          return {
            ...normalized,
            tier: lead.tier || lead.leadType || 'Standard',
            patientName: normalized.patientName || lead.patientName || lead.patient?.name || 'Patient',
            purchasedAt: lead.purchasedAt || lead.createdAt,
          };
        }).sort((a: any, b: any) => {
          return new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime();
        });

        setPurchasedLeads(normalizedMyLeads);
      })
      .catch((err: any) => {
        if (err?.response?.status === 403) toast.error('Access restricted');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (paymentReturnHandledRef.current) return;

    const merchantTransactionId = (
      searchParams.get('merchantTransactionId')
      || searchParams.get('transactionId')
      || searchParams.get('txn')
      || searchParams.get('id')
      || ''
    ).trim();

    if (!merchantTransactionId || !isLeadPurchaseTransaction(merchantTransactionId)) return;

    paymentReturnHandledRef.current = true;
    setVerifyingPayment(true);

    void finalizeProviderLeadPurchase(merchantTransactionId)
      .then(() => {
        toast.success('Lead purchased successfully! The patient session has been assigned to you.');
        setTab('purchased');
        loadData();
        navigate('/provider/leads', { replace: true });
      })
      .catch((err: any) => {
        const serverMessage = err?.response?.data?.message;
        toast.error(serverMessage || err?.message || 'Payment verification failed. Please try again.');
      })
      .finally(() => {
        setVerifyingPayment(false);
      });
  }, [searchParams, navigate]);

  const filteredLeads = filter === 'all' ? leads : leads.filter((l) => l.leadType === filter);

  const onPurchase = async (leadId: string) => {
    if (!canPurchase) return;
    setPurchasing(leadId);
    try {
      const result = await purchaseProviderLead(leadId);
      const redirectUrl = String(result.payment?.redirectUrl || '').trim();
      const merchantTransactionId = String(result.payment?.merchantTransactionId || '').trim();

      if (redirectUrl && merchantTransactionId) {
        savePendingLeadPurchase(leadId, merchantTransactionId, result.paymentId || result.payment?.paymentId);
        window.location.href = redirectUrl;
        return;
      }

      if (result.purchase || result.updatedLead) {
        toast.success('Lead purchased successfully! The patient session will be assigned to you.');
        setTab('purchased');
        loadData();
        return;
      }

      toast.error('Unable to start lead purchase. Please try again.');
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      let displayMessage = serverMessage || 'Purchase failed';

      if (status === 404) {
        displayMessage = serverMessage || 'Lead not found (The lead might have expired or been deleted).';
      } else if (status === 409) {
        displayMessage = serverMessage || 'Lead already taken (Another provider bought it fractions of a second earlier).';
      } else if (status === 403) {
        if (serverMessage?.toLowerCase().includes('limit') || serverMessage?.toLowerCase().includes('quota') || serverMessage?.toLowerCase().includes('exceeded')) {
          displayMessage = serverMessage || 'Weekly limit of leads exceeded for your current plan.';
        } else {
          displayMessage = serverMessage || 'Your current plan does not support purchasing leads. Please upgrade your subscription.';
        }
      }
      toast.error(displayMessage);
    } finally {
      setPurchasing(null);
    }
  };

  if (verifyingPayment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#1f6f5f]" />
        <p className="mt-4 max-w-md text-center text-sm font-semibold text-slate-700">
          Verifying your PhonePe payment and assigning the lead…
        </p>
        <p className="mt-2 text-xs text-slate-400">Please do not close this window.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Premium Header */}
      <section className="bg-slate-900 px-6 py-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-[0.2em] text-teal-400 uppercase">Growth Marketplace</span>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">Buy Additional Leads</h1>
              <p className="mt-4 text-slate-400 max-w-xl leading-relaxed">
                Scale your practice beyond your weekly plan constraints. First-come, first-served premium patient matches.
              </p>
            </div>

            {/* Status Pill */}
            {stats && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Your Weekly Quota</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isQuotaExhausted ? 'bg-amber-500' : 'bg-teal-500'}`}
                        style={{ width: `${Math.min(100, (stats.leadsAssigned / stats.leadsPerWeek) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-white">{stats.leadsAssigned}/{stats.leadsPerWeek}</span>
                  </div>
                </div>
                {isQuotaExhausted ? (
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Info className="h-6 w-6" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 mt-10">

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-slate-200">
          {(['marketplace', 'purchased'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-bold capitalize transition-all border-b-2 -mb-px ${tab === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              {t === 'marketplace' ? `Buy Leads (${leads.length})` : `My Purchased (${purchasedLeads.length})`}
            </button>
          ))}
        </div>

        {/* Purchased Leads Tab */}
        {tab === 'purchased' && (
          <div className="space-y-4">
            {purchasedLeads.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-20 flex flex-col items-center gap-3">
                <ShoppingCart className="h-10 w-10 text-slate-300" />
                <p className="text-slate-400 font-bold">No purchased leads yet</p>
                <p className="text-slate-400 text-sm">Buy leads from the marketplace to see patient details here</p>
              </div>
            ) : (
              purchasedLeads.map((lead: any) => (
                <div key={lead.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Purchased</span>
                      {lead.tier && <span className="text-xs text-slate-500 font-semibold">{lead.tier}</span>}
                    </div>
                    <LeadPatientPreview lead={lead} />
                    <p className="text-xs text-slate-400">Match Score: {lead.matchScore ?? '—'}</p>
                    <p className="text-xs text-slate-400">Purchased: {new Date(lead.purchasedAt || lead.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/provider/appointments`)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-black hover:bg-teal-700 transition whitespace-nowrap"
                  >
                    View Request →
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'marketplace' && <>
          {/* Info Banner: show remaining weekly leads as info only */}
          {isPlatformActive && !isQuotaExhausted && (
            <div className="mb-6 p-4 rounded-2xl bg-teal-50 border border-teal-100 flex items-center gap-3">
              <Info className="h-4 w-4 text-teal-600 flex-shrink-0" />
              <p className="text-sm text-teal-800 font-medium">
                You have <strong>{leadsRemaining}</strong> free weekly leads remaining. Marketplace leads are additional one-time purchases.
              </p>
            </div>
          )}

          {/* Global Marketplace Locked Banner */}
          {!isPlatformActive && (
            <div className="mb-10 p-8 rounded-3xl bg-slate-100 border border-slate-200 flex flex-col items-center text-center gap-6">
              <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                <Lock className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">Marketplace Locked</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Platform access is required to view and purchase marketplace leads.
                  Activate your subscription to go live.
                </p>
              </div>
              <button
                onClick={() => navigate('/provider/subscription')}
                className="px-8 py-3 rounded-2xl bg-[#1f6f5f] text-white font-black text-lg hover:bg-[#145347] transition shadow-xl shadow-[#1f6f5f]/20"
              >
                Activate Platform Access
              </button>
            </div>
          )}

          {isPlatformActive && (
            <>
              {/* Filters */}
              <div className={`mb-8 flex flex-wrap items-center gap-4 ${!canPurchase ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2 text-slate-400 mr-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#1f6f5f]">Filter By</span>
                </div>
                {['all', 'hot', 'warm', 'cold'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={!canPurchase}
                    onClick={() => setFilter(type)}
                    className={`rounded-xl px-5 py-2.5 text-xs font-black capitalize transition-all border-b-2 transform active:scale-95 ${filter === type
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {type === 'all' ? 'All Leads' : typeColors[type]?.label || type}
                  </button>
                ))}
                <span className="ml-auto text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-200">
                  {filteredLeads.length} Matches Found
                </span>
              </div>

              {/* Lead Cards */}
              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 rounded-3xl bg-white border border-slate-200 animate-pulse" />
                  ))}
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 border-dashed py-24 flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <ShoppingCart className="h-8 w-8" />
                  </div>
                  <p className="text-slate-400 font-bold">No leads available right now. Check back soon!</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredLeads.map((lead) => {
                    const tc = typeColors[lead.leadType] || typeColors.cold;
                    const hasDiscount = lead.discount > 0;
                    const timeRemaining = lead.expiresAt ? getRemainingTime(lead.expiresAt) : null;
                    return (
                      <article key={lead.id} className={`group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border-b-4 border-b-slate-100 hover:border-b-[#1f6f5f] ${!canPurchase ? 'opacity-60 grayscale' : ''}`}>
                        {/* Type Badge */}
                        <div className="flex items-center justify-between mb-8">
                          <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-tight ${tc.bg} ${tc.text}`}>
                            {tc.emoji} {tc.label}
                          </span>
                          <div className="flex items-center gap-3">
                            {lead.matchScore != null && (
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Match %</p>
                                <p className="text-sm font-black text-slate-900">{lead.matchScore}%</p>
                              </div>
                            )}
                            {timeRemaining && (
                              <div className="text-right border-l border-slate-200 pl-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Expires In</p>
                                <p className={`text-xs font-bold ${timeRemaining.includes('Expired') ? 'text-rose-600' : 'text-slate-500'}`}>{timeRemaining}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* V3 Match Scores */}
                        {(lead.scoreExpertise != null || lead.scoreCommunication != null || lead.scoreQuality != null) && (
                          <div className="mb-5 space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Match Breakdown (v3)</p>
                            <ScoreBar label="Expertise" value={lead.scoreExpertise} max={40} color="bg-violet-500" />
                            <ScoreBar label="Communication" value={lead.scoreCommunication} max={35} color="bg-sky-500" />
                            <ScoreBar label="Quality" value={lead.scoreQuality} max={25} color="bg-amber-500" />
                          </div>
                        )}
                        <LeadPatientPreview lead={lead} />

                        {(lead.scheduledAt || lead.appointmentType) && (
                          <div className="mb-4 flex flex-wrap gap-2 text-[10px] text-slate-500">
                            {lead.scheduledAt ? (
                              <span className="rounded-lg bg-slate-50 px-2 py-1 font-medium">
                                {new Date(lead.scheduledAt).toLocaleString('en-IN', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            ) : null}
                            {lead.appointmentType ? (
                              <span className="rounded-lg bg-slate-50 px-2 py-1 font-medium capitalize">
                                {lead.appointmentType}
                              </span>
                            ) : null}
                          </div>
                        )}

                        {/* Price Section */}
                        <div className="mb-8">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">One-time Fee</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-slate-900 tracking-tight">₹{lead.finalPrice}</span>
                            {hasDiscount && (
                              <span className="text-sm text-slate-400 line-through font-bold">₹{lead.basePrice}</span>
                            )}
                          </div>
                          {hasDiscount && (
                            <div className="mt-2 text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded w-fit uppercase">
                              Flash Deal: {lead.discount}% OFF
                            </div>
                          )}
                        </div>

                        {/* Buy Button */}
                        <button
                          type="button"
                          onClick={() => void onPurchase(lead.id)}
                          disabled={purchasing === lead.id || !canPurchase}
                          className={`group/btn mt-auto flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-black transition-all ${canPurchase
                            ? 'bg-slate-900 text-white hover:bg-[#1f6f5f] shadow-lg shadow-slate-900/10'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                          {purchasing === lead.id ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : !canPurchase ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <ShoppingCart className="h-4 w-4 group-hover/btn:scale-110 transition" />
                          )}
                          {!canPurchase ? 'Quota Locked' : purchasing === lead.id ? 'Processing...' : 'Buy This Lead'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>}
      </div>
    </div>
  );
}