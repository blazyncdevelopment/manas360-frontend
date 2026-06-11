import { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Home,
  BarChart3,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { patientApi } from '../../api/patient';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '../../context/AuthContext';
import { getDraftStorageKey } from '../../hooks/useAssessmentFlow';
import { FeatureGate } from '../FeatureGate';
import { Manas360BrandLogo } from '../common/Manas360BrandLogo';

const STORAGE_KEY_MDC = 'mdc_user';

const mainNavItems = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: Home },
  { to: '/patient/therapy-plan', label: 'My Therapy Plan', icon: ClipboardList, feature: 'progress-tracking' },
  { to: '/patient/sessions', label: 'My Care', icon: CalendarDays, feature: 'scheduling' },
  { to: '/patient/group-therapy', label: 'Group Therapy', icon: CalendarDays, badge: 'Live', feature: 'group-therapy' },
];


const selfCareNavItems = [
  { to: '/patient/check-in', label: 'Daily Check-in', icon: HeartPulse, feature: 'daily-checkin' },
  { to: '/patient/wellness-library', label: 'Premium Library', icon: Sparkles, feature: 'wellness-library' },
  { to: '/patient/settings', label: 'My Preferences', icon: SlidersHorizontal },
];

const progressNavItems = [
  { to: '/patient/progress', label: 'My Progress', icon: BarChart3, feature: 'progress-tracking' },
  { to: '/patient/reports', label: 'My Reports', icon: ClipboardList },
  { to: '/patient/documents', label: 'My Documents', icon: ClipboardList },
];

const supportNavItems = [
  { to: '/patient/support', label: 'Help Center', icon: LifeBuoy },
];

const bottomNavItems = [
  { to: '/patient/dashboard', label: 'Home', icon: Home },
  { to: '/patient/check-in', label: 'Check-in', icon: HeartPulse },
  { to: '/patient/sessions', label: 'My Care', icon: CalendarDays },
  { to: '/patient/messages', label: 'Support', icon: MessageSquare },
  { to: '/patient/settings', label: 'Account', icon: Settings2 },
];

type NavItem = {
  to: string;
  label: string;
  icon: any;
  badge?: string;
  feature?: string;
};

type BuddyMessage = { role: 'user' | 'assistant'; content: string };

const BUDDY_QUICK_PROMPTS = [
  "I'm feeling anxious right now",
  'Help me calm down',
  'I need to talk to someone',
  'Give me a breathing exercise',
];

