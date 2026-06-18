import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ProviderSidebar } from './ProviderSidebar';
import { useAuth } from '../../context/AuthContext';
import { hasProviderSubmittedOnboarding } from '../../lib/providerOnboardingFlow';
import PersistentVideoLayout from './PersistentVideoLayout';
import { Lock, FileCheck, CreditCard, RefreshCw, MessageSquare, Menu, Zap } from 'lucide-react';
import { http } from '../../lib/http';
import { fetchProviderLeadStats, fetchProviderLeadCredits } from '../../api/provider';
import toast from 'react-hot-toast';

export const HubLayout = () => {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Lead credits for header
  const [leadStats, setLeadStats] = useState<{
    currentPlan: string;
    leadsPerWeek: number;
    leadsAssigned: number;
    leadsRemaining: number;
    byType?: { hot: number; warm: number; cold: number };
    leadQualityMix?: string;
  } | null>(null);
  const [leadCredits, setLeadCredits] = useState<{ hot: number; warm: number; cold: number } | null>(null);

  // Close sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Fetch lead stats for header display
  useEffect(() => {
    const providerRolesCheck = ['THERAPIST', 'PSYCHIATRIST', 'PSYCHOLOGIST', 'COACH'];
    if (!user || !providerRolesCheck.includes(String(user.role).toUpperCase())) return;

    fetchProviderLeadStats()
      .then((data) => {
        if (data) {
          console.log('[HubLayout] Lead stats loaded:', JSON.stringify(data));
          setLeadStats(data);
        } else {
          console.warn('[HubLayout] Lead stats returned empty data');
        }
      })
      .catch((err) => {
        console.warn('[HubLayout] Failed to load lead stats:', err?.response?.status, err?.response?.data?.message || err?.message);
      });

    fetchProviderLeadCredits()
      .then((data) => setLeadCredits(data))
      .catch((err) => {
        console.warn('[HubLayout] Failed to load lead credits:', err?.response?.status, err?.response?.data?.message || err?.message);
      });
  }, [user]);

  const handleSyncAccount = async () => {
    setSyncing(true);
    try {
      const res = await http.post('/v1/provider/platform-access/sync');
      const active = res.data?.data?.platformAccessActive;
      if (active) {
        await checkAuth({ force: true });
        toast.success('Platform access confirmed! Loading your dashboard...');
      } else {
        toast.error('No completed payment found. Please complete checkout first.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isProviderLiveSessionRoute = /^\/provider\/live-session\/.+/.test(location.pathname);
  const isSessionFocusMode = isProviderLiveSessionRoute && new URLSearchParams(location.search).get('focus') === '1';

  const providerRoles = ['THERAPIST', 'PSYCHIATRIST', 'PSYCHOLOGIST', 'COACH'];
  const isProvider = providerRoles.includes(String(user?.role).toUpperCase());
  const isClinicalRoute = location.pathname.includes('/patients') ||
    location.pathname.includes('/calendar') ||
    location.pathname.includes('/appointments') ||
    location.pathname.includes('/portal') ||
    location.pathname.includes('/dashboard');

  const needsPlatformFee = isProvider && !user?.platformAccessActive;
  const profileSubmitted = isProvider && hasProviderSubmittedOnboarding(user);
  const needsVerification = isProvider && profileSubmitted && user?.isTherapistVerified === false;

  const showClinicalLockout = isProvider && isClinicalRoute && (needsPlatformFee || needsVerification);

  const handleHeaderLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/auth/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      {isSessionFocusMode ? null : <ProviderSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />}

      <div className={`flex-1 flex flex-col w-full ${isSessionFocusMode ? '' : 'lg:ml-64'}`}>
        {isSessionFocusMode ? null : (
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="font-bold text-lg text-gray-800">Workspace</h1>
            </div>

            {/* Lead Credits Widget */}
            {leadStats && (
              <button
                type="button"
                onClick={() => navigate('/provider/leads')}
                className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all group cursor-pointer"
                title={`Plan: ${(leadStats.currentPlan || 'free').charAt(0).toUpperCase() + (leadStats.currentPlan || 'free').slice(1)} · ${leadStats.leadQualityMix || 'No leads'}`}
              >
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-[11px] font-bold text-slate-600 capitalize">
                    {leadStats.currentPlan || 'free'}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {leadStats.leadsRemaining}/{leadStats.leadsPerWeek}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">leads/wk</span>
                </div>

                <div className="h-4 w-px bg-slate-200" />

                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="text-red-600" title="Hot leads assigned this week">🔥 {leadStats.byType?.hot ?? 0}</span>
                  <span className="text-amber-600" title="Warm leads assigned this week">🌟 {leadStats.byType?.warm ?? 0}</span>
                  <span className="text-blue-600" title="Cold leads assigned this week">❄️ {leadStats.byType?.cold ?? 0}</span>
                </div>

                {leadCredits && (leadCredits.hot + leadCredits.warm + leadCredits.cold) > 0 && (
                  <>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 text-[10px] font-semibold" title="Purchased lead credits remaining (from subscription add-ons)">
                      <span className="text-slate-400 font-medium uppercase tracking-tighter">Credits</span>
                      <span className="text-red-500">🔥 {leadCredits.hot}</span>
                      <span className="text-amber-500">🌟 {leadCredits.warm}</span>
                      <span className="text-blue-500">❄️ {leadCredits.cold}</span>
                    </div>
                  </>
                )}

                {/* Tiny progress bar */}
                {leadStats.leadsPerWeek > 0 && (
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden" title={`${leadStats.leadsAssigned} of ${leadStats.leadsPerWeek} used`}>
                    <div
                      className={`h-full rounded-full transition-all ${leadStats.leadsRemaining === 0 ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(100, (leadStats.leadsAssigned / leadStats.leadsPerWeek) * 100)}%` }}
                    />
                  </div>
                )}
              </button>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#4A6741] bg-[#f0f5ee] px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-[#4A6741] rounded-full animate-pulse"></span>
                Online
              </div>

              <Link
                to="/provider/messages"
                className="relative p-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center"
                title="Messages"
                aria-label="Messages"
              >
                <MessageSquare size={20} className="text-gray-600" />
              </Link>

              {/* Notification Bell */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
                <span className="text-xl">🔔</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Avatar */}
              <button
                type="button"
                onClick={() => void handleHeaderLogout()}
                disabled={isLoggingOut}
                title={isLoggingOut ? 'Logging out...' : 'Logout'}
                className="flex items-center gap-2 p-1 pr-3 rounded-lg hover:bg-gray-100 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="w-8 h-8 rounded-full bg-[#E8EFE6] flex items-center justify-center text-[#4A6741] font-bold text-xs">
                  {user?.firstName ? user.firstName.charAt(0) : 'U'}
                </div>
                <span className="text-xs font-semibold text-gray-600">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </header>
        )}

        <main className={`flex-1 overflow-y-auto relative ${isSessionFocusMode ? 'p-0' : 'p-6'}`}>
          <PersistentVideoLayout>
            {showClinicalLockout ? (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>

                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-emerald-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Clinical Dashboard Locked</h2>
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    You currently have certification-only access. To unlock lead matching, patient calendar, and full clinical tools, you must complete the clinical verification process.
                  </p>

                  <div className="space-y-4 mb-8 text-left bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!needsPlatformFee ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-400'}`}>
                        <CreditCard size={16} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${!needsPlatformFee ? 'text-emerald-800' : 'text-gray-700'}`}>1. Platform Fee</p>
                        <p className="text-xs text-gray-500">Pay the initial onboarding fee</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-400`}>
                        <FileCheck size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">2. Clinical Verification</p>
                        <p className="text-xs text-gray-500">Submit RCI / NMC documents for review</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (needsPlatformFee) {
                        navigate('/provider/subscription');
                        return;
                      }
                      if (!profileSubmitted) {
                        navigate('/onboarding/provider-setup');
                        return;
                      }
                      navigate('/provider/verification-pending');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>
                      {needsPlatformFee
                        ? 'Pay Platform Fee to Start'
                        : !profileSubmitted
                          ? 'Complete Profile Setup'
                          : 'View Verification Status'}
                    </span>
                  </button>

                  <button
                    onClick={() => void handleSyncAccount()}
                    disabled={syncing}
                    className="w-full mt-3 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                    <span>{syncing ? 'Syncing...' : 'Already paid? Sync my account'}</span>
                  </button>

                  {needsVerification && !needsPlatformFee && (
                    <p className="mt-4 text-xs text-gray-500 font-medium">Pending Admin Approval</p>
                  )}
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </PersistentVideoLayout>
        </main>
      </div>
    </div>
  );
};

export default HubLayout;
