import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { groupTherapyApi } from '../../api/groupTherapy';
import { patientApi } from '../../api/patient';
import { useAuth } from '../../context/AuthContext';
import { Clock, Globe, Users, AlertCircle, KeyRound, Copy } from 'lucide-react';

type ComputedState = 'LIVE' | 'NEXT' | 'TODAY' | 'UPCOMING' | 'FULL' | 'EXPIRED';

const FIXED_TOPICS = [
  { key: 'anxiety', label: 'Anxiety', emoji: '😟' },
  { key: 'grief', label: 'Grief', emoji: '💔' },
  { key: 'sleep', label: 'Sleep', emoji: '😴' },
  { key: 'burnout', label: 'Burnout', emoji: '💼' },
  { key: 'relationships', label: 'Relationships', emoji: '💑' },
  { key: 'mindfulness', label: 'Mindfulness', emoji: '🧘' },
  { key: 'exam-stress', label: 'Exam Stress', emoji: '🎓' },
  { key: 'self-worth', label: 'Self-worth', emoji: '🌅' },
];

const STATE_ORDER: Record<ComputedState, number> = { LIVE: 0, NEXT: 1, TODAY: 2, UPCOMING: 3, FULL: 4, EXPIRED: 5 };

const computeState = (row: any, nowTs: number): ComputedState => {
  const max = Number(row?.maxMembers || 0);
  const joined = Number(row?.joinedCount || 0);
  if (max > 0 && joined >= max) return 'FULL';

  const at = new Date(String(row?.scheduledAt || ''));
  if (Number.isNaN(at.getTime())) return 'UPCOMING';

  const dur = Math.max(1, Number(row?.durationMinutes || 60));
  const start = at.getTime();
  const end = start + dur * 60_000;

  if (nowTs >= start && nowTs <= end) return 'LIVE';
  if (nowTs > end) return 'EXPIRED';
  if (start - nowTs < 2 * 60 * 60_000) return 'NEXT';

  const today = new Date(nowTs);
  if (
    at.getFullYear() === today.getFullYear() &&
    at.getMonth() === today.getMonth() &&
    at.getDate() === today.getDate()
  ) return 'TODAY';

  return 'UPCOMING';
};

const buildCountdown = (scheduledAt: string, nowTs: number): string => {
  const diff = new Date(scheduledAt).getTime() - nowTs;
  if (diff <= 0) return '';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `Going live in ${h}h ${m}m` : `Going live in ${m}m`;
};

const topicAccent = (topic: string, title: string): string => {
  const k = `${topic} ${title}`.toLowerCase();
  if (k.includes('anxiety')) return '#ef4444';
  if (k.includes('grief') || k.includes('depression')) return '#f59e0b';
  if (k.includes('sleep')) return '#6366f1';
  if (k.includes('burnout') || k.includes('work')) return '#f97316';
  if (k.includes('relationship') || k.includes('couple')) return '#ec4899';
  if (k.includes('mindfulness')) return '#14b8a6';
  if (k.includes('exam') || k.includes('student')) return '#06b6d4';
  if (k.includes('self') || k.includes('worth')) return '#8b5cf6';
  return '#5eaaa8';
};

const topicEmoji = (topic: string, title: string): string => {
  const k = `${topic} ${title}`.toLowerCase();
  if (k.includes('anxiety')) return '😟';
  if (k.includes('grief')) return '💔';
  if (k.includes('sleep')) return '😴';
  if (k.includes('burnout') || k.includes('work')) return '💼';
  if (k.includes('relationship') || k.includes('couple')) return '💑';
  if (k.includes('mindfulness')) return '🧘';
  if (k.includes('exam') || k.includes('student')) return '🎓';
  if (k.includes('self') || k.includes('worth')) return '🌅';
  return '👥';
};

const matchesTopic = (row: any, key: string): boolean => {
  const t = `${row?.topic || ''} ${row?.title || ''}`.toLowerCase();
  return t.includes(key.replace('-', ' ').replace('-', ' '));
};

