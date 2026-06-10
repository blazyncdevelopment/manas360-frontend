<<<<<<< HEAD
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ─── Types ─────────────────────────────────────────────────── */
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

/* ─── Seed data (replace with Supabase fetch in production) ──── */
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

const GENRE_CLASS: Record<string, string> = {
  healing_frequency: 'freq',
  indian_classical: 'raga',
  nature: 'nature',
  sleep: 'sleep',
};

const GENRE_LABEL: Record<string, string> = {
  healing_frequency: 'Frequency',
  indian_classical: 'Raga',
  nature: 'Nature',
  sleep: 'Sleep',
};

const MAX_PREVIEW = 180; // 3 minutes

/* ─── Helpers ───────────────────────────────────────────────── */
function fmtD(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

async function fetchVimeoMeta(url: string): Promise<VimeoMeta | null> {
  try {
    const r = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
    );
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

/* ─── Component ─────────────────────────────────────────────── */
export default function SoundTherapyPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentFilter, setCurrentFilter] = useState<Genre>('all');
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [previewSeconds, setPreviewSeconds] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Guard: redirect unauthenticated users */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  /* Load tracks progressively via Vimeo oEmbed */
  useEffect(() => {
    let cancelled = false;

    async function loadTracks() {
      for (let i = 0; i < SEED.length; i++) {
        const s = SEED[i];
        const meta = await fetchVimeoMeta(s.vimeo_url);
        if (!meta || cancelled) continue;
        setTracks((prev) => {
          // avoid duplicates on StrictMode double-invoke
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
    return () => {
      cancelled = true;
    };
  }, []);

  /* Timer cleanup */
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
  }, [clearTimer]);

  const playTrack = useCallback(
    (id: string) => {
      stopTrack();
      setCurrentTrackId(id);
      setPreviewSeconds(0);

      timerRef.current = setInterval(() => {
        setPreviewSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_PREVIEW) {
            clearTimer();
            setCurrentTrackId(null);
            alert(
              `⏱ 3-minute preview ended.\n\nSubscribe to MANAS360 (₹99/month) for full-length access.`,
            );
            return 0;
          }
          return next;
        });
      }, 1000);
    },
    [stopTrack, clearTimer],
  );

  const toggleTrack = useCallback(
    (id: string) => {
      currentTrackId === id ? stopTrack() : playTrack(id);
    },
    [currentTrackId, stopTrack, playTrack],
  );

  /* Cleanup on unmount */
  useEffect(() => () => clearTimer(), [clearTimer]);

  const currentTrack = tracks.find((t) => t.id === currentTrackId) ?? null;

  const filteredTracks =
    currentFilter === 'all' ? tracks : tracks.filter((t) => t.genre === currentFilter);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#666' }}>
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <style>{`
        /* ── Reset scoped to this page ── */
        .stp-root *{box-sizing:border-box}
        .stp-root{font-family:'DM Sans',sans-serif;background:#0F1724;color:#E8EDF2;-webkit-font-smoothing:antialiased;min-height:100vh}

        /* Hero */
        .stp-hero{background:linear-gradient(160deg,#001A4D 0%,#0A2A4A 40%,#0C3D3F 70%,#0F1724 100%);padding:48px 20px 36px;text-align:center;position:relative;overflow:hidden}
        .stp-hero-eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#0CBFAD;margin-bottom:10px}
        .stp-hero h1{font-family:'Outfit',sans-serif;font-size:clamp(24px,4.5vw,38px);font-weight:800;line-height:1.12;margin-bottom:10px}
        .stp-hero h1 span{color:#B8D44F}
        .stp-hero-sub{font-size:14px;color:rgba(255,255,255,.5);max-width:520px;margin:0 auto 20px;line-height:1.5}
        .stp-stats{display:flex;gap:24px;justify-content:center;flex-wrap:wrap}
        .stp-stat .num{font-family:'Outfit',sans-serif;font-size:20px;font-weight:800;color:#B8D44F}
        .stp-stat .lbl{font-size:10px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.6px}
        .stp-neuro-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:16px auto 0;max-width:500px}
        .stp-npill{padding:5px 12px;border-radius:20px;font-size:10px;font-weight:600;display:flex;align-items:center;gap:4px}
        .stp-npill.dopamine{background:rgba(251,191,36,.08);color:#FBBF24;border:1px solid rgba(251,191,36,.15)}
        .stp-npill.serotonin{background:rgba(52,211,153,.08);color:#34D399;border:1px solid rgba(52,211,153,.15)}
        .stp-npill.oxytocin{background:rgba(244,63,94,.08);color:#F43F5E;border:1px solid rgba(244,63,94,.15)}
        .stp-npill.cortisol{background:rgba(59,130,246,.08);color:#60A5FA;border:1px solid rgba(59,130,246,.15)}

        /* Filter bar */
        .stp-filter-bar{display:flex;gap:6px;padding:12px 16px;overflow-x:auto;scrollbar-width:none;background:#0F1724;border-bottom:1px solid #1A2538;position:sticky;top:0;z-index:90}
        .stp-filter-bar::-webkit-scrollbar{display:none}
        .stp-chip{padding:7px 14px;border-radius:20px;border:1px solid #2A3548;font-size:11px;font-weight:600;cursor:pointer;background:transparent;color:#8899AA;white-space:nowrap;transition:all .2s;flex-shrink:0;font-family:inherit}
        .stp-chip:hover{border-color:#0C7C8A;color:#E8EDF2}
        .stp-chip.active{background:#002365;color:#fff;border-color:#002365}

        /* Now playing */
        .stp-np{margin:14px 16px 0;padding:12px 16px;background:linear-gradient(135deg,rgba(12,124,138,.1),rgba(12,124,138,.03));border:1px solid rgba(12,124,138,.2);border-radius:12px;display:flex;align-items:center;gap:12px}
        .stp-np-bars{display:flex;gap:2px;align-items:flex-end;height:18px}
        .stp-np-bar{width:3px;background:#0CBFAD;border-radius:2px;animation:stpEq .6s ease infinite alternate}
        .stp-np-bar:nth-child(2){animation-delay:.15s}.stp-np-bar:nth-child(3){animation-delay:.3s}.stp-np-bar:nth-child(4){animation-delay:.45s}
        @keyframes stpEq{0%{height:4px}100%{height:18px}}
        .stp-np-info{flex:1;min-width:0}
        .stp-np-title{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .stp-np-meta{font-size:10px;color:#666680}
        .stp-np-timer{font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#0CBFAD;flex-shrink:0}
        .stp-np-close{background:none;border:none;color:#666680;font-size:16px;cursor:pointer;padding:4px;flex-shrink:0}
        .stp-np-close:hover{color:#E8EDF2}

        /* Vimeo player */
        .stp-vimeo{margin:10px 16px 0;border-radius:12px;overflow:hidden;background:#000;aspect-ratio:16/9;max-height:280px}
        .stp-vimeo iframe{width:100%;height:100%;border:none}

        /* Library */
        .stp-library{padding:16px}
        .stp-lib-label{font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#4A90D9;margin-bottom:10px;display:flex;align-items:center;gap:8px}
        .stp-lib-label::after{content:'';flex:1;height:1px;background:#1A2538}
        .stp-table{width:100%;border-collapse:collapse}
        .stp-table th{text-align:left;padding:8px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#4A5568;border-bottom:1px solid #2A3548}
        .stp-table td{padding:10px;border-bottom:1px solid #1A2538;vertical-align:middle}
        .stp-table tr{transition:background .15s}
        .stp-table tr:hover td{background:rgba(12,124,138,.04)}
        .stp-num{font-size:11px;color:#4A5568;width:32px}
        .stp-track-info{display:flex;align-items:center;gap:10px}
        .stp-thumb{width:40px;height:40px;border-radius:8px;background:#1A2538;background-size:cover;background-position:center;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px}
        .stp-track-title{font-size:13px;font-weight:600}
        .stp-track-artist{font-size:10px;color:#666680}
        .stp-preview-note{font-size:9px;color:#4A5568;margin-top:2px}
        .stp-genre-tag{display:inline-block;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
        .stp-genre-tag.freq{background:rgba(12,124,138,.1);color:#0CBFAD}
        .stp-genre-tag.raga{background:rgba(212,160,23,.1);color:#D4A017}
        .stp-genre-tag.nature{background:rgba(52,211,153,.1);color:#34D399}
        .stp-genre-tag.sleep{background:rgba(124,58,237,.1);color:#A855F7}
        .stp-freq{font-size:11px;color:#0CBFAD;font-weight:600}
        .stp-dur{font-size:12px;color:#666680;white-space:nowrap}
        .stp-free-badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;background:rgba(52,211,153,.1);color:#34D399;margin-left:6px;vertical-align:middle}
        .stp-play-btn{width:34px;height:34px;border-radius:50%;border:none;background:rgba(12,124,138,.12);color:#0CBFAD;font-size:14px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
        .stp-play-btn:hover{background:#0C7C8A;color:#fff;transform:scale(1.1)}
        .stp-play-btn.playing{background:#0C7C8A;color:#fff;animation:stpPulse 1.5s infinite}
        @keyframes stpPulse{0%,100%{box-shadow:0 0 0 0 rgba(12,124,138,.3)}50%{box-shadow:0 0 0 8px rgba(12,124,138,0)}}
        .stp-empty{text-align:center;padding:40px 20px;color:#4A5568;font-size:13px}
        .stp-loading{text-align:center;padding:30px;color:#4A5568;font-size:12px}

        /* Footer */
        .stp-footer{padding:20px;text-align:center;border-top:1px solid #1A2538;margin-top:16px}
        .stp-footer p{font-size:11px;color:#4A5568;line-height:1.5;max-width:480px;margin:0 auto}
        .stp-footer a{color:#0CBFAD;text-decoration:none}

        @media(max-width:640px){
          .stp-hero h1{font-size:22px}
          .stp-table th:nth-child(1),.stp-table td:nth-child(1){display:none}
          .stp-table th:nth-child(4),.stp-table td:nth-child(4){display:none}
        }
      `}</style>

      <div className="stp-root">
        {/* ── Hero ── */}
        <div className="stp-hero">
          <div className="stp-hero-eyebrow">Heal Through Sound</div>
          <h1>Sound <span>Therapy</span></h1>
          <p className="stp-hero-sub">
            Healing frequencies, Indian classical ragas, nature soundscapes, and sleep audio —
            curated for mental wellness. Free 3-minute preview on every track.
          </p>
          <div className="stp-stats">
            <div className="stp-stat"><div className="num">{tracks.length}</div><div className="lbl">Tracks</div></div>
            <div className="stp-stat"><div className="num">4</div><div className="lbl">Genres</div></div>
            <div className="stp-stat"><div className="num">3 min</div><div className="lbl">Free Preview</div></div>
            <div className="stp-stat"><div className="num">24/7</div><div className="lbl">Access</div></div>
          </div>
          <div className="stp-neuro-row">
            <div className="stp-npill dopamine">🧬 Dopamine</div>
            <div className="stp-npill serotonin">🧬 Serotonin</div>
            <div className="stp-npill oxytocin">🧬 Oxytocin</div>
            <div className="stp-npill cortisol">🧬 Cortisol ↓</div>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="stp-filter-bar">
          {(['all', 'healing_frequency', 'indian_classical', 'nature', 'sleep'] as Genre[]).map(
            (g) => (
              <button
                key={g}
                className={`stp-chip${currentFilter === g ? ' active' : ''}`}
                onClick={() => setCurrentFilter(g)}
              >
                {g === 'all'
                  ? 'All'
                  : `${GENRE_ICONS[g] ?? '🎵'} ${GENRE_LABEL[g] ?? g}`}
              </button>
            ),
          )}
        </div>

        {/* ── Now Playing Bar ── */}
        {currentTrack && (
          <div className="stp-np">
            <div className="stp-np-bars">
              <div className="stp-np-bar" />
              <div className="stp-np-bar" />
              <div className="stp-np-bar" />
              <div className="stp-np-bar" />
            </div>
            <div className="stp-np-info">
              <div className="stp-np-title">{currentTrack.title} — {currentTrack.artist}</div>
              <div className="stp-np-meta">
                {GENRE_LABEL[currentTrack.genre] ?? ''} · Free preview · 3:00 max
              </div>
            </div>
            <div className="stp-np-timer">{fmtD(previewSeconds)}</div>
            <button className="stp-np-close" onClick={stopTrack}>✕</button>
          </div>
        )}

        {/* ── Vimeo embedded player ── */}
        {currentTrack && (
          <div className="stp-vimeo">
            <iframe
              src={`https://player.vimeo.com/video/${currentTrack.video_id}?autoplay=1&byline=0&title=0&portrait=0`}
              allow="autoplay; fullscreen"
              allowFullScreen
              title={currentTrack.title}
            />
          </div>
        )}

        {/* ── Track library ── */}
        <div className="stp-library">
          <div className="stp-lib-label">
            Library <span style={{ marginLeft: 6, color: '#4A5568', fontWeight: 400 }}>({filteredTracks.length})</span>
          </div>

          {filteredTracks.length === 0 && tracks.length === 0 ? (
            <div className="stp-loading">Loading tracks from library…</div>
          ) : filteredTracks.length === 0 ? (
            <div className="stp-empty">No tracks in this category yet.</div>
          ) : (
            <table className="stp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Track</th>
                  <th>Genre</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Play</th>
                </tr>
              </thead>
              <tbody>
                {filteredTracks.map((t, i) => {
                  const gc = GENRE_CLASS[t.genre] ?? 'freq';
                  const gl = GENRE_LABEL[t.genre] ?? '';
                  const ico = GENRE_ICONS[t.genre] ?? '🎵';
                  const playing = currentTrackId === t.id;

                  return (
                    <tr key={t.id}>
                      <td className="stp-num">{i + 1}</td>
                      <td>
                        <div className="stp-track-info">
                          <div
                            className="stp-thumb"
                            style={t.thumbnail ? { backgroundImage: `url(${t.thumbnail})` } : {}}
                          >
                            {!t.thumbnail && ico}
                          </div>
                          <div>
                            <div className="stp-track-title">
                              {t.title}
                              <span className="stp-free-badge">FREE</span>
                            </div>
                            <div className="stp-track-artist">{t.artist}</div>
                            <div className="stp-preview-note">3 min free preview</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`stp-genre-tag ${gc}`}>{gl}</span></td>
                      <td className="stp-freq">{t.freq}</td>
                      <td className="stp-dur">{fmtD(t.duration)}</td>
                      <td>
                        <button
                          className={`stp-play-btn${playing ? ' playing' : ''}`}
                          onClick={() => toggleTrack(t.id)}
                          aria-label={playing ? `Pause ${t.title}` : `Play ${t.title}`}
                        >
                          {playing ? '⏸' : '▶'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>


      </div>
    </>
  );
=======
import SoundTherapyWorkspace from '../../components/shared/SoundTherapyWorkspace';

export default function SoundTherapyPage() {
  return <SoundTherapyWorkspace mode="dashboard" />;
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
}
