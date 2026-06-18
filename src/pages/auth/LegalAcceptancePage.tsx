import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, FileText, CheckCircle2, AlertCircle, Info, Lock, BookOpen, X, Loader2 } from 'lucide-react';
import { acceptLegalDocuments, getRequiredLegalDocuments, getApiErrorMessage, type LegalDocument } from '../../api/auth';
import Button from '../../components/ui/Button';
import { getPostLoginRoute, useAuth } from '../../context/AuthContext';

/* ── Lazy legal document components ─────────────────────────────────────── */
const LazyPrivacyPolicy = lazy(() => import('../legal/PrivacyPolicy'));
const LazyTermsOfService = lazy(() => import('../legal/TermsOfService'));
const LazyRefundPolicy = lazy(() => import('../legal/RefundAndCancellationPolicy'));
const LazyInformedConsent = lazy(() => import('../legal/RefundAndCancellationPolicy')); // per user request → /refunds
const LazyDPDPA = lazy(() => import('../legal/DPDPACompliance'));
const LazyCommunityGuidelines = lazy(() => import('../legal/CommunityGuidelines'));
const LazyTherapistIC = lazy(() => import('../legal/TherapistICAgr'));
const LazyTherapistNDA = lazy(() => import('../legal/TherapistNDA'));
const LazyTherapistDP = lazy(() => import('../legal/TherapistDataProcessingAgr'));

function getDocComponent(type: string): React.LazyExoticComponent<any> | null {
  const t = String(type || '').toUpperCase();
  if (t.includes('PRIVACY')) return LazyPrivacyPolicy;
  if (t.includes('TERMS')) return LazyTermsOfService;
  if (t.includes('INFORMED_CONSENT') || t.includes('INFORMED CONSENT')) return LazyInformedConsent;
  if (t.includes('REFUND') || t.includes('CANCELLATION')) return LazyRefundPolicy;
  if (t.includes('DPDPA') || t.includes('DATA_PROTECTION')) return LazyDPDPA;
  if (t.includes('COMMUNITY') || t.includes('GUIDELINES')) return LazyCommunityGuidelines;
  if (t.includes('THERAPIST_IC') || t.includes('INDEPENDENT_CONTRACTOR')) return LazyTherapistIC;
  if (t.includes('NDA')) return LazyTherapistNDA;
  if (t.includes('DATA_PROCESSING')) return LazyTherapistDP;
  return null;
}

/* ── URL helper (returnTo parsing) ──────────────────────────────────────── */
const parseReturnTo = (search: string): string => {
  const query = new URLSearchParams(search);
  const value = query.get('returnTo');
  if (!value) return '/dashboard';
  return value.startsWith('/') ? value : `/${value}`;
};

/* ── Document Viewer Modal ───────────────────────────────────────────────── */
interface DocModalProps {
  document: LegalDocument;
  onClose: () => void;
  onAccept: (id: string) => void;
}

