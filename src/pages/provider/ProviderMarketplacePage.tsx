import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Filter, Lock, Info, CheckCircle2, Loader2, X, Calendar, Clock, User } from 'lucide-react';
import { fetchProviderMarketplace, fetchProviderLeadStats, fetchProviderLeads, fetchProviderLeadCredits, purchaseProviderLead, purchaseProviderLeadWithCredit, claimProviderLeadWithQuota, scheduleLeadSession } from '../../api/provider';
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
  patientTimezone?: string | null;
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
    patientTimezone: preview.patientTimezone ?? lead.patientTimezone ?? patient.timezone ?? patient.patientTimezone ?? null,
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
  byType?: { hot: number; warm: number; cold: number };
  leadQualityMix?: string;
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
  const [credits, setCredits] = useState<{ hot: number; warm: number; cold: number }>({ hot: 0, warm: 0, cold: 0 });
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const paymentReturnHandledRef = useRef(false);
  const [scheduleModal, setScheduleModal] = useState<{ lead: any } | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  // Track confirmed session datetimes keyed by leadId for post-schedule display
  const [confirmedSessions, setConfirmedSessions] = useState<Record<string, string>>({});
  const [scheduling, setScheduling] = useState(false);

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
      fetchProviderLeadCredits().catch(() => ({ hot: 0, warm: 0, cold: 0 })),
    ])
      .then(([marketplaceData, statsData, myLeads, creditsData]) => {
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
        setCredits(creditsData);

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
        if (err?.response?.status === 403) {
          toast.error(err?.response?.data?.message || 'Please purchase a lead plan first to access the marketplace.');
        }
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

  const handleScheduleSession = async () => {
    if (!scheduleModal || !scheduleDate || !scheduleTime) {
      toast.error('Please select a date and time');
      return;
    }
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
    setScheduling(true);
    try {
      await scheduleLeadSession(scheduleModal.lead.id, scheduledAt);
      setConfirmedSessions((prev) => ({ ...prev, [scheduleModal.lead.id]: scheduledAt }));
      toast.success('Session scheduled! The patient will be notified.');
      setScheduleModal(null);
      setScheduleDate('');
      setScheduleTime('10:00');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to schedule session');
    } finally {
      setScheduling(false);
    }
  };

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

  const onClaimCombined = async (leadId: string, leadType: 'hot' | 'warm' | 'cold') => {
    if (!canPurchase || !stats) return;
    setPurchasing(leadId);
    
    const limit = (stats as any).planLimits?.[leadType] || 0;
    const used = stats.byType?.[leadType] || 0;
    const hasWeeklyQuota = stats.leadsRemaining > 0 && (limit - used > 0);

    try {
      if (hasWeeklyQuota) {
        await claimProviderLeadWithQuota(leadId);
        toast.success('Lead claimed using your weekly free quota!');
      } else {
        await purchaseProviderLeadWithCredit(leadId);
        toast.success('Lead acquired using your credit balance!');
      }
      setTab('purchased');
      loadData();
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      toast.error(serverMessage || 'Unable to claim this lead.');
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
    <>
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Premium Header */}
      <section className="bg-slate-900 px-6 py-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Growth Marketplace</span>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl text-white">Buy Additional Leads</h1>
              <p className="mt-4 text-slate-400 max-w-xl leading-relaxed">
                Scale your practice beyond your weekly plan constraints. First-come, first-served premium patient matches.
              </p>
            </div>

            {/* Status Pill */}
            {stats && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                <div className="space-y-2">
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
                  {/* Per-type breakdown */}
                  {stats.byType && (
                    <div className="flex items-center gap-2.5 text-[10px] font-semibold">
                      <span className="text-red-400">🔥 {stats.byType.hot}</span>
                      <span className="text-amber-400">🌟 {stats.byType.warm}</span>
                      <span className="text-blue-400">❄️ {stats.byType.cold}</span>
                    </div>
                  )}
                  {stats.leadQualityMix && (
                    <p className="text-[9px] text-slate-500 font-medium">{stats.leadQualityMix}</p>
                  )}
                  {/* Lead credit balance (from purchased subscription add-ons) */}
                  <div
                    className="mt-1 flex items-center gap-2.5 text-[10px] font-semibold border-t border-white/10 pt-2"
                    title="Lead credits come from hot/warm/cold lead bundles purchased as add-ons during subscription checkout. Each credit lets you claim one matching-tier lead for free."
                  >
                    <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">Credits:</span>
                    <span className="text-red-400">🔥 {credits.hot}</span>
                    <span className="text-amber-400">🌟 {credits.warm}</span>
                    <span className="text-blue-400">❄️ {credits.cold}</span>
                    <Info className="h-3 w-3 text-slate-500" />
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
              {t === 'marketplace' ? `Lead Marketplace (${leads.length})` : `My GPS-Matched Leads (${purchasedLeads.length})`}
            </button>
          ))}
        </div>

        {/* GPS-Matched Leads Tab */}
        {tab === 'purchased' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3">
              <p className="text-sm font-semibold text-teal-800">🎯 TherapeuticGPS Matched Leads</p>
              <p className="mt-1 text-xs text-teal-700">These leads are routed <strong>specifically to you</strong> by TherapeuticGPS based on your Expertise (40pts) + Communication (35pts) + Quality (25pts) score. New patients are matched to 1–3 specific providers only — not broadcast to everyone.</p>
            </div>
            {purchasedLeads.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-20 flex flex-col items-center gap-3">
                <ShoppingCart className="h-10 w-10 text-slate-300" />
                <p className="text-slate-400 font-bold">No GPS-matched leads yet</p>
                <p className="text-slate-400 text-sm">When new patients are matched to your profile, they appear here. Buy marketplace leads for additional volume.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Type</span>
                  <span>Patient</span>
                  <span>Scores</span>
                  <span>Match</span>
                  <span>Date</span>
                  <span></span>
                </div>
                {purchasedLeads.map((lead: any, idx: number) => {
                  const isScheduled = String(lead.status || '').toUpperCase() === 'ACCEPTED';
                  const tierKey = String(lead.leadType || lead.tier || 'cold').toLowerCase();
                  const tc = typeColors[tierKey] || typeColors.cold;
                  const confirmedAt = confirmedSessions[lead.id];
                  return (
                    <div
                      key={lead.id}
                      className={`grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 gap-y-1 px-4 py-3 items-center ${idx !== 0 ? 'border-t border-slate-100' : ''}`}
                    >
                      {/* Type badge */}
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${tc.bg} ${tc.text} whitespace-nowrap`}>
                        {tc.emoji} {tc.label}
                      </span>

                      {/* Patient info — single line */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{lead.patientName || 'Patient'}</p>
                        <div className="flex flex-wrap gap-x-2 mt-0.5">
                          {(lead.issue || []).slice(0, 3).map((c: string) => (
                            <span key={c} className="text-[10px] text-teal-700 bg-teal-50 rounded-full px-1.5 py-0 capitalize">{c.replace(/_/g, ' ')}</span>
                          ))}
                          {(lead.issue || []).length === 0 && <span className="text-[10px] text-slate-400">No concerns listed</span>}
                        </div>
                      </div>

                      {/* PHQ / GAD scores */}
                      <div className="flex gap-2 text-[11px] text-slate-500 whitespace-nowrap">
                        <span>PHQ <strong className="text-slate-800">{lead.phq9Score ?? '—'}</strong></span>
                        <span>GAD <strong className="text-slate-800">{lead.gad7Score ?? '—'}</strong></span>
                        {lead.primaryLanguage && <span className="text-slate-400">{lead.primaryLanguage}</span>}
                      </div>

                      {/* Match score */}
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        {lead.matchScore != null ? <strong className="text-slate-800">{lead.matchScore}</strong> : '—'}
                      </span>

                      {/* Date + status */}
                      <div className="text-[10px] text-slate-400 whitespace-nowrap">
                        <p>{new Date(lead.purchasedAt || lead.createdAt).toLocaleDateString('en-IN')}</p>
                        {isScheduled && (
                          <p className="text-green-600 font-semibold">
                            {confirmedAt
                              ? new Date(confirmedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                              : 'Scheduled ✓'}
                          </p>
                        )}
                      </div>

                      {/* Action */}
                      {!isScheduled ? (
                        <button
                          onClick={() => {
                            const preferred = lead.scheduledAt;
                            if (preferred) {
                              const dt = new Date(preferred);
                              if (!Number.isNaN(dt.getTime()) && dt > new Date()) {
                                setScheduleDate(dt.toISOString().slice(0, 10));
                                setScheduleTime(`${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`);
                              } else { setScheduleDate(''); setScheduleTime('10:00'); }
                            } else { setScheduleDate(''); setScheduleTime('10:00'); }
                            setScheduleModal({ lead });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-black hover:bg-teal-700 transition whitespace-nowrap"
                        >
                          Schedule →
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(lead.patientId ? `/provider/patient/${lead.patientId}/overview` : '/provider/patients')}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-[11px] font-black hover:bg-green-700 transition whitespace-nowrap"
                        >
                          View Patient →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'marketplace' && <>
          {/* Info Banner: show remaining weekly leads as info only */}
          {isPlatformActive && !isQuotaExhausted && (
            <div className="mb-6 p-4 rounded-2xl bg-teal-50 border border-teal-100 flex items-center gap-3">
              <Info className="h-4 w-4 text-teal-600 flex-shrink-0" />
              <p className="text-sm text-teal-800 font-medium">
                You have <strong>{leadsRemaining} out of {stats?.leadsPerWeek || 0}</strong> free weekly leads remaining. Marketplace leads are additional one-time purchases.
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
                          <div className="mb-4 flex flex-col gap-2 text-[10px] text-slate-500">
                            <div className="flex flex-wrap gap-2">
                              {lead.scheduledAt ? (
                                <div className="flex flex-col gap-1">
                                  <span className="rounded-lg bg-slate-50 px-2 py-1 font-medium w-fit">
                                    {new Date(lead.scheduledAt).toLocaleString('en-IN', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      timeZone: 'Asia/Kolkata',
                                    })} IST
                                  </span>
                                  {lead.patientTimezone && (
                                    <span className="rounded-lg bg-slate-50 px-2 py-1 font-medium w-fit">
                                      {new Date(lead.scheduledAt).toLocaleString('en-IN', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: lead.patientTimezone,
                                      })} ({lead.patientTimezone})
                                    </span>
                                  )}
                                </div>
                              ) : null}
                              {lead.appointmentType ? (
                                <span className="rounded-lg bg-slate-50 px-2 py-1 font-medium capitalize h-fit">
                                  {lead.appointmentType}
                                </span>
                              ) : null}
                            </div>
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

                        {/* Action Buttons */}
                        {(() => {
                          const limit = (stats as any)?.planLimits?.[lead.leadType as 'hot' | 'warm' | 'cold'] || 0;
                          const used = stats?.byType?.[lead.leadType as 'hot' | 'warm' | 'cold'] || 0;
                          const hasWeeklyQuota = (stats?.leadsRemaining || 0) > 0 && (limit - used > 0);
                          const availableCredits = credits[lead.leadType as 'hot' | 'warm' | 'cold'] || 0;
                          const hasCredits = availableCredits > 0;
                          const canClaimFree = hasWeeklyQuota || hasCredits;

                          if (canPurchase && canClaimFree) {
                            return (
                              <button
                                type="button"
                                onClick={() => void onClaimCombined(lead.id, lead.leadType as 'hot' | 'warm' | 'cold')}
                                disabled={purchasing === lead.id}
                                className="group/btn mt-auto flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-black border-2 border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
                              >
                                {purchasing === lead.id ? (
                                  <div className="h-4 w-4 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 group-hover/btn:scale-110 transition" />
                                )}
                                {purchasing === lead.id ? 'Processing...' : `Claim Lead`}
                              </button>
                            );
                          }

                          return (
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
                          );
                        })()}
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

    {/* Schedule Session Modal */}

    {scheduleModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Schedule Session</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pick a date & time for this patient's session</p>
            </div>
            <button onClick={() => setScheduleModal(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-700 shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{scheduleModal.lead.patientName || 'Patient'}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                  {scheduleModal.lead.phq9Score != null && <span>PHQ-9: <b className="text-slate-700">{scheduleModal.lead.phq9Score}</b></span>}
                  {scheduleModal.lead.gad7Score != null && <span>GAD-7: <b className="text-slate-700">{scheduleModal.lead.gad7Score}</b></span>}
                  {scheduleModal.lead.primaryLanguage && <span>Lang: <b className="text-slate-700">{scheduleModal.lead.primaryLanguage}</b></span>}
                </div>
                {scheduleModal.lead.issue && scheduleModal.lead.issue.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {scheduleModal.lead.issue.map((c: string) => (
                      <span key={c} className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 capitalize">{c.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                )}
                {scheduleModal.lead.scheduledAt && (
                  <p className="mt-1.5 text-[11px] text-amber-600 font-semibold">
                    Patient preferred: {new Date(scheduleModal.lead.scheduledAt).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Calendar className="h-3.5 w-3.5" /> Session Date *
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Clock className="h-3.5 w-3.5" /> Session Time *
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
            <button
              onClick={() => setScheduleModal(null)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleSession}
              disabled={scheduling || !scheduleDate || !scheduleTime}
              className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-black text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {scheduling && <Loader2 className="h-4 w-4 animate-spin" />}
              {scheduling ? 'Scheduling...' : 'Confirm Session'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
