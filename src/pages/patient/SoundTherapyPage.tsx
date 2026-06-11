import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { patientApi } from '../../api/patient';
import { Music, Lock, Play, Pause, X, Clock, Headphones } from 'lucide-react';

interface VimeoMeta {
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  video_id: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  freq: string;
  duration: number;
  thumbnail: string;
  video_id: string;
  vimeo_url: string;
}

type Genre = 'all' | 'healing_frequency' | 'indian_classical' | 'nature' | 'sleep';

const SEED: { vimeo_url: string; genre: string; freq: string }[] = [
  { vimeo_url: 'https://vimeo.com/427943407', genre: 'healing_frequency', freq: '432 Hz' },
  { vimeo_url: 'https://vimeo.com/332498613', genre: 'healing_frequency', freq: '528 Hz' },
  { vimeo_url: 'https://vimeo.com/379438489', genre: 'indian_classical', freq: '—' },
  { vimeo_url: 'https://vimeo.com/248907396', genre: 'indian_classical', freq: '—' },
  { vimeo_url: 'https://vimeo.com/291448067', genre: 'nature', freq: '—' },
  { vimeo_url: 'https://vimeo.com/372854506', genre: 'nature', freq: '—' },
  { vimeo_url: 'https://vimeo.com/316710765', genre: 'sleep', freq: 'Delta' },
  { vimeo_url: 'https://vimeo.com/345146956', genre: 'sleep', freq: '—' },
];

const GENRE_ICONS: Record<string, string> = {
  healing_frequency: '🎵',
  indian_classical: '🪕',
  nature: '🌿',
  sleep: '🌙',
};

const GENRE_LABEL: Record<string, string> = {
  healing_frequency: 'Frequency',
  indian_classical: 'Raga',
  nature: 'Nature',
  sleep: 'Sleep',
};

const GENRE_COLORS: Record<string, string> = {
  healing_frequency: 'bg-teal-50 text-teal-700 border-teal-200',
  indian_classical: 'bg-amber-50 text-amber-700 border-amber-200',
  nature: 'bg-green-50 text-green-700 border-green-200',
  sleep: 'bg-violet-50 text-violet-700 border-violet-200',
};

const MAX_PREVIEW = 180;
const TASK_COMPLETE_THRESHOLD = 60;