const StateBadge = ({ state, scheduledAt, nowTs }: { state: ComputedState; scheduledAt: string; nowTs: number }) => {
  if (state === 'LIVE') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        LIVE
      </span>
    );
  }
  if (state === 'NEXT') {
    const cd = buildCountdown(scheduledAt, nowTs);
    return <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white">NEXT · {cd || new Date(scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>;
  }
  if (state === 'TODAY') {
    return <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">TODAY · {new Date(scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>;
  }
  if (state === 'FULL') {
    return <span className="rounded-full border border-calm-sage/30 bg-calm-sage/10 px-2.5 py-1 text-[10px] font-bold text-charcoal/50">FULL</span>;
  }
  const dt = new Date(scheduledAt);
  return (
    <span className="rounded-full bg-indigo-500 px-2.5 py-1 text-[10px] font-bold text-white">
      {dt.toLocaleDateString([], { weekday: 'short' }).toUpperCase()} · {dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
    </span>
  );
};

const ctaLabel = (state: ComputedState, priceMinor: number): string => {
  const price = Math.round(priceMinor / 100);
  if (state === 'LIVE') return `JOIN NOW — ₹${price}`;
  if (state === 'NEXT' || state === 'TODAY') return `RESERVE SEAT — ₹${price}`;
  if (state === 'FULL') return 'NOTIFY ME';
  return `REGISTER — ₹${price}`;
};

const ctaClass = (state: ComputedState): string => {
  if (state === 'LIVE') return 'bg-red-600 text-white hover:bg-red-700';
  if (state === 'NEXT') return 'bg-amber-500 text-white hover:bg-amber-600';
  if (state === 'TODAY') return 'bg-emerald-600 text-white hover:bg-emerald-700';
  if (state === 'FULL') return 'border border-calm-sage/20 bg-calm-sage/5 text-charcoal/50 cursor-default';
  return 'bg-indigo-600 text-white hover:bg-indigo-700';
};