export default function PatientDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [buddyFullOpen, setBuddyFullOpen] = useState(false);
  const [buddyMessages, setBuddyMessages] = useState<BuddyMessage[]>([]);
  const [buddyInput, setBuddyInput] = useState('');
  const [buddySending, setBuddySending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { balance } = useWallet();
  const [mdcUser, setMdcUser] = useState<any>(null);
  const isMdcMode = !!mdcUser;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_MDC);
    if (stored) {
      try {
        setMdcUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse mdc_user', e);
      }
    }
  }, []);

  const walletBalance = balance ? Number((balance as any)?.total_balance ?? 0) : null;

  const fetchUnread = useCallback(async () => {
    if (!user || user.role !== 'patient') {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await patientApi.getNotifications();
      const data = (res as any)?.data ?? res;
      const items = Array.isArray(data) ? data : [];
      setUnreadCount(items.filter((n: any) => !n.read).length);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { void fetchUnread(); }, [fetchUnread]);

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Patient';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PT';

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const disableSidebarAndNav = false;

  const sendBuddyMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || buddySending) return;
    const userMsg: BuddyMessage = { role: 'user', content: trimmed };
    setBuddyMessages((prev) => [...prev, userMsg]);
    setBuddyInput('');
    setBuddySending(true);
    try {
      const history = [...buddyMessages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await patientApi.aiChat({ messages: history }) as any;
      const reply = res?.data?.message || res?.message || 'I\'m here for you. Could you tell me more?';
      setBuddyMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setBuddyMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I\'m having trouble connecting right now. Please try again.' }]);
    } finally {
      setBuddySending(false);
    }
  };

  const pageTitleMap: Record<string, string> = {
    '/patient/dashboard': 'Dashboard',
    '/patient/therapy-plan': 'My Therapy Plan',
    '/patient/sessions': 'Sessions',
    '/patient/care-team': 'Care Team',
    '/patient/messages': 'AI Support',
    '/patient/check-in': 'Daily Check-in',
    '/patient/insights': 'My Progress',
    '/patient/timeline': 'Patient Timeline',
    '/patient/assessment-reports': 'My Progress',
    '/patient/reports': 'Reports',

    '/patient/support': 'Help Center',
    '/patient/settings': 'Settings',
    '/patient/profile': 'Profile',
    '/patient/preferences': 'My Preferences',
    '/patient/wellness-library': 'Premium Library',
    '/patient/digital-pets': 'Digital Pets Hub',
    '/patient/sleep-therapy': 'Sleep Therapy',
    '/patient/sound-therapy': 'Sound Therapy',
    '/sound-therapy': 'Sound Therapy',
    '/patient/buddy': 'AI Buddy',
    '/patient/notifications': 'Notifications',
    '/patient/progress': 'My Progress',
    '/patient/provider-messages': 'Messages',
    '/patient/group-therapy': 'Group Therapy',
  };
  const pageTitle = Object.entries(pageTitleMap).find(([path]) => location.pathname.startsWith(path))?.[1] || 'Dashboard';

  const formattedWalletBalance = walletBalance === null
    ? '₹—'
    : `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(walletBalance)}`;

  const handleLogout = async () => {
    // Clear user-scoped assessment draft so the next user doesn't see stale gate state
    try {
      const scopedKey = getDraftStorageKey(user?.id || undefined);
      localStorage.removeItem(scopedKey);
      sessionStorage.removeItem(scopedKey);
      // Also sweep legacy unscoped key (for backward compat with any old draft)
      localStorage.removeItem('patient-clinical-assessment-draft-v1');
      sessionStorage.removeItem('patient-clinical-assessment-draft-v1');
    } catch { /* ignore storage errors */ }

    if (isMdcMode) {
      localStorage.removeItem(STORAGE_KEY_MDC);
      navigate('/mdc/login', { replace: true });
    } else {
      await logout();
      navigate('/auth/login', { replace: true });
    }
  };

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileSidebarOpen || profileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen, profileMenuOpen]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [profileMenuOpen]);

  const renderNavSection = (heading: string, items: NavItem[]) => (
    <div>
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/45">{heading}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          const link = (
            <Link
              key={`${heading}-${item.to}-${item.label}`}
              to={item.to}
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex min-h-[50px] items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] transition ${active
                ? 'bg-wellness-aqua font-semibold text-wellness-deep shadow-[0_10px_26px_rgba(30,75,63,0.08)]'
                : 'text-charcoal/72 hover:bg-white/85 hover:text-charcoal'
                }`}
            >
              <Icon className={`h-[19px] w-[19px] ${active ? 'text-wellness-sky' : 'text-charcoal/42'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.badge === 'AI'
                    ? 'bg-wellness-sky text-white'
                    : item.badge === 'Premium'
                      ? 'bg-warm-terracotta/15 text-warm-terracotta'
                      : 'bg-wellness-aqua text-charcoal/75'
                    }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );

          if (item.feature) {
            return <FeatureGate key={item.to} feature={item.feature}>{link}</FeatureGate>;
          }
          return link;
        })}
      </div>
    </div>
  );

  return (
    <div className="patient-shell-bg min-h-screen text-charcoal">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="mx-auto flex w-full max-w-[1600px] items-start">
        <aside
          className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(242,248,247,0.98))] backdrop-blur-md transition-transform duration-300 lg:sticky lg:top-0 lg:self-start lg:z-20 lg:h-screen lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } ${disableSidebarAndNav ? 'pointer-events-none opacity-50 select-none' : ''}`}
        >
          <div className="flex h-20 items-center justify-between border-b border-white/70 px-5">
            <Link
              to="/patient/dashboard"
              className="transition-opacity hover:opacity-90"
              aria-label="MANAS360 dashboard home"
            >
              <Manas360BrandLogo size="sm" showIcon />
            </Link>

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-charcoal/60 hover:bg-wellness-aqua lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Patient dashboard navigation">
            {renderNavSection('Main', mainNavItems)}
            {renderNavSection('Self Care', selfCareNavItems)}
            {renderNavSection('Progress', progressNavItems)}
            {renderNavSection('Support', supportNavItems)}
          </nav>

          <div className="border-t border-white/70 p-4">
            <div className="wellness-panel-muted flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-terracotta/25 text-xs font-semibold text-warm-terracotta">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-charcoal">{userName}</p>
                <p className="text-[11px] text-charcoal/55">Patient Account</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-3 text-sm font-medium text-charcoal/80 transition hover:bg-wellness-aqua"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen w-full flex-1 flex-col lg:ml-0">
          <header className="sticky top-0 z-30 flex h-20 items-center border-b border-white/70 bg-white/86 px-3 backdrop-blur-xl sm:px-4 lg:px-6 shadow-[0_10px_40px_rgba(26,69,58,0.04)] supports-[backdrop-filter]:bg-white/78">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-charcoal/70 transition-colors hover:bg-wellness-aqua active:bg-wellness-aqua lg:hidden ${disableSidebarAndNav ? 'pointer-events-none opacity-50 select-none' : ''}`}
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                <div>
                  <p className="font-display text-xl font-semibold leading-none tracking-tight text-charcoal">{pageTitle}</p>
                  <p className="mt-1 hidden text-xs leading-none tracking-[0.12em] text-charcoal/45 sm:block">{todayLabel}</p>
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {!isMdcMode && (
                <>
                  <div className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-800/70">Wallet</span>
                    <span>{formattedWalletBalance}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/crisis')}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    <span className="hidden sm:inline">Crisis Support</span>
                    <span className="sm:hidden">🆘</span>
                  </button>
                </>
              )}

              <Link
                to="/patient/provider-messages"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl text-charcoal/55 transition hover:bg-wellness-aqua"
                aria-label="Messages"
                title="Messages"
              >
                <MessageSquare className="h-4 w-4" />
              </Link>

              <Link
                to="/patient/notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl text-charcoal/55 transition hover:bg-wellness-aqua"
                aria-label="Open notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white" aria-hidden="true">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-charcoal/60 transition hover:bg-wellness-aqua"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setProfileMenuOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl p-1 pr-2 transition hover:bg-wellness-aqua"
                aria-label="Open profile menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-terracotta/25 text-xs font-semibold text-warm-terracotta">
                  {initials}
                </div>
              </button>
            </div>
          </header>

          <main className="w-full flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-7">
            <div className="wellness-page-shell rounded-[2rem] p-3 sm:p-4 lg:p-5">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <nav className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/80 bg-white/92 px-2 py-2 backdrop-blur-md lg:hidden ${disableSidebarAndNav ? 'pointer-events-none opacity-50 select-none' : ''}`}>
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex min-h-[50px] flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-medium ${active ? 'bg-wellness-aqua text-charcoal shadow-wellness-sm' : 'text-charcoal/70 hover:bg-wellness-card'
                  }`}
              >
                <Icon className="mb-0.5 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating AnytimeBuddy button — opens full modal directly */}
      <div className={`fixed bottom-[80px] right-4 z-[55] lg:bottom-6 lg:right-6 ${disableSidebarAndNav ? 'pointer-events-none opacity-0' : ''}`}>
        <button
          type="button"
          onClick={() => setBuddyFullOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition hover:scale-105 hover:bg-teal-700 active:scale-95"
          aria-label="Open AnytimeBuddy AI"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>

      {/* Full-screen AnytimeBuddy chat modal */}
      {buddyFullOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between bg-teal-600 px-4 py-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white">AnytimeBuddy</p>
                <p className="text-xs text-white/75">Your 24/7 AI wellness companion</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBuddyFullOpen(false)}
              className="rounded-xl p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {buddyMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                  <Sparkles className="h-8 w-8 text-teal-500" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-800">Hi, I'm AnytimeBuddy</p>
                  <p className="mt-1 text-sm text-gray-500">I'm here to support you between sessions. What's on your mind?</p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-2">
                  {BUDDY_QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendBuddyMessage(prompt)}
                      className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-left text-sm text-teal-800 transition hover:bg-teal-100"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {buddyMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 mt-1">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {buddySending && (
              <div className="flex justify-start">
                <div className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 mt-1">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts (when messages exist) */}
          {buddyMessages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-2 border-t border-gray-100 scrollbar-hide">
              {BUDDY_QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendBuddyMessage(prompt)}
                  className="flex-shrink-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs text-teal-800 transition hover:bg-teal-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <form
              onSubmit={(e) => { e.preventDefault(); void sendBuddyMessage(buddyInput); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={buddyInput}
                onChange={(e) => setBuddyInput(e.target.value)}
                placeholder="Type a message…"
                disabled={buddySending}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={buddySending || !buddyInput.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:opacity-50"
                aria-label="Send"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-end bg-charcoal/20 p-3 pt-16 backdrop-blur-sm sm:p-4 sm:pt-20"
          onClick={() => setProfileMenuOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-[2rem] border border-white/80 bg-white/96 p-3 shadow-wellness-md"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Profile menu"
          >
            <div className="mb-2 flex items-center gap-3 rounded-2xl bg-wellness-card px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-terracotta/25 text-xs font-semibold text-warm-terracotta">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-charcoal">{userName}</p>
                <p className="text-[11px] text-charcoal/55">Patient Account</p>
              </div>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate('/patient/profile');
                }}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-charcoal/80 transition hover:bg-wellness-card hover:text-charcoal"
              >
                <User className="h-[18px] w-[18px] text-charcoal/50" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate('/patient/settings');
                }}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-charcoal/80 transition hover:bg-wellness-card hover:text-charcoal"
              >
                <Settings2 className="h-[18px] w-[18px] text-charcoal/50" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate('/patient/support');
                }}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-charcoal/80 transition hover:bg-wellness-card hover:text-charcoal"
              >
                <LifeBuoy className="h-[18px] w-[18px] text-charcoal/50" />
                <span>Help & Support</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  void handleLogout();
                }}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-charcoal/80 transition hover:bg-wellness-card hover:text-charcoal"
              >
                <LogOut className="h-[18px] w-[18px] text-charcoal/50" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
