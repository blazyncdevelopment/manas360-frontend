import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Users, Clock3, Globe2, Lock, CalendarDays, UserPlus, Video, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { groupTherapyApi } from '../../api/groupTherapy';

type SessionMode = 'PUBLIC' | 'PRIVATE';
type ComputedState = 'LIVE' | 'NEXT' | 'TODAY' | 'UPCOMING' | 'FULL';

const STATE_ORDER: Record<ComputedState, number> = { LIVE: 0, NEXT: 1, TODAY: 2, UPCOMING: 3, FULL: 4 };

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
  if (nowTs > end) return 'UPCOMING';
  if (start - nowTs < 2 * 60 * 60_000) return 'NEXT';
  const today = new Date(nowTs);
  if (at.getFullYear() === today.getFullYear() && at.getMonth() === today.getMonth() && at.getDate() === today.getDate()) return 'TODAY';
  return 'UPCOMING';
};

type CreateForm = { title: string; topic: string; description: string; sessionMode: SessionMode; scheduledAt: string; durationMinutes: number; maxMembers: number };
type InviteForm = { sessionId: string; patientUserId: string; amountInr: number; message: string; paymentDeadline: string };

const fmt = (v: string) => { if (!v) return '-'; const d = new Date(v); return isNaN(d.getTime()) ? '-' : d.toLocaleString(); };
const pad2 = (n: number) => String(n).padStart(2, '0');
const toLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const INPUT = 'w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30';

