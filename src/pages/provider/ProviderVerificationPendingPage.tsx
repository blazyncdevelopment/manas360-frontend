import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasProviderSubmittedOnboarding } from '../../lib/providerOnboardingFlow';
import {
  clearOnboardingSubmittedFlag,
} from '../../utils/providerOnboardingStorage';

export default function ProviderVerificationPendingPage() {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();

  const onboardingStatus = String(user?.onboardingStatus || '').toUpperCase();
  const userKey = String(user?.id || user?.phone || user?.email || '').trim();

  useEffect(() => {
    if (!user) return;

    if (!user.platformAccessActive) {
      navigate('/provider/subscription', { replace: true });
      return;
    }

    if (!hasProviderSubmittedOnboarding(user)) {
      navigate('/onboarding/provider-setup', { replace: true });
      return;
    }

    if (onboardingStatus === 'REJECTED') {
      if (userKey) {
        clearOnboardingSubmittedFlag(userKey);
      }
      navigate('/onboarding/provider-setup', { replace: true });
      return;
    }

    if (user.isTherapistVerified) {
      if (userKey) {
        clearOnboardingSubmittedFlag(userKey);
      }
      navigate('/provider/dashboard', { replace: true });
    }
  }, [user, userKey, navigate, onboardingStatus]);

  useEffect(() => {
    if (!user || user.isTherapistVerified || onboardingStatus === 'REJECTED') return;

    const poll = window.setInterval(() => {
      void checkAuth({ force: true });
    }, 30000);

    return () => window.clearInterval(poll);
  }, [user, onboardingStatus, checkAuth]);

  const handleGoToLogin = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed during login redirection:', err);
    }
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Pending Review</p>
        <h1 className="mt-2 text-2xl font-semibold text-amber-950">Your provider profile is under review</h1>
        <p className="mt-3 text-sm text-amber-900">
          You completed all 7 onboarding steps. An admin is reviewing your credentials before dashboard access is
          enabled. You will be redirected automatically once approved.
        </p>

        <div className="mt-5 rounded-lg border border-amber-300 bg-white p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">What happens next?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your submitted profile is queued for admin review.</li>
            <li>Registration details and documents are validated.</li>
            <li>After approval, you can access the full provider dashboard on your next visit.</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void checkAuth({ force: true })}
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 transition"
          >
            Check approval status
          </button>
          <button
            type="button"
            onClick={() => void handleGoToLogin()}
            className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            Go to Login
          </button>
          <Link to="/" className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