function fmtD(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

async function fetchVimeoMeta(url: string): Promise<VimeoMeta | null> {
  try {
    const r = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
    if (!r.ok) return null;
    const d = await r.json();
    const m = url.match(/vimeo\.com\/(\d+)/);
    return {
      title: d.title || 'Untitled',
      artist: d.author_name || 'MANAS360',
      duration: d.duration || 0,
      thumbnail: d.thumbnail_url || '',
      video_id: m ? m[1] : '',
    };
  } catch {
    return null;
  }
}

export default function SoundTherapyPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentFilter, setCurrentFilter] = useState<Genre>('all');
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [previewSeconds, setPreviewSeconds] = useState(0);
  const [hasActivePlan, setHasActivePlan] = useState<boolean | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [taskCompletedIds, setTaskCompletedIds] = useState<Set<string>>(new Set());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const taskCheckedRef = useRef(false);

  /* Auth guard */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  /* Check subscription */
  useEffect(() => {
    if (!isAuthenticated) return;
    setPlanLoading(true);
    patientApi.getSubscription()
      .then((sub: any) => {
        const status = String(sub?.status || sub?.planStatus || '').toUpperCase();
        setHasActivePlan(status === 'ACTIVE' || status === 'TRIALING');
      })
      .catch(() => setHasActivePlan(false))
      .finally(() => setPlanLoading(false));
  }, [isAuthenticated]);

  /* Load tracks */
  useEffect(() => {
    if (!hasActivePlan) return;
    let cancelled = false;
    async function loadTracks() {
      for (let i = 0; i < SEED.length; i++) {
        const s = SEED[i];
        const meta = await fetchVimeoMeta(s.vimeo_url);
        if (!meta || cancelled) continue;
        setTracks((prev) => {
          if (prev.some((t) => t.id === `trk-${i}`)) return prev;
          return [
            ...prev,
            {
              id: `trk-${i}`,
              title: meta.title,
              artist: meta.artist,
              genre: s.genre,
              freq: s.freq,
              duration: meta.duration,
              thumbnail: meta.thumbnail,
              video_id: meta.video_id,
              vimeo_url: s.vimeo_url,
            },
          ];
        });
      }
    }
    loadTracks();
    return () => { cancelled = true; };
  }, [hasActivePlan]);

  /* Auto-complete therapy task after threshold listening */
  const tryCompleteTask = useCallback(async () => {
    if (taskCheckedRef.current) return;
    taskCheckedRef.current = true;
    try {
      const plan = await patientApi.getTherapyPlan().catch(() => null);
      const payload = (plan as any)?.data ?? plan ?? {};
      const tasks: any[] = Array.isArray(payload?.dailyTasks) ? payload.dailyTasks : [];
      const soundTask = tasks.find((t: any) => {
        const type = String(t?.type || t?.activityType || '').toUpperCase();
        const title = String(t?.title || '').toUpperCase();
        const isSound = type.includes('SOUND') || title.includes('SOUND') || title.includes('MUSIC');
        const isPending = !String(t?.completed ?? t?.status ?? '').toUpperCase().includes('COMPLETE');
        return isSound && isPending;
      });
      if (soundTask?.id) {
        await patientApi.completeTherapyPlanTask(String(soundTask.id));
        setTaskCompletedIds((prev) => new Set(prev).add(String(soundTask.id)));
      }
    } catch {
      /* silently ignore */
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopTrack = useCallback(() => {
    clearTimer();
    setCurrentTrackId(null);
    setPreviewSeconds(0);
    taskCheckedRef.current = false;
  }, [clearTimer]);

  const playTrack = useCallback(
    (id: string) => {
      stopTrack();
      taskCheckedRef.current = false;
      setCurrentTrackId(id);
      setPreviewSeconds(0);

      timerRef.current = setInterval(() => {
        setPreviewSeconds((prev) => {
          const next = prev + 1;
          if (next === TASK_COMPLETE_THRESHOLD) {
            void tryCompleteTask();
          }
          if (next >= MAX_PREVIEW) {
            clearTimer();
            setCurrentTrackId(null);
            return 0;
          }
          return next;
        });
      }, 1000);
    },
    [stopTrack, clearTimer, tryCompleteTask],
  );

  const toggleTrack = useCallback(
    (id: string) => {
      currentTrackId === id ? stopTrack() : playTrack(id);
    },
    [currentTrackId, stopTrack, playTrack],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  const currentTrack = tracks.find((t) => t.id === currentTrackId) ?? null;
  const filteredTracks = currentFilter === 'all' ? tracks : tracks.filter((t) => t.genre === currentFilter);

  if (authLoading || planLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded-lg bg-calm-sage/10" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-2xl border border-calm-sage/15 bg-white/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  /* Permission gate */
  if (hasActivePlan === false) {
    return (
      <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 md:px-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-charcoal md:text-4xl">Sound Therapy</h1>
          <p className="text-sm text-charcoal/70">Healing frequencies, ragas, and soundscapes for mental wellness.</p>
        </header>

        <section className="rounded-3xl border border-calm-sage/15 bg-white p-10 text-center shadow-soft-sm">
          <div className="mx-auto max-w-md space-y-5">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                <Lock className="h-8 w-8 text-teal-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-charcoal">Plan Required</h3>
            <p className="text-sm text-charcoal/70">
              Sound Therapy is available to patients with an active plan. Get a plan to access healing frequencies,
              Indian classical ragas, nature soundscapes, and sleep audio.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/plans"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
              >
                View Plans
              </Link>
              <Link
                to="/patient/sessions"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-calm-sage/20 bg-white px-6 py-3 text-sm font-semibold text-charcoal/70 transition hover:bg-calm-sage/5"
              >
                Back to My Care
              </Link>
            </div>
          </div>
        </section>

        {/* Preview of what's inside */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-charcoal">What's inside Sound Therapy</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(GENRE_LABEL).map(([genre, label]) => (
              <div key={genre} className="flex items-center gap-3 rounded-2xl border border-calm-sage/15 bg-white p-4 shadow-soft-sm opacity-60">
                <span className="text-2xl">{GENRE_ICONS[genre]}</span>
                <div>
                  <p className="font-semibold text-charcoal">{label}</p>
                  <p className="text-xs text-charcoal/50">Locked</p>
                </div>
                <Lock className="ml-auto h-4 w-4 text-charcoal/30" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 pb-20 md:px-6 lg:pb-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-charcoal md:text-4xl">Sound Therapy</h1>
        <p className="text-sm text-charcoal/70">Healing frequencies, ragas, and soundscapes for mental wellness.</p>
      </header>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-2xl border border-calm-sage/15 bg-white px-5 py-3 shadow-soft-sm">
          <p className="text-2xl font-bold text-charcoal">{tracks.length || SEED.length}</p>
          <p className="text-xs text-charcoal/60">Tracks</p>
        </div>
        <div className="rounded-2xl border border-calm-sage/15 bg-white px-5 py-3 shadow-soft-sm">
          <p className="text-2xl font-bold text-teal-600">4</p>
          <p className="text-xs text-charcoal/60">Genres</p>
        </div>
        <div className="rounded-2xl border border-calm-sage/15 bg-white px-5 py-3 shadow-soft-sm">
          <p className="text-2xl font-bold text-charcoal">3 min</p>
          <p className="text-xs text-charcoal/60">Preview</p>
        </div>
        <div className="rounded-2xl border border-calm-sage/15 bg-white px-5 py-3 shadow-soft-sm">
          <p className="text-2xl font-bold text-charcoal">24/7</p>
          <p className="text-xs text-charcoal/60">Access</p>
        </div>
      </div>

      {/* Neuroscience pills */}
      <div className="flex flex-wrap gap-2">
        {['🧬 Dopamine', '🧬 Serotonin', '🧬 Oxytocin', '🧬 Cortisol ↓'].map((pill) => (
          <span key={pill} className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
            {pill}
          </span>
        ))}
      </div>

      {/* Task completed banner */}
      {taskCompletedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
          <Headphones className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-800">
            Sound therapy task marked complete! Great progress on your wellness journey.
          </p>
        </div>
      )}

      {/* Now playing bar */}
      {currentTrack && (
        <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
          <div className="flex items-end gap-0.5 h-5 shrink-0">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 rounded-sm bg-teal-600"
                style={{
                  height: `${40 + i * 20}%`,
                  animation: `pulse ${0.6 + i * 0.15}s ease infinite alternate`,
                }}
              />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-teal-900">{currentTrack.title}</p>
            <p className="text-xs text-teal-700/70">
              {GENRE_LABEL[currentTrack.genre] ?? ''} · Preview · 3:00 max
            </p>
          </div>
          <span className="text-sm font-bold text-teal-700 shrink-0">{fmtD(previewSeconds)}</span>
          <button
            onClick={stopTrack}
            className="shrink-0 rounded-lg p-1.5 text-teal-600 hover:bg-teal-100"
            aria-label="Stop"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Vimeo player */}
      {currentTrack && (
        <div className="overflow-hidden rounded-2xl border border-calm-sage/15 bg-black shadow-soft-sm" style={{ aspectRatio: '16/9', maxHeight: 300 }}>
          <iframe
            src={`https://player.vimeo.com/video/${currentTrack.video_id}?autoplay=1&byline=0&title=0&portrait=0`}
            allow="autoplay; fullscreen"
            allowFullScreen
            title={currentTrack.title}
            className="h-full w-full border-0"
          />
        </div>
      )}

      {/* Genre filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCurrentFilter('all')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${currentFilter === 'all' ? 'bg-teal-600 text-white' : 'border border-calm-sage/20 bg-white text-charcoal/70 hover:bg-calm-sage/5'}`}
        >
          All
        </button>
        {Object.entries(GENRE_LABEL).map(([genre, label]) => (
          <button
            key={genre}
            onClick={() => setCurrentFilter(genre as Genre)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${currentFilter === genre ? 'bg-teal-600 text-white' : 'border border-calm-sage/20 bg-white text-charcoal/70 hover:bg-calm-sage/5'}`}
          >
            {GENRE_ICONS[genre]} {label}
          </button>
        ))}
      </div>

      {/* Track list */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Music className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-bold text-charcoal">Library ({filteredTracks.length})</h2>
        </div>

        {filteredTracks.length === 0 && tracks.length === 0 ? (
          <div className="rounded-2xl border border-calm-sage/15 bg-white/50 p-8 text-center">
            <p className="text-sm text-charcoal/60">Loading tracks from library…</p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="rounded-2xl border border-calm-sage/15 bg-white/50 p-8 text-center">
            <p className="text-sm text-charcoal/60">No tracks in this category yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-calm-sage/15 bg-white shadow-soft-sm">
            <div className="divide-y divide-calm-sage/10">
              {filteredTracks.map((t, i) => {
                const playing = currentTrackId === t.id;
                const genreColor = GENRE_COLORS[t.genre] ?? 'bg-teal-50 text-teal-700 border-teal-200';

                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-4 p-4 transition-colors ${playing ? 'bg-teal-50/50' : 'hover:bg-calm-sage/5'}`}
                  >
                    <span className="w-6 text-center text-xs text-charcoal/40 shrink-0">{i + 1}</span>

                    <div
                      className="h-12 w-12 shrink-0 rounded-xl bg-calm-sage/10 overflow-hidden flex items-center justify-center text-xl"
                      style={t.thumbnail ? { backgroundImage: `url(${t.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                    >
                      {!t.thumbnail && (GENRE_ICONS[t.genre] ?? '🎵')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-charcoal">{t.title}</p>
                      <p className="mt-0.5 text-xs text-charcoal/55">{t.artist}</p>
                      <p className="text-[10px] text-charcoal/40">3 min free preview</p>
                    </div>

                    <span className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:inline-block ${genreColor}`}>
                      {GENRE_LABEL[t.genre] ?? t.genre}
                    </span>

                    {t.freq !== '—' && (
                      <span className="hidden text-xs font-semibold text-teal-600 sm:block">{t.freq}</span>
                    )}

                    <span className="hidden items-center gap-1 text-xs text-charcoal/50 sm:flex">
                      <Clock className="h-3 w-3" />
                      {fmtD(t.duration)}
                    </span>

                    <button
                      onClick={() => toggleTrack(t.id)}
                      aria-label={playing ? `Pause ${t.title}` : `Play ${t.title}`}
                      className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition ${
                        playing
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
                      }`}
                    >
                      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