export const ProviderPortalPage: React.FC = () => {
  const [nowTs, setNowTs] = useState(Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [patients, setPatients] = useState<Array<{ id: string; name: string; email?: string | null; phone?: string | null }>>([]);
  const [expandedParticipants, setExpandedParticipants] = useState<Record<string, any[] | null>>({});
  const [loadingParticipants, setLoadingParticipants] = useState<string | null>(null);

  const [form, setForm] = useState<CreateForm>({
    title: '', topic: '', description: '', sessionMode: 'PUBLIC',
    scheduledAt: toLocal(new Date(Date.now() + 60 * 60 * 1000)), durationMinutes: 60, maxMembers: 12,
  });
  const [inviteForm, setInviteForm] = useState<InviteForm>({ sessionId: '', patientUserId: '', amountInr: 499, message: '', paymentDeadline: '' });

  const withState = useMemo(() =>
    requests.map((row) => ({ row, state: computeState(row, nowTs) }))
      .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]),
    [requests, nowTs],
  );

  const liveFeed = useMemo(() =>
    withState.filter(({ state }) => ['LIVE', 'NEXT', 'TODAY'].includes(state)).slice(0, 4),
    [withState],
  );

  const pendingCount = useMemo(() => requests.filter((r) => String(r.status || '').toUpperCase() === 'PENDING_APPROVAL').length, [requests]);
  const publishedCount = useMemo(() => requests.filter((r) => ['PUBLISHED', 'LIVE'].includes(String(r.status || '').toUpperCase())).length, [requests]);
  const approvedCount = useMemo(() => requests.filter((r) => String(r.status || '').toUpperCase() === 'APPROVED').length, [requests]);

  const privateInvitableSessions = useMemo(() =>
    requests.filter((r) => String(r.sessionMode || '').toUpperCase() === 'PRIVATE' && ['APPROVED', 'PUBLISHED', 'LIVE'].includes(String(r.status || '').toUpperCase())),
    [requests],
  );

  const loadRequests = async () => {
    setIsRefreshing(true);
    try {
      const result = await groupTherapyApi.listMyRequests();
      setRequests(Array.isArray(result.items) ? result.items : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load sessions.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const result = await groupTherapyApi.listProviderPatients();
      setPatients(Array.isArray(result.items) ? result.items : []);
    } catch { /* silent */ } finally {
      setIsLoadingPatients(false);
    }
  };

  React.useEffect(() => {
    void loadRequests();
    void loadPatients();
  }, []);

  const toggleParticipants = async (sessionId: string) => {
    if (expandedParticipants[sessionId] !== undefined) {
      setExpandedParticipants((prev) => { const next = { ...prev }; delete next[sessionId]; return next; });
      return;
    }
    setLoadingParticipants(sessionId);
    try {
      const result = await groupTherapyApi.getSessionParticipants(sessionId);
      setExpandedParticipants((prev) => ({ ...prev, [sessionId]: result.participants }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load participants.');
    } finally {
      setLoadingParticipants(null);
    }
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.topic.trim()) { toast.error('Fill in session title and topic.'); return; }
    setIsSubmitting(true);
    try {
      await groupTherapyApi.createRequest({
        title: form.title.trim(), topic: form.topic.trim(),
        description: form.description.trim() || undefined, sessionMode: form.sessionMode,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes || 60), maxMembers: Number(form.maxMembers || 10),
      });
      toast.success('Request submitted. Awaiting admin approval.');
      setForm((p) => ({ ...p, title: '', topic: '', description: '', scheduledAt: toLocal(new Date(Date.now() + 60 * 60 * 1000)) }));
      await loadRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPrivateInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteForm.sessionId || !inviteForm.patientUserId) { toast.error('Select session and patient.'); return; }
    const amountInr = Number(inviteForm.amountInr || 0);
    if (!Number.isFinite(amountInr) || amountInr <= 0) { toast.error('Fee must be > 0.'); return; }
    setIsInviting(true);
    try {
      await groupTherapyApi.createPrivateInvite({
        sessionId: inviteForm.sessionId, patientUserId: inviteForm.patientUserId,
        amountMinor: Math.round(amountInr * 100),
        message: inviteForm.message.trim() || undefined,
        paymentDeadline: inviteForm.paymentDeadline ? new Date(inviteForm.paymentDeadline).toISOString() : undefined,
      });
      toast.success('Invite sent. Patient can accept and pay.');
      setInviteForm((p) => ({ ...p, patientUserId: '', message: '', paymentDeadline: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to send invite.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Group Therapy Workspace | MANAS360</title></Helmet>

      {/* Header */}
      <section className="rounded-2xl border border-calm-sage/15 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-charcoal">Group Therapy Workspace</h1>
            <p className="mt-1 text-sm text-charcoal/60">Create sessions, join your live rooms, view participant history.</p>
          </div>
          <button type="button" onClick={() => void loadRequests()} disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-calm-sage/20 bg-white px-4 py-2 text-sm font-semibold text-charcoal/70 hover:bg-calm-sage/5 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </section>

      {/* Live Feed — dark navy */}
      {liveFeed.length > 0 && (
        <section className="overflow-hidden rounded-2xl bg-[#0d1b2a]">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              <span className="text-sm font-bold text-white/90">Your Live &amp; Upcoming Sessions</span>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/70">{liveFeed.length} sessions</span>
          </div>
          <div className="grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2 xl:grid-cols-4">
            {liveFeed.map(({ row, state }) => {
              const isLive = state === 'LIVE';
              const joined = Number(row?.joinedCount || 0);
              const capacity = Number(row?.maxMembers || 0);
              return (
                <div key={row.id} className="flex flex-col gap-3 rounded-2xl bg-white/8 border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white leading-snug">{row.title}</p>
                    {isLive ? (
                      <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />LIVE
                      </span>
                    ) : state === 'NEXT' ? (
                      <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">NEXT</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">TODAY</span>
                    )}
                  </div>
                  <p className="text-xs text-white/60">{row.topic} · {Number(row.durationMinutes || 60)} min</p>
                  <p className="text-xs text-white/50">{fmt(row.scheduledAt)}</p>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{joined}/{capacity} joined</span>
                    <span>₹{Math.round(Number(row.priceMinor || 0) / 100)}/seat</span>
                  </div>
                  {row.jitsiRoomName ? (
                    <a
                      href={`https://meet.jit.si/${row.jitsiRoomName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-2 text-xs font-bold text-white transition hover:bg-teal-700"
                    >
                      <Video className="h-3.5 w-3.5" />
                      {isLive ? 'Join Now' : 'Open Room'}
                    </a>
                  ) : (
                    <p className="text-center text-[10px] text-white/30">Jitsi room pending admin setup</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Pending Approval</p>
          <p className="mt-1 text-3xl font-black text-amber-900">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Approved</p>
          <p className="mt-1 text-3xl font-black text-blue-900">{approvedCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Published / Live</p>
          <p className="mt-1 text-3xl font-black text-emerald-900">{publishedCount}</p>
        </div>
      </section>

      {/* Create form */}
      <section className="rounded-2xl border border-calm-sage/15 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-bold text-charcoal">Create Group Therapy Request</h2>
        </div>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submitRequest}>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-charcoal">Session Title</span>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g., Anxiety Stabilization Circle" className={INPUT} required />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-charcoal">Clinical Focus Area</span>
            <input value={form.topic} onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))} placeholder="e.g., Anxiety Disorders, Grief, Burnout" className={INPUT} required />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-charcoal">Description</span>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Therapeutic objective and session structure" className={INPUT} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-charcoal">Mode</span>
            <select value={form.sessionMode} onChange={(e) => setForm((p) => ({ ...p, sessionMode: e.target.value as SessionMode }))} className={INPUT}>
              <option value="PUBLIC">Public Group</option>
              <option value="PRIVATE">Private Cohort</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-charcoal">Start Date &amp; Time</span>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))} className={INPUT} required />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-charcoal">Duration (mins)</span>
            <input type="number" min={15} max={180} value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))} className={INPUT} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-charcoal">Max Participants</span>
            <input type="number" min={2} max={100} value={form.maxMembers} onChange={(e) => setForm((p) => ({ ...p, maxMembers: Number(e.target.value) }))} className={INPUT} />
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60">
              <Plus className="h-4 w-4" />{isSubmitting ? 'Submitting...' : 'Submit For Admin Approval'}
            </button>
          </div>
        </form>
      </section>

      {/* Private invite form */}
      <section className="rounded-2xl border border-calm-sage/15 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-bold text-charcoal">Invite Patients to Private Session</h2>
          </div>
          <button type="button" onClick={() => void loadPatients()} disabled={isLoadingPatients}
            className="rounded-lg border border-calm-sage/20 px-3 py-1.5 text-xs font-semibold text-charcoal/70 hover:bg-calm-sage/5 disabled:opacity-60">
            {isLoadingPatients ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {privateInvitableSessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-calm-sage/20 bg-calm-sage/5 p-4 text-sm text-charcoal/60">
            No approved private sessions available. Create a PRIVATE session and wait for admin approval.
          </p>
        ) : patients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-calm-sage/20 bg-calm-sage/5 p-4 text-sm text-charcoal/60">
            No patients found. Complete at least one session with a patient to invite them.
          </p>
        ) : (
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submitPrivateInvite}>
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-charcoal">Private Session</span>
              <select value={inviteForm.sessionId} onChange={(e) => setInviteForm((p) => ({ ...p, sessionId: e.target.value }))} className={INPUT} required>
                <option value="">Select private session</option>
                {privateInvitableSessions.map((s) => <option key={s.id} value={s.id}>{s.title} ({String(s.status || '').toUpperCase()})</option>)}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-charcoal">Patient</span>
              <select value={inviteForm.patientUserId} onChange={(e) => setInviteForm((p) => ({ ...p, patientUserId: e.target.value }))} className={INPUT} required>
                <option value="">Select patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}{p.phone ? ` (${p.phone})` : p.email ? ` (${p.email})` : ''}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-sm font-semibold text-charcoal">Invite Fee (INR)</span>
              <input type="number" min={1} value={inviteForm.amountInr} onChange={(e) => setInviteForm((p) => ({ ...p, amountInr: Number(e.target.value) }))} className={INPUT} required />
            </label>
            <label>
              <span className="mb-1 block text-sm font-semibold text-charcoal">Payment Deadline (optional)</span>
              <input type="datetime-local" value={inviteForm.paymentDeadline} onChange={(e) => setInviteForm((p) => ({ ...p, paymentDeadline: e.target.value }))} className={INPUT} />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-charcoal">Message (optional)</span>
              <textarea rows={3} value={inviteForm.message} onChange={(e) => setInviteForm((p) => ({ ...p, message: e.target.value }))} placeholder="Personalized invite note for patient" className={INPUT} />
            </label>
            <div className="md:col-span-2">
              <button type="submit" disabled={isInviting} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60">
                <UserPlus className="h-4 w-4" />{isInviting ? 'Sending...' : 'Send Private Invite'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Sessions table with participant history */}
      <section className="rounded-2xl border border-calm-sage/15 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-charcoal">My Sessions</h2>
        {requests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-calm-sage/20 bg-calm-sage/5 p-8 text-center text-sm text-charcoal/60">
            No sessions yet. Create your first group therapy request above.
          </p>
        ) : (
          <div className="space-y-3">
            {withState.map(({ row, state }) => {
              const status = String(row.status || '').toUpperCase();
              const mode = String(row.sessionMode || '').toUpperCase();
              const joined = Number(row.joinedCount || 0);
              const capacity = Number(row.maxMembers || 0);
              const hasRoom = Boolean(row.jitsiRoomName);
              const isExpanded = expandedParticipants[row.id] !== undefined;
              const ptList = expandedParticipants[row.id];
              const isLoadingPt = loadingParticipants === row.id;

              return (
                <div key={row.id} className="overflow-hidden rounded-2xl border border-calm-sage/15">
                  <div className="flex flex-wrap items-start gap-3 bg-white p-4">
                    {/* Status badge */}
                    <div className="w-full sm:w-auto">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        state === 'LIVE' ? 'bg-red-100 text-red-700' :
                        state === 'NEXT' ? 'bg-amber-100 text-amber-700' :
                        state === 'TODAY' ? 'bg-emerald-100 text-emerald-700' :
                        status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700' :
                        status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        status === 'PUBLISHED' ? 'bg-teal-100 text-teal-700' :
                        status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {state === 'LIVE' ? '● LIVE' : state === 'NEXT' ? '⏰ NEXT' : state === 'TODAY' ? '📅 TODAY' : status}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-charcoal">{row.title}</p>
                      <p className="text-xs text-charcoal/55">{row.topic} · {Number(row.durationMinutes || 60)} min</p>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-charcoal/50">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{fmt(row.scheduledAt)}</span>
                        <span className="flex items-center gap-1">{mode === 'PRIVATE' ? <Lock className="h-3 w-3" /> : <Globe2 className="h-3 w-3" />}{mode}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{joined}/{capacity} joined</span>
                        {row.priceMinor > 0 && <span>₹{Math.round(Number(row.priceMinor) / 100)}/seat</span>}
                      </div>
                      {row.rejectionReason && <p className="mt-1.5 text-xs text-rose-600">Rejected: {row.rejectionReason}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {hasRoom && (
                        <a href={`https://meet.jit.si/${row.jitsiRoomName}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-teal-700">
                          <Video className="h-3.5 w-3.5" />
                          {state === 'LIVE' ? 'Join Now' : 'Open Room'}
                        </a>
                      )}
                      <button type="button" onClick={() => void toggleParticipants(row.id)} disabled={isLoadingPt}
                        className="flex items-center gap-1.5 rounded-xl border border-calm-sage/20 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal/70 hover:bg-calm-sage/5 disabled:opacity-50">
                        <Users className="h-3.5 w-3.5" />
                        {isLoadingPt ? '...' : `Participants (${joined})`}
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Participant panel */}
                  {isExpanded && (
                    <div className="border-t border-calm-sage/10 bg-calm-sage/5 px-4 py-4">
                      {!ptList || ptList.length === 0 ? (
                        <p className="text-sm text-charcoal/50">No participants yet.</p>
                      ) : (
                        <>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-charcoal/40">
                            {ptList.length} participant{ptList.length !== 1 ? 's' : ''}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {ptList.map((p: any) => (
                              <div key={p.id} className="flex items-start gap-3 rounded-xl border border-calm-sage/15 bg-white p-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                                  {String(p.name || '?').slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-charcoal truncate">{p.name || 'Anonymous'}</p>
                                  {p.email && <p className="text-xs text-charcoal/50 truncate">{p.email}</p>}
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {p.status}
                                    </span>
                                    {p.amountPaid > 0 && (
                                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                                        ₹{Math.round(Number(p.amountPaid) / 100)}
                                      </span>
                                    )}
                                    {p.isGuest && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Guest</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="mt-3 text-xs text-charcoal/40">
                            Total collected: ₹{ptList.reduce((acc: number, p: any) => acc + Math.round(Number(p.amountPaid || 0) / 100), 0).toLocaleString('en-IN')}
                            · Your 60%: ₹{Math.round(ptList.reduce((acc: number, p: any) => acc + Math.round(Number(p.amountPaid || 0) / 100), 0) * 0.6).toLocaleString('en-IN')}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProviderPortalPage;
