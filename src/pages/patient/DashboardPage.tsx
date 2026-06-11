import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  CalendarDays,
  MessageSquare,
  ArrowRight,
  Check,
  Sparkles,
  CheckCircle2,
  Activity,
  SunMedium,
  CloudSun,
  MoonStar,
  Video,
  RefreshCw,
  Clock,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { isOnboardingRequiredError, patientApi } from '../../api/patient';
import { DashboardSkeletons } from '../../components/ui/Skeleton';
import DashboardCard from '../../components/ui/DashboardCard';
import { useQuery } from '@tanstack/react-query';

const moodEmojiMap: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
};

const formatDateTime = (value?: string | Date) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
};

const localDateKey = (value: Date = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameLocalDay = (value: unknown, dayKey: string) => {
  if (!value) return false;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return false;
  return localDateKey(date) === dayKey;
};

const isWithinMinutes = (dateValue: string | Date | undefined, minutes: number): boolean => {
  if (!dateValue) return false;
  const t = new Date(dateValue).getTime();
  if (Number.isNaN(t)) return false;
  const diffMins = (t - Date.now()) / 1000 / 60;
  return diffMins > -60 && diffMins <= minutes;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [moodValue, setMoodValue] = useState<number | null>(null);

  const dashboardQuery = useQuery(
    ['patient-dashboard-live'],
    async () => {
      const [dashboardRes, statsRes, assignments, prRes, historyRes] = await Promise.all([
        patientApi.getDashboardV2().catch((err) => {
          if (isOnboardingRequiredError(err)) throw err;
          throw err;
        }),
        patientApi.getMoodStats().catch(() => null),
        patientApi.getActiveCbtAssignments().catch(() => []),
        patientApi.getPendingAppointmentRequests().catch(() => []),
        patientApi.getSessionHistory().catch(() => null),
      ]);

      const dashboardData = dashboardRes?.data ?? dashboardRes ?? {};
      const statsData = (statsRes as any)?.data ?? statsRes;

      if (statsData?.currentStreak !== undefined) {
        dashboardData.streak = Number(statsData.currentStreak);
      }

      const pendingRequests = Array.isArray((prRes as any)?.requests)
        ? (prRes as any).requests
        : Array.isArray((prRes as any)?.data?.requests)
          ? (prRes as any).data.requests
          : Array.isArray((prRes as any)?.data)
            ? (prRes as any).data
            : Array.isArray(prRes)
              ? prRes
              : [];

      const rawHistory = (historyRes as any)?.sessions
        ?? (historyRes as any)?.data?.sessions
        ?? (historyRes as any)?.data
        ?? (Array.isArray(historyRes) ? historyRes : []);

      return {
        dashboard: dashboardData,
        activeAssignments: Array.isArray(assignments) ? assignments : [],
        pendingRequests,
        sessionHistory: Array.isArray(rawHistory) ? rawHistory : [],
      };
    },
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 30,
      onError: (err: any) => {
        if (isOnboardingRequiredError(err)) {
          navigate('/patient/onboarding?next=/patient/preferences', { replace: true });
        }
      }
    }
  );

  const { dashboard, activeAssignments = [], pendingRequests = [], sessionHistory = [] } = dashboardQuery.data || {};
  const loading = dashboardQuery.isLoading;
  const error = dashboardQuery.error ? (dashboardQuery.error as any)?.response?.data?.message || (dashboardQuery.error as any)?.message || 'Unable to load dashboard right now.' : null;

  useEffect(() => {
    if (dashboard?.moodTrend) {
      const todayStr = localDateKey();
      const todaysMood = dashboard.moodTrend.find((m: any) => isSameLocalDay(m.date, todayStr));
      if (todaysMood) setMoodValue(todaysMood.score);
    }
  }, [dashboard]);

  const userName = dashboard?.user?.name?.split(' ')[0] || 'there';
  const upcomingSession = dashboard?.upcomingSession || null;
  const moodTrend = Array.isArray(dashboard?.moodTrend) ? dashboard.moodTrend : [];
  const recentActivity = Array.isArray(dashboard?.recentActivity) ? dashboard.recentActivity : [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const welcomeMessage = `${greeting}, ${userName}. Take a deep breath, you're doing great.`;
  const TimeIcon = hour < 12 ? SunMedium : hour < 18 ? CloudSun : MoonStar;

  const normalizedMoodTrend = useMemo(() => {
    if (!moodTrend.length) return Array.from({ length: 7 }, (_, i) => ({ day: String(i), score: 3 }));
    return moodTrend.slice(-7).map((item: any) => ({
      day: new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' }),
      score: Number(item.score || 0),
    }));
  }, [moodTrend]);

  const avgMood = useMemo(() => {
    const total = normalizedMoodTrend.reduce((sum: number, point: any) => sum + Number(point.score || 0), 0);
    return Number((total / normalizedMoodTrend.length).toFixed(1)) || 0;
  }, [normalizedMoodTrend]);

  const quickPrompts = useMemo(() => {
    return avgMood <= 3
      ? ['I feel anxious today', 'Help me ground quickly']
      : ['Reflect on today', 'Help me protect this momentum'];
  }, [avgMood]);

  // Alert fires ONLY on deterioration (avg mood below 3 for recent days)
  const deteriorationAlert = useMemo(() => {
    if (moodTrend.length < 3) return false;
    const lastThree = moodTrend.slice(-3).map((m: any) => Number(m.score || 0));
    return lastThree.every((s) => s < 3);
  }, [moodTrend]);

  const connectedProvider = useMemo(() => {
    if (upcomingSession?.provider) return upcomingSession.provider;
    if (sessionHistory.length > 0) {
      const latest = sessionHistory[0];
      return latest?.provider ?? latest?.therapist ?? null;
    }
    return null;
  }, [upcomingSession, sessionHistory]);

  const lastSession = sessionHistory.length > 0 ? sessionHistory[0] : null;

  const canJoin = upcomingSession
    ? isWithinMinutes(upcomingSession.scheduledAt || upcomingSession.dateTime, 10)
    : false;

  if (loading) return <DashboardSkeletons />;
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{error}</div>;

  const moodChecked = Boolean(moodValue);
  const actionPlanTasksRemaining = activeAssignments.length + (moodChecked ? 0 : 1);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-20 lg:pb-6">

      {/* 0. SESSION ABOUT TO START — absolute top, green banner */}
      {canJoin && upcomingSession && (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-green-500 px-5 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">Your session is starting now</p>
              <p className="text-sm text-white/80">
                with {connectedProvider?.name || connectedProvider?.firstName || 'your provider'} · {formatDateTime(upcomingSession.scheduledAt || upcomingSession.dateTime)}
              </p>
            </div>
          </div>
          <Link
            to={`/video-session/${upcomingSession.id || upcomingSession.sessionId}`}
            className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-green-700 shadow-sm transition hover:bg-green-50"
          >
            Join Now →
          </Link>
        </div>
      )}

      {/* 1. DETERIORATION ALERT — top, only when mood drops below 3 for 3+ days */}
      {deteriorationAlert && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Your mood has been low for a few days</p>
            <p className="mt-0.5 text-xs text-amber-700">Your mood average is below 3 — your provider has been notified. Remember, small steps count.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link to="/patient/buddy/chat" className="inline-flex items-center gap-1 rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-200 transition">
              Talk to Buddy
            </Link>
            <button
              type="button"
              onClick={() => navigate('/crisis')}
              className="inline-flex items-center gap-1 rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
            >
              Crisis Support
            </button>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION — Daily Pulse */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-wellness-hero p-6 shadow-wellness-md sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(133,167,154,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(30,144,255,0.12),transparent_36%)]" />
        <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-white/55 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/55 shadow-wellness-sm">
              <TimeIcon className="h-4 w-4 text-wellness-sky" />
              Daily Pulse
            </div>
            <h1 className="mt-4 max-w-2xl font-serif text-4xl font-semibold tracking-tight text-wellness-deep sm:text-5xl">{welcomeMessage}</h1>
            <p className="mt-3 text-base text-charcoal/68 sm:text-lg">How are you feeling right now?</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => navigate(`/patient/check-in?tab=daily-mood&initialMood=${value * 2}`)}
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-[1.35rem] text-[1.8rem] transition-all duration-300 sm:h-16 sm:w-16 sm:text-[2rem] ${moodValue === value
                    ? 'bg-wellness-aqua ring-2 ring-wellness-sky/30 shadow-wellness-sm'
                    : 'bg-white/88 shadow-wellness-sm hover:bg-white'
                    }`}
                >
                  <span>{moodEmojiMap[value]}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-charcoal/55">Tap to log your mood — opens the full Daily Check-in.</p>
          </div>

          <div className="hidden md:block">
            <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-white/72 shadow-wellness-md">
              <div className="absolute inset-4 rounded-full bg-[linear-gradient(135deg,rgba(224,244,242,0.95),rgba(237,246,255,0.95))]" />
              <TimeIcon className="relative h-20 w-20 text-wellness-sky stroke-[1.5]" />
              <Sparkles className="absolute right-9 top-10 h-6 w-6 text-[#7fb6e8]" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. MY PROVIDER + SESSION STRIP */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Connected Provider & Next Session */}
        <DashboardCard as="section" className="flex flex-col transition-shadow hover:shadow-wellness-md">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-5 w-5 text-calm-sage" />
            <h2 className="text-lg font-semibold text-charcoal">My Provider</h2>
          </div>

          {connectedProvider ? (
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 rounded-[1.5rem] bg-wellness-aqua/60 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-wellness-sky/20 text-sm font-bold text-wellness-deep">
                  {(connectedProvider.name || connectedProvider.firstName || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal truncate">
                    {connectedProvider.name || `Dr. ${connectedProvider.firstName || 'Your Provider'}`}
                  </p>
                  <p className="text-xs text-charcoal/60 capitalize">
                    {connectedProvider.specialization || connectedProvider.role || 'Therapist'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Connected
                </span>
              </div>

              {upcomingSession ? (
                <div className="rounded-[1.5rem] bg-white/90 p-4 shadow-wellness-sm">
                  <p className="text-xs font-medium text-calm-sage uppercase tracking-wide mb-2">Next Session</p>
                  <div className="flex items-center gap-2 text-sm text-charcoal">
                    <Clock className="h-4 w-4 text-charcoal/40" />
                    <span className="font-medium">{formatDateTime(upcomingSession.scheduledAt || upcomingSession.dateTime)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {canJoin ? (
                      <Link
                        to={`/video-session/${upcomingSession.id || upcomingSession.sessionId}`}
                        className="wellness-primary-btn flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-4 text-sm"
                      >
                        <Video className="h-4 w-4" />
                        Join Now
                      </Link>
                    ) : (
                      <button disabled className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal/50 cursor-not-allowed">
                        <Video className="h-4 w-4" />
                        Join (opens 10 min before)
                      </button>
                    )}
                    <Link to="/patient/sessions" className="wellness-secondary-btn min-h-[40px] px-4 text-sm">
                      Manage
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.5rem] bg-white/90 p-4 shadow-wellness-sm">
                  <p className="text-sm text-charcoal/60">No upcoming session scheduled.</p>
                  <Link to="/patient/sessions" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-calm-sage hover:underline">
                    Go to My Care <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="flex-1 text-center py-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-charcoal">Finding your provider…</h3>
              <p className="mt-2 text-xs text-charcoal/60 max-w-xs mx-auto">TherapeuticGPS is matching you with the best provider. We'll notify you when confirmed.</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Link to="/patient/buddy/chat" className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition">
                  😊 Mood Tracker
                </Link>
                <Link to="/patient/buddy/chat" className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition">
                  🤖 AnytimeBuddy AI
                </Link>
                <Link to="/patient/sound-therapy" className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition">
                  🎵 Sound Therapy
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-calm-sage/10">
                <CalendarDays className="h-5 w-5 text-calm-sage" />
              </div>
              <p className="text-sm font-medium text-charcoal">No provider connected yet</p>
              <p className="mt-1 text-xs text-charcoal/55 text-center max-w-xs">Book your first session to get matched with a provider.</p>
              <Link to="/patient/sessions" className="wellness-primary-btn mt-4 gap-2 px-5 py-2.5 text-sm">
                Find a Provider <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </DashboardCard>

        {/* Last Session + Quick Rebook */}
        <DashboardCard as="section" className="flex flex-col transition-shadow hover:shadow-wellness-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-calm-sage" />
              <h2 className="text-lg font-semibold text-charcoal">Session History</h2>
            </div>
            <Link to="/patient/sessions" className="text-xs font-semibold text-calm-sage hover:underline">
              All Sessions →
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {lastSession ? (
              <>
                <div className="rounded-[1.5rem] bg-white/90 p-4 shadow-wellness-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-charcoal/50 uppercase tracking-wide">Last Session</p>
                      <p className="mt-1 text-sm font-semibold text-charcoal">
                        {lastSession.provider?.name || lastSession.therapist?.name || 'Your Provider'}
                      </p>
                      <p className="text-xs text-charcoal/55">{formatDateTime(lastSession.dateTime || lastSession.scheduledAt)}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">Completed</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to="/patient/sessions"
                    className="wellness-secondary-btn flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-4 text-sm"
                  >
                    All Sessions <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/patient/therapy-plan"
                    className="wellness-secondary-btn min-h-[40px] px-4 text-sm"
                  >
                    My Plan
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-charcoal/50">No past sessions yet.</p>
                <p className="mt-1 text-xs text-charcoal/40">Sessions you complete will appear here.</p>
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* 4. TODAY'S TASKS — inline, no separate URL */}
      <DashboardCard as="section" className="flex flex-col transition-shadow hover:shadow-wellness-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-calm-sage" />
            <h2 className="text-lg font-semibold text-charcoal">Today's Tasks</h2>
          </div>
          <span className="text-sm font-medium text-charcoal/40">{actionPlanTasksRemaining} remaining</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/patient/check-in?tab=daily-mood"
            className={`group flex items-center justify-between rounded-[1.4rem] p-4 transition-all ${moodChecked ? 'bg-wellness-aqua shadow-wellness-sm' : 'bg-white/90 shadow-wellness-sm hover:bg-white'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${moodChecked ? 'bg-wellness-sky text-white' : 'border-2 border-wellness-border group-hover:border-wellness-sky/40'}`}>
                {moodChecked && <Check className="h-3.5 w-3.5" />}
              </div>
              <span className={`font-medium text-sm ${moodChecked ? 'text-ink-400 line-through' : 'text-charcoal'}`}>Daily Check-in</span>
            </div>
            <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-charcoal transition-colors" />
          </Link>

          <Link
            to="/patient/sound-therapy"
            className="group flex items-center justify-between rounded-[1.4rem] bg-white/90 p-4 shadow-wellness-sm transition-all hover:bg-white"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-wellness-border group-hover:border-wellness-sky/40" />
              <span className="font-medium text-sm text-charcoal">Sound Therapy</span>
            </div>
            <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-charcoal transition-colors" />
          </Link>

          {activeAssignments.slice(0, 4).map((assignment) => (
            <Link
              key={assignment.id}
              to={`/patient/cbt-assignment/${assignment.id}`}
              className="group flex items-center justify-between rounded-[1.4rem] bg-white/90 p-4 shadow-wellness-sm transition-all hover:bg-white"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-wellness-border group-hover:border-wellness-sky/35" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-charcoal truncate">{assignment.title}</p>
                  <p className="text-[11px] text-charcoal/50">CBT Exercise</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 group-hover:text-charcoal transition-colors" />
            </Link>
          ))}

          {activeAssignments.length === 0 && (
            <div className="rounded-[1.4rem] bg-white/70 p-4 shadow-wellness-sm flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-wellness-border" />
              <div>
                <p className="text-sm font-medium text-charcoal/55">No exercises yet</p>
                <p className="text-[11px] text-charcoal/40">Your provider assigns these after your sessions</p>
              </div>
            </div>
          )}
        </div>

        <Link to="/patient/therapy-plan" className="mt-4 self-start text-xs font-semibold text-calm-sage hover:underline inline-flex items-center gap-1">
          View full therapy plan <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </DashboardCard>

      {/* 5. PROGRESS SNAPSHOT + AI NUDGE */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

        {/* Anytime Buddy */}
        <DashboardCard as="section" className="md:col-span-1 flex flex-col transition-shadow hover:shadow-wellness-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-terracotta/20">
              <Sparkles className="h-5 w-5 text-warm-terracotta" />
            </div>
            <h2 className="text-lg font-semibold text-charcoal">Anytime Buddy</h2>
          </div>

          <div className="flex-1 relative">
            <div className="wellness-bubble rounded-tl-[0.6rem] text-charcoal/76">
              {avgMood <= 3 ? (
                <>Hi {userName}! I noticed your mood was a bit lower recently. I have a quick 3-minute grounding exercise ready for you. Want to try it?</>
              ) : (
                <>Hi {userName}! Your streak looks great. Would you like to do a quick reflection to capture this positive momentum?</>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <Link
                  key={prompt}
                  to="/patient/messages"
                  className="rounded-full bg-wellness-aqua px-3.5 py-2 text-xs font-semibold text-charcoal/80 transition hover:bg-wellness-sky hover:text-white"
                >
                  {prompt}
                </Link>
              ))}
            </div>
          </div>

          <Link to="/patient/messages" className="wellness-secondary-btn mt-5 w-full gap-2 px-4 py-2.5">
            Chat with Anytime Buddy <MessageSquare className="h-4 w-4" />
          </Link>
        </DashboardCard>

        {/* Progress Snapshot */}
        <DashboardCard as="section" className="md:col-span-2 grid grid-cols-1 transition-shadow hover:shadow-wellness-md sm:grid-cols-2">
          <div className="flex flex-col border-b border-white/70 pb-4 sm:border-b-0 sm:border-r sm:border-r-white/70 sm:pb-0 sm:pr-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-calm-sage" />
              <h2 className="text-lg font-semibold text-charcoal">Progress Snapshot</h2>
            </div>

            <div className="flex items-center gap-8 mt-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-charcoal/50 font-semibold mb-1">Streak</p>
                <p className="text-3xl font-display font-bold text-charcoal flex items-center gap-2">
                  <span className="text-warm-terracotta">🔥</span> {dashboard?.streak ?? 0}
                </p>
                <p className="text-xs text-charcoal/40 mt-1">Days active</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-charcoal/50 font-semibold mb-1">Wellness</p>
                <p className="text-3xl font-display font-bold text-calm-sage">{dashboard?.wellnessScore ?? 0}</p>
                <p className="text-xs text-charcoal/40 mt-1">Out of 100</p>
              </div>
            </div>

            <Link to="/patient/progress" className="mt-auto pt-6 text-sm font-semibold text-calm-sage hover:text-sage-700 inline-flex items-center gap-1">
              View detailed analytics <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="pt-4 sm:pt-0 sm:pl-6 flex flex-col h-full min-h-[160px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/50 mb-3">7-Day Mood Trend</p>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={normalizedMoodTrend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A8B5A0" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A8B5A0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, borderColor: 'rgba(168,181,160,0.15)', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    formatter={(value: number) => [`${moodEmojiMap[value] || ''} (${value}/5)`, 'Mood']}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#1E90FF" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" dot={{ r: 4, fill: '#ffffff', stroke: '#1E90FF', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DashboardCard>
      </div>

    </div>
  );
}