function DocViewerModal({ document, onClose, onAccept }: DocModalProps) {
  const DocComponent = getDocComponent(document.type);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#f9fdfb] shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{document.title}</h2>
              <p className="text-[11px] text-slate-400">Version {document.version} · {document.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="overflow-y-auto flex-1 px-6 py-6 text-sm text-slate-700 leading-relaxed">
          {DocComponent ? (
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-sm">Loading document…</p>
              </div>
            }>
              <DocComponent />
            </Suspense>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Document preview not available.</p>
              <p className="text-xs mt-1">Please contact support if you need to review this document.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-[#f9fdfb] shrink-0 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Scroll through the full document before accepting
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
            >
              Close
            </button>
            <button
              onClick={() => { onAccept(document.id); onClose(); }}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Accept & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function LegalAcceptancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [acceptedDocs, setAcceptedDocs] = useState<Record<string, boolean>>({});
  const [viewingDoc, setViewingDoc] = useState<LegalDocument | null>(null);

  const returnTo = useMemo(() => parseReturnTo(location.search), [location.search]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getRequiredLegalDocuments();
        if (!isMounted) return;
        const activeDocs = (result as any).activeDocuments || result.pendingDocuments || [];
        const isRequired = result.legalAcceptanceRequired || activeDocs.length > 0;
        if (!isRequired || activeDocs.length === 0) {
          await checkAuth({ force: true });
          navigate(returnTo, { replace: true });
          return;
        }
        setDocuments(activeDocs);
      } catch (err) {
        if (!isMounted) return;
        setError(getApiErrorMessage(err, 'Unable to load legal documents'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void run();
    return () => { isMounted = false; };
  }, [checkAuth, navigate, returnTo]);

  const allAccepted = useMemo(
    () => documents.length > 0 && documents.every((doc) => !!acceptedDocs[doc.id]),
    [documents, acceptedDocs]
  );
  const acceptedCount = useMemo(
    () => documents.filter((doc) => !!acceptedDocs[doc.id]).length,
    [documents, acceptedDocs]
  );
  const progressPercent = useMemo(
    () => (documents.length === 0 ? 0 : (acceptedCount / documents.length) * 100),
    [documents, acceptedCount]
  );

  const handleToggleAll = () => {
    const nextState = !allAccepted;
    const nextAccepted: Record<string, boolean> = {};
    documents.forEach((doc) => { nextAccepted[doc.id] = nextState; });
    setAcceptedDocs(nextAccepted);
  };

  const handleAcceptAll = async () => {
    if (!allAccepted) return;
    setSubmitting(true);
    setError(null);
    try {
      await acceptLegalDocuments(
        documents.filter((doc) => acceptedDocs[doc.id]).map((doc) => ({ id: doc.id, version: doc.version }))
      );
      await checkAuth({ force: true });
      navigate(returnTo || getPostLoginRoute(user), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to accept legal documents'));
    } finally {
      setSubmitting(false);
    }
  };

  const getDocIcon = (type: string) => {
    const lowerType = String(type || '').toLowerCase();
    if (lowerType.includes('privacy') || lowerType.includes('data') || lowerType.includes('security'))
      return <Shield className="h-5 w-5 text-emerald-600" />;
    return <FileText className="h-5 w-5 text-[#2F7A5F]" />;
  };

  return (
    <>
      {/* Document Viewer Modal */}
      {viewingDoc && (
        <DocViewerModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onAccept={(id) => setAcceptedDocs((prev) => ({ ...prev, [id]: true }))}
        />
      )}

      <div className="bg-gradient-to-b from-[#f3f9f7] to-[#e6f2ee] min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full bg-white/95 backdrop-blur-sm border border-calm-sage/30 rounded-3xl p-6 sm:p-10 shadow-soft-xl transition-all duration-300 hover:shadow-soft-2xl">
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-calm-sage underline underline-offset-2 hover:text-[#2F7A5F] transition-colors duration-200"
            >
              Back to Home
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-5 mx-auto border border-emerald-100/50 shadow-sm animate-pulse">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-wellness-text tracking-tight sm:text-3xl font-display">
              Action Required: Legal Consent
            </h1>
            <p className="mt-3 text-sm text-wellness-muted sm:text-base max-w-md mx-auto">
              Please review and accept our updated legal agreements to access your dashboard and services.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-800 animate-fade-in" role="alert">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Action Failed</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-calm-sage/20 border-t-emerald-600" />
              <p className="text-sm font-medium text-wellness-muted animate-pulse">
                Retrieving required documents...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress indicator */}
              <div className="bg-[#fcfdfd] border border-calm-sage/20 rounded-2xl p-4">
                <div className="flex justify-between items-center text-xs font-semibold text-wellness-text mb-2">
                  <span>PROGRESS</span>
                  <span className="text-[#2F7A5F]">
                    {acceptedCount} of {documents.length} accepted ({Math.round(progressPercent)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-emerald-100/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#2F7A5F] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Document checklist */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {documents.map((document) => {
                  const isDocChecked = !!acceptedDocs[document.id];
                  const hasComponent = !!getDocComponent(document.type);
                  return (
                    <div
                      key={document.id}
                      className={`rounded-2xl border p-5 transition-all duration-300 ${isDocChecked
                        ? 'border-emerald-500/40 bg-emerald-50/20 shadow-soft-xs'
                        : 'border-calm-sage/20 bg-white hover:border-[#2F7A5F]/40'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="flex items-center h-5 mt-1 shrink-0">
                          <input
                            type="checkbox"
                            id={`doc-${document.id}`}
                            checked={isDocChecked}
                            onChange={(e) =>
                              setAcceptedDocs((prev) => ({ ...prev, [document.id]: e.target.checked }))
                            }
                            className="h-5 w-5 rounded-md border-calm-sage/40 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-all duration-200"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`doc-${document.id}`}
                            className="text-base font-semibold text-wellness-text cursor-pointer select-none flex items-center gap-1.5 hover:text-[#2F7A5F] transition-colors"
                          >
                            {getDocIcon(document.type)}
                            <span className="truncate">{document.title}</span>
                          </label>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-wellness-muted">
                            <span>Version: <strong className="text-wellness-text">{document.version}</strong></span>
                            <span className="text-calm-sage/40">|</span>
                            <span>Type: <strong className="text-wellness-text">{document.type}</strong></span>
                          </div>

                          {/* Read Document button */}
                          <button
                            type="button"
                            onClick={() => setViewingDoc(document)}
                            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-[#2F7A5F] transition-colors group"
                          >
                            <BookOpen className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                            {hasComponent ? 'Read full document before accepting' : 'View document summary'}
                          </button>
                        </div>
                      </div>

                      {/* Green confirmation when accepted */}
                      {isDocChecked && (
                        <div className="mt-3 ml-9 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          I have read and agree to the {document.title}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Select All / Info row */}
              <div className="flex justify-between items-center text-sm border-t border-calm-sage/10 pt-4">
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="text-xs font-semibold text-calm-sage hover:text-[#2F7A5F] transition-colors flex items-center gap-1.5 focus:outline-none"
                >
                  <CheckCircle2 className={`h-4 w-4 ${allAccepted ? 'text-[#2F7A5F]' : 'text-calm-sage'}`} />
                  {allAccepted ? 'Deselect All' : 'Select All Required'}
                </button>
                <span className="text-xs text-wellness-muted flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-calm-sage shrink-0" />
                  All documents must be accepted to continue
                </span>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="button"
                  fullWidth
                  loading={submitting}
                  disabled={!allAccepted}
                  onClick={handleAcceptAll}
                  className="py-3.5 text-base shadow-soft-md hover:shadow-soft-lg transition-all"
                >
                  {submitting ? 'Accepting agreements...' : 'Accept And Continue'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