export default function GroupTherapySessionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isPublicPath = location.pathname === '/group-therapy';
  const [publicSessions, setPublicSessions] = useState<any[]>([]);
  const [privateInvites, setPrivateInvites] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);

  const tryCompleteGroupTherapyTask = async () => {
    try {
      const plan = await patientApi.getTherapyPlan();
      const tasks: any[] = plan?.tasks ?? plan?.data?.tasks ?? (plan as any)?.data?.plan?.tasks ?? [];
      const task = tasks.find((t: any) => {
        const type = String(t?.type || '').toLowerCase();
        const title = String(t?.title || '').toLowerCase();
        const status = String(t?.status || '').toLowerCase();
        return status !== 'completed' && (type.includes('group') || title.includes('group'));
      });
      if (task?.id) await patientApi.completeTherapyPlanTask(String(task.id));
    } catch { /* silent */ }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [sessions, invites, enrollments] = await Promise.all([
        groupTherapyApi.listPublicSessions(),
        isAuthenticated ? groupTherapyApi.listMyPrivateInvites() : Promise.resolve({ items: [] }),
        isAuthenticated ? groupTherapyApi.listMyEnrollments() : Promise.resolve({ items: [] }),
      ]);
      setPublicSessions(Array.isArray(sessions.items) ? sessions.items : []);
      setPrivateInvites(Array.isArray(invites.items) ? invites.items : []);
      setMyEnrollments(Array.isArray(enrollments.items) ? enrollments.items : []);
      if (isAuthenticated) void tryCompleteGroupTherapyTask();
    } catch {
      setPublicSessions([]);
      setPrivateInvites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const handleJoin = async (sessionId: string) => {
    if (!isAuthenticated) {
      toast('Login or register to join and complete payment.');
      navigate('/auth/login?next=/patient/group-therapy');
      return;
    }
    try {
      const result = await groupTherapyApi.createPublicJoinPaymentIntent(sessionId);
      if (!result.redirectUrl) throw new Error('Payment link not available');
      window.location.href = result.redirectUrl;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to start payment');
    }
  };

  const handleJoinByCode = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    setJoiningCode(true);
    try {
      const session = await groupTherapyApi.verifyJoinCode(code);
      toast.success(`Joining: ${session.title}`);
      const jitsiUrl = session.jitsiRoomName
        ? `https://8x8.vc/vpaas-magic-cookie-dc9db3d3a14f4a24b9a5e20a9d0e7f8b/${session.jitsiRoomName}#config.prejoinPageEnabled=false`
        : session.googleMeetLink || null;
      if (jitsiUrl) {
        window.open(jitsiUrl, '_blank');
      } else {
        toast('Session video link not set. Please contact support.');
      }
      setJoinCodeInput('');
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Invalid or already used code');
    } finally {
      setJoiningCode(false);
    }
  };

  const handleInviteAction = async (inviteId: string, action: 'accept' | 'decline') => {
    try {
      await groupTherapyApi.respondPrivateInvite(inviteId, action);
      toast.success(action === 'accept' ? 'Invite accepted. Complete payment to join.' : 'Invite declined.');
      void load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Action failed');
    }
  };

  const handlePrivatePayment = async (inviteId: string) => {
    try {
      const result = await groupTherapyApi.createPrivateInvitePaymentIntent(inviteId);
      if (!result.redirectUrl) throw new Error('Payment link not available');
      window.location.href = result.redirectUrl;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to start payment');
    }
  };

  const filteredSessions = useMemo(() => {
    return publicSessions
      .map((row) => ({ row, state: computeState(row, nowTs) }))
      .filter(({ row, state }) => {
        if (state === 'EXPIRED') return false; // never show expired sessions to patients
        if (activeFilter === 'all') return true;
        if (activeFilter === 'live') return state === 'LIVE';
        return matchesTopic(row, activeFilter);
      })
      .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]);
  }, [activeFilter, publicSessions, nowTs]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded-lg bg-calm-sage/10" />
          <div className="h-48 rounded-2xl bg-calm-sage/10" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-52 rounded-2xl border border-calm-sage/15 bg-white/50" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 pb-20 md:px-6 lg:pb-6">

      {/* Public landing hero + breadcrumb */}
      {isPublicPath && (
        <>

          {/* Hero banner */}
          <section 
            className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 px-6 py-10 text-center md:py-14"
            style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
          >
            <div className="mx-auto max-w-2xl">
              <div className="mb-3 text-4xl">👥</div>
              <h1 className="text-3xl font-extrabold text-white md:text-4xl">Heal in Community</h1>
              <p className="mt-3 text-base text-white/85 md:text-lg">
                Therapist-led group sessions · Real people, real progress · ₹299 per session
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                  ✓ NMC/RCI verified therapists
                </div>
                <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                  ✓ Anonymous avatar mode
                </div>
                <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                  ✓ 8 topic categories
                </div>
              </div>
              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/auth/login?next=/patient/group-therapy')}
                  className="mt-6 inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-teal-700 shadow-lg transition hover:bg-teal-50"
                >
                  Sign in to Join Sessions →
                </button>
              )}
            </div>
          </section>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { emoji: '🕕', title: 'Live Today', desc: 'Sessions starting within hours' },
              { emoji: '👤', title: 'Avatar Mode', desc: 'Stay anonymous with a handle' },
              { emoji: '💬', title: 'Community Support', desc: 'Peer connection + therapist guidance' },
              { emoji: '📓', title: 'Private Journal', desc: 'Reflect after every session' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-calm-sage/15 bg-white p-4 shadow-soft-sm">
                <div className="text-2xl">{f.emoji}</div>
                <p className="mt-2 text-sm font-bold text-charcoal">{f.title}</p>
                <p className="mt-0.5 text-xs text-charcoal/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dashboard header (inside patient portal) */}
      {!isPublicPath && (
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-charcoal md:text-4xl">Group Therapy</h1>
          <p className="text-sm text-charcoal/70">Therapist-led sessions · heal in community · ₹299 per session</p>
        </header>
      )}

      {/* Private invites */}
      {privateInvites.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-charcoal">Private Invites</h2>
          {privateInvites.map((invite: any) => (
            <div key={invite.id} className="overflow-hidden rounded-2xl border border-teal-200/60 bg-teal-50/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-charcoal">{invite.session?.title || 'Private Session Invite'}</p>
                  <p className="mt-0.5 text-xs text-charcoal/60">
                    From {invite.invitedBy?.firstName} {invite.invitedBy?.lastName} · Status: {invite.status}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-teal-700">Fee: ₹{Math.round(Number(invite.amountMinor || 0) / 100)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {invite.status === 'INVITED' && (
                    <>
                      <button onClick={() => void handleInviteAction(invite.id, 'accept')} className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700">Accept</button>
                      <button onClick={() => void handleInviteAction(invite.id, 'decline')} className="rounded-xl border border-calm-sage/20 bg-white px-3 py-2 text-xs font-semibold text-charcoal/70 transition hover:bg-calm-sage/5">Decline</button>
                    </>
                  )}
                  {(invite.status === 'PAYMENT_PENDING' || invite.status === 'ACCEPTED') && (
                    <button onClick={() => void handlePrivatePayment(invite.id)} className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700">Pay to Join</button>
                  )}
                  {invite.status === 'PAID' && (
                    <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">Payment completed · Join unlocked</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Join by code + my enrollments */}
      {isAuthenticated && (
        <section className="space-y-4">
          {/* Enter join code */}
          <div className="flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
            <KeyRound className="h-5 w-5 text-teal-600 flex-shrink-0" />
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && void handleJoinByCode()}
              placeholder="Enter your join code (e.g. ABC12345)"
              maxLength={8}
              className="flex-1 min-w-0 bg-transparent text-sm font-mono font-bold text-teal-800 placeholder:font-normal placeholder:text-teal-400 outline-none tracking-widest"
            />
            <button
              onClick={() => void handleJoinByCode()}
              disabled={joiningCode || joinCodeInput.trim().length < 4}
              className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {joiningCode ? 'Joining...' : 'Join →'}
            </button>
          </div>

          {/* My enrolled sessions with codes */}
          {myEnrollments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">My Enrolled Sessions</p>
              {myEnrollments.map((e: any) => {
                const isPaid = e.enrollmentStatus === 'PAID' || e.enrollmentStatus === 'JOINED';
                const schedDate = e.scheduledAt
                  ? new Date(e.scheduledAt).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : '—';
                return (
                  <div key={e.enrollmentId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-calm-sage/20 bg-white p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-charcoal truncate">{e.title || 'Group Session'}</p>
                      <p className="text-xs text-charcoal/55 mt-0.5">{schedDate} · {e.hostName}</p>
                    </div>
                    {e.joinCode && isPaid && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1 tracking-widest">
                          {e.joinCodeUsed ? '••••••••' : e.joinCode}
                        </span>
                        {!e.joinCodeUsed && (
                          <button
                            onClick={() => { navigator.clipboard.writeText(e.joinCode); toast.success('Code copied!'); }}
                            className="text-teal-500 hover:text-teal-700 transition"
                            title="Copy code"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {e.joinCodeUsed && <span className="text-[10px] text-green-600 font-semibold">Used ✓</span>}
                      </div>
                    )}
                    {!isPaid && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">Payment pending</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Topic filter tabs — 8 fixed */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeFilter === 'all' ? 'bg-teal-600 text-white' : 'border border-calm-sage/20 bg-white text-charcoal/70 hover:bg-calm-sage/5'}`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('live')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeFilter === 'live' ? 'bg-red-600 text-white' : 'border border-calm-sage/20 bg-white text-charcoal/70 hover:bg-calm-sage/5'}`}
        >
          🔴 Live Now
        </button>
        {FIXED_TOPICS.map((topic) => (
          <button
            key={topic.key}
            onClick={() => setActiveFilter(topic.key)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeFilter === topic.key ? 'bg-teal-600 text-white' : 'border border-calm-sage/20 bg-white text-charcoal/70 hover:bg-calm-sage/5'}`}
          >
            {topic.emoji} {topic.label}
          </button>
        ))}
      </div>

      {/* Session grid */}
      <section>
        {filteredSessions.length === 0 ? (
          <div className="rounded-2xl border border-calm-sage/15 bg-white/50 p-10 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-calm-sage/40" />
            <p className="text-sm font-semibold text-charcoal">No sessions for this filter</p>
            <p className="mt-1 text-xs text-charcoal/60">Try "All" or check back soon for new sessions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSessions.map(({ row, state }) => {
              const topic = String(row?.topic || 'General');
              const title = String(row?.title || 'Group Therapy Session');
              const accent = topicAccent(topic, title);
              const emoji = topicEmoji(topic, title);
              const joined = Number(row?.joinedCount || 0);
              const capacity = Math.max(0, Number(row?.maxMembers || 0));
              const seatsLeft = Math.max(0, capacity - joined);
              const progress = capacity > 0 ? Math.min(100, Math.round((joined / capacity) * 100)) : 0;

              return (
                <article
                  key={row.id}
                  className="overflow-hidden rounded-2xl border border-calm-sage/15 bg-white shadow-soft-sm transition-all hover:border-teal-200 hover:shadow-md"
                >
                  <div className="h-1" style={{ backgroundColor: accent }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl" role="img" aria-label={topic}>{emoji}</span>
                        <div>
                          <p className="font-bold text-charcoal">{title}</p>
                          <p className="mt-0.5 text-xs text-charcoal/55">{topic}</p>
                        </div>
                      </div>
                      <StateBadge state={state} scheduledAt={String(row?.scheduledAt || '')} nowTs={nowTs} />
                    </div>

                    {state === 'NEXT' && (
                      <p className="mt-2 text-xs font-semibold text-amber-600">{buildCountdown(String(row.scheduledAt || ''), nowTs)}</p>
                    )}

                    <p className="mt-3 line-clamp-2 text-sm text-charcoal/70">
                      {row.description || 'Therapist-led group support session. Safe, anonymous, and affordable.'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-charcoal/60">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {row.hostName || 'MANAS360 Expert'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {Number(row.durationMinutes || 60)} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        {row.language || 'English'}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-charcoal/55">
                      {new Date(String(row.scheduledAt || '')).toLocaleString('en-IN', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </p>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-charcoal/50">
                        <span>{joined}/{capacity} joined</span>
                        <span>{seatsLeft} seats left</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-calm-sage/15">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: progress > 80 ? '#ef4444' : accent }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => state !== 'FULL' ? void handleJoin(String(row.id)) : undefined}
                      className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-bold transition ${ctaClass(state)}`}
                    >
                      {ctaLabel(state, Number(row.priceMinor || 29900))}
                    </button>

                    {state === 'LIVE' && (
                      <a
                        href={`https://meet.jit.si/${row.jitsiRoomName || `manas360-group-${row.id}`}#config.prejoinPageEnabled=false`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block w-full rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-center text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                      >
                        Join Session
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {publicSessions.length === 0 && !loading && (
        <section className="rounded-2xl border border-calm-sage/15 bg-white p-8 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-calm-sage/40" />
          <p className="text-sm font-semibold text-charcoal">No group sessions published yet</p>
          <p className="mt-1 text-xs text-charcoal/60">Group therapy sessions will appear here once published. Check back soon.</p>
        </section>
      )}
    </div>
  );
}
