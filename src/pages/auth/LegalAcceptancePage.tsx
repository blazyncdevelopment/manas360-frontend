import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, FileText, CheckCircle2, AlertCircle, Info, Lock } from 'lucide-react';
import { acceptLegalDocuments, getRequiredLegalDocuments, getApiErrorMessage, type LegalDocument } from '../../api/auth';
import Button from '../../components/ui/Button';
import { getPostLoginRoute, useAuth } from '../../context/AuthContext';

const parseReturnTo = (search: string): string => {
  const query = new URLSearchParams(search);
  const value = query.get('returnTo');
  if (!value) {
    return '/dashboard';
  }

  return value.startsWith('/') ? value : `/${value}`;
};

export default function LegalAcceptancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [acceptedDocs, setAcceptedDocs] = useState<Record<string, boolean>>({});

  const returnTo = useMemo(() => parseReturnTo(location.search), [location.search]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getRequiredLegalDocuments();
        if (!isMounted) return;

        // Support both backend payload keys for maximum safety
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
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [checkAuth, navigate, returnTo]);

  const allAccepted = useMemo(() => {
    return documents.length > 0 && documents.every((doc) => !!acceptedDocs[doc.id]);
  }, [documents, acceptedDocs]);

  const acceptedCount = useMemo(() => {
    return documents.filter((doc) => !!acceptedDocs[doc.id]).length;
  }, [documents, acceptedDocs]);

  const progressPercent = useMemo(() => {
    if (documents.length === 0) return 0;
    return (acceptedCount / documents.length) * 100;
  }, [documents, acceptedCount]);

  const handleToggleAll = () => {
    const nextState = !allAccepted;
    const nextAccepted: Record<string, boolean> = {};
    documents.forEach((doc) => {
      nextAccepted[doc.id] = nextState;
    });
    setAcceptedDocs(nextAccepted);
  };

  const handleAcceptAll = async () => {
    if (!allAccepted) return;
    setSubmitting(true);
    setError(null);

    try {
      const activeDocsToAccept = documents.filter((doc) => acceptedDocs[doc.id]);

      // Call acceptLegalDocuments API utility which matches the requested format
      await acceptLegalDocuments(
        activeDocsToAccept.map((doc) => ({
          id: doc.id,
          version: doc.version,
        }))
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
    if (lowerType.includes('privacy') || lowerType.includes('data') || lowerType.includes('security')) {
      return <Shield className="h-5 w-5 text-emerald-600" />;
    }
    return <FileText className="h-5 w-5 text-[#2F7A5F]" />;
  };

  return (
    <div className="bg-gradient-to-b from-[#f3f9f7] to-[#e6f2ee] min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white/95 backdrop-blur-sm border border-calm-sage/30 rounded-3xl p-6 sm:p-10 shadow-soft-xl transition-all duration-300 hover:shadow-soft-2xl">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-calm-sage underline underline-offset-2 hover:text-[#2F7A5F] transition-colors duration-200">
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
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-calm-sage/20 border-t-emerald-600"></div>
            </div>
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
                ></div>
              </div>
            </div>

            {/* Document checklist */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {documents.map((document) => {
                const isDocChecked = !!acceptedDocs[document.id];
                return (
                  <div
                    key={document.id}
                    className={`rounded-2xl border p-4.5 transition-all duration-300 flex items-start gap-3.5 ${isDocChecked
                      ? 'border-emerald-500/40 bg-emerald-50/10 shadow-soft-xs'
                      : 'border-calm-sage/20 bg-white hover:border-[#2F7A5F]/40'
                      }`}
                  >
                    <div className="flex items-center h-5 mt-1">
                      <input
                        type="checkbox"
                        id={`doc-${document.id}`}
                        checked={isDocChecked}
                        onChange={(e) => {
                          setAcceptedDocs((prev) => ({
                            ...prev,
                            [document.id]: e.target.checked,
                          }));
                        }}
                        className="h-5 w-5 rounded-md border-calm-sage/40 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-all duration-200"
                      />
                    </div>
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
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selector Options */}
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

            {/* Submission actions */}
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
  );
}
