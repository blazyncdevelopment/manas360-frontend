import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const landingBg = encodeURI("/You renot alone-Beach.jpeg");

type GtSessionStatus = "live" | "soon" | "upcoming" | "completed" | "hidden";

type GtSession = {
  theme: string;
  emoji: string;
  host: string;
  lang: string;
  spots: { total: number; taken: number };
  startsInMs: number;
  durationMin: number;
};

type GroupGlowSession = {
  topic: string;
  emoji: string;
  isLive: boolean;
  upcomingLabel?: string;
  therapistName: string;
  therapistCred: string;
  avatar: string;
  details: string[];
  seatsLeft: number;
  seatsMax: number;
  seatsFillPct: number;
  wasPrice?: number;
  price: number;
  perLabel: string;
  buttonText: string;
  isUpcoming: boolean;
  socialProof: string;
};

function getGtStatus(session: GtSession, now: number, pageEpoch: number): GtSessionStatus {
  const startsAt = pageEpoch + session.startsInMs;
  const endTime = startsAt + session.durationMin * 60000;
  const diff = startsAt - now;
  if (now >= endTime) return "completed";
  if (diff <= 0) return "live";
  if (diff <= 15 * 60000) return "soon";
  if (diff <= 120 * 60000) return "upcoming";
  return "hidden";
}

function getGtCountdown(session: GtSession, now: number, pageEpoch: number): number {
  return pageEpoch + session.startsInMs - now;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "NOW";
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  if (min >= 60) {
    const hr = Math.floor(min / 60);
    const rm = min % 60;
    return `${hr}H ${rm}M`;
  }
  return `${min}M ${sec < 10 ? "0" : ""}${sec}S`;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now());
  const [hoveredSideId, setHoveredSideId] = useState<string | null>(null);
  const pageEpoch = useRef(Date.now());

  const sideRailRoutes: Partial<Record<string, string>> = useMemo(
    () => ({
      bot: "/ai-power-hub",
      pets: "/pet",
      sound: "/sound-therapy",
      schedule: "/patient/sessions",
      "chat-mid": "/ai-chat",
      notes: "/assessment",
      brain: "/self-help"
    }),
    []
  );

  const handleSideRailNavigate = (id: string) => {
    const to = sideRailRoutes[id];
    if (!to) return;
    navigate(to);
  };

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleScrollToAssess = () => {
    navigate("/assessment");
  };

  const [gtSessions, setGtSessions] = useState<GtSession[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        const res = await fetch(`${apiUrl}/v1/group-therapy/public/sessions`);
        const json = await res.json();
        if (json.success && json.data?.items) {
          const fetchedSessions: GtSession[] = json.data.items.map((item: any) => {
            const scheduledAtTime = new Date(item.scheduledAt).getTime();
            const startsInMs = scheduledAtTime - pageEpoch.current;
            
            const titleLower = (item.title || "").toLowerCase();
            let emoji = item.emoji || "🌱";
            if (!item.emoji) {
              if (titleLower.includes("anxiety") || titleLower.includes("worry") || titleLower.includes("stress")) {
                emoji = "😨";
              } else if (titleLower.includes("grief") || titleLower.includes("loss") || titleLower.includes("sadness")) {
                emoji = "🕯️";
              } else if (titleLower.includes("parenting") || titleLower.includes("child") || titleLower.includes("mother") || titleLower.includes("father") || titleLower.includes("mindful")) {
                emoji = "👤";
              }
            }

            return {
              theme: item.title || "Group Therapy",
              emoji: emoji,
              host: item.hostName || "Therapist",
              lang: item.language || "English",
              spots: { total: item.maxMembers || 15, taken: item.joinedCount || 0 },
              startsInMs: startsInMs,
              durationMin: item.durationMinutes || 60
            };
          });
          setGtSessions(fetchedSessions);
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      }
    };
    fetchSessions();
  }, []);

  const visibleGtSessions = useMemo(
    () =>
      gtSessions
        .filter((session) => {
          const status = getGtStatus(session, now, pageEpoch.current);
          return status === "live" || status === "soon" || status === "upcoming";
        })
        .slice(0, 3),
    [gtSessions, now]
  );

  const groupGlowSessions: GroupGlowSession[] = useMemo(
    () => [
      {
        topic: "Anxiety Support Circle",
        emoji: "\uD83D\uDE30",
        isLive: true,
        therapistName: "Dr. Priya Sharma",
        therapistCred: "M.Phil Clinical Psych \u00b7 8 yrs",
        avatar: "\uD83D\uDC69\u200D\u2695\uFE0F",
        details: ["\uD83D\uDD50 Now \u2014 45 min left", "\uD83D\uDDE3\uFE0F Hindi + English", "\uD83D\uDC65 12 participants"],
        seatsLeft: 3,
        seatsMax: 15,
        seatsFillPct: 80,
        wasPrice: 299,
        price: 149,
        perLabel: "/session",
        buttonText: "\u26A1 JOIN NOW",
        isUpcoming: false,
        socialProof:
          "\uD83D\uDD25 47 people joined this week \u00b7 Meera from Bengaluru says \"Changed my life\""
      },
      {
        topic: "Work Burnout Recovery",
        emoji: "\uD83D\uDD25",
        isLive: true,
        therapistName: "Raj Malhotra, RCI",
        therapistCred: "CBT Specialist \u00b7 6 yrs",
        avatar: "\uD83D\uDC68\u200D\u2695\uFE0F",
        details: ["\uD83D\uDD50 Now \u2014 30 min left", "\uD83D\uDDE3\uFE0F English", "\uD83D\uDC65 9 participants"],
        seatsLeft: 6,
        seatsMax: 15,
        seatsFillPct: 60,
        wasPrice: 299,
        price: 149,
        perLabel: "/session",
        buttonText: "\u26A1 JOIN NOW",
        isUpcoming: false,
        socialProof: "\uD83C\uDFE2 Popular with IT professionals \u00b7 63% report better sleep after 2 sessions"
      },
      {
        topic: "Grief & Loss \u2014 Safe Space",
        emoji: "\uD83D\uDC94",
        isLive: true,
        therapistName: "Dr. Lakshmi Iyer",
        therapistCred: "Trauma Specialist \u00b7 12 yrs",
        avatar: "\uD83D\uDC69\u200D\u2695\uFE0F",
        details: ["\uD83D\uDD50 Now \u2014 50 min left", "\uD83D\uDDE3\uFE0F Tamil + English", "\uD83D\uDC65 7 participants"],
        seatsLeft: 8,
        seatsMax: 15,
        seatsFillPct: 47,
        wasPrice: 399,
        price: 199,
        perLabel: "/session",
        buttonText: "\u26A1 JOIN NOW",
        isUpcoming: false,
        socialProof:
          "\uD83D\uDD4A\uFE0F Anonymous participation \u00b7 \"I didn't feel alone for the first time\" \u2014 Anon, Chennai"
      },
      {
        topic: "Couples Communication Workshop",
        emoji: "\uD83D\uDC91",
        isLive: false,
        upcomingLabel: "\uD83D\uDCC5 Tomorrow 7 PM",
        therapistName: "Anita Desai, MFT",
        therapistCred: "Marriage & Family \u00b7 10 yrs",
        avatar: "\uD83D\uDC69\u200D\u2695\uFE0F",
        details: ["\uD83D\uDD50 90 min workshop", "\uD83D\uDDE3\uFE0F Hindi", "\uD83D\uDC6B Couples only"],
        seatsLeft: 4,
        seatsMax: 8,
        seatsFillPct: 50,
        price: 399,
        perLabel: "/couple",
        buttonText: "\uD83D\uDCC5 RESERVE SPOT",
        isUpcoming: true,
        socialProof: "\uD83D\uDC91 \"We stopped fighting and started talking\" \u2014 Couple from Delhi, Week 3"
      }
    ],
    []
  );

  const liveGroupCount = groupGlowSessions.filter((s) => s.isLive).length;

  return (
    <div
      className="landing-page-root"
      style={{
        backgroundImage: `linear-gradient(rgba(238, 233, 233, 0.46), rgba(223, 213, 213, 0.46)), url(${landingBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundColor: "#F8FAFC"
      }}
    >
      <div
        style={{
          position: "fixed",
          left: "-6px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 120
        }}
      >
        <div
          className={`landing-side-rail${hoveredSideId ? " landing-side-rail-expanded" : ""}`}
          style={{
            background: "rgba(255,255,255,0.88)",
            border: "1px solid #E1E8F0",
            borderLeft: "none",
            borderRadius: "0 18px 18px 0",
            padding: "10px 8px 10px 6px",
            boxShadow: "0 14px 36px rgba(15, 23, 42, 0.14)",
            backdropFilter: "blur(10px)",
            width: "56px"
          }}
          onMouseLeave={() => setHoveredSideId(null)}
        >
          {[
            {
              id: "bot",
              icon: "🤖",
              title: "AnytimeBUDDY",
              subtitle: "Your 24/7 AI companion · Talk anytime",
              bg: "linear-gradient(180deg, #EFE7FF, #E6EEFF)",
              pill: { text: "LIVE", bg: "#22C55E", fg: "#052E16" },
              dot: true
            },
            {
              id: "pets",
              icon: "🐾",
              title: "Digital Pets",
              subtitle: "Chintu 🐱 Bholu 🐶 Mithi 🐻 Dheer 🐘",
              bg: "linear-gradient(180deg, #EFE7FF, #ECE9FF)",
              pill: { text: "NEW", bg: "#A78BFA", fg: "#2E1065" }
            },
            {
              id: "sound",
              icon: "🎵",
              title: "Sound Therapy",
              subtitle: "Sleep, calm, focus — 200+ curated tracks",
              bg: "linear-gradient(180deg, #DDF3EC, #E3F0FF)"
            },
            { id: "divider-1", divider: true },
            { id: "whatsapp-label", label: "WHATSAPP" },
            {
              id: "schedule",
              icon: "🗓️",
              title: "WA Book Session",
              subtitle: "Book therapist via WhatsApp · 2 min",
              bg: "linear-gradient(180deg, #DDF3EC, #E3F0FF)"
            },
            {
              id: "chat-mid",
              icon: "💬",
              title: "WA Session",
              subtitle: "Text-based therapy · Chat at your pace",
              bg: "linear-gradient(180deg, #DDF3EC, #E6EDF8)",
              pill: { text: "CHAT", bg: "#22C55E", fg: "#052E16" }
            },
            { id: "divider-2", divider: true },
            { id: "free-tools-label", label: "FREE TOOLS" },
            {
              id: "notes",
              icon: "📋",
              title: "Free Screening",
              subtitle: "PHQ-9 · GAD-7 · 3 min · 5 languages",
              bg: "linear-gradient(180deg, #E6F0FF, #E9EEF8)",
              pill: { text: "FREE", bg: "#60A5FA", fg: "#0B2457" }
            },
            {
              id: "brain",
              icon: "🧠",
              title: "AI Self-Service",
              subtitle: "CBT · Journaling · Breathing · Mood",
              bg: "linear-gradient(180deg, #FDE7EF, #F4E8FF)",
              pill: { text: "AI", bg: "#FCA5A5", fg: "#450A0A" }
            }
          ].map((item) => {
            if ("divider" in item && item.divider) {
              return <div key={item.id} style={{ height: "1px", background: "#D7DEE8", margin: "5px 6px" }} />;
            }

            if ("label" in item && item.label) {
              return (
                <div key={item.id} className="landing-side-section-label" aria-hidden={!hoveredSideId}>
                  {item.label}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                className={`landing-side-item${hoveredSideId === item.id ? " is-active" : ""}`}
                style={{
                  width: "100%",
                  height: "44px",
                  maxHeight: "44px",
                  borderRadius: "14px",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  cursor: sideRailRoutes[item.id] ? "pointer" : "default",
                  margin: "1px 2px",
                  background: "transparent",
                  fontSize: "18px",
                  position: "relative",
                  overflow: "hidden",
                  minWidth: 0
                }}
                aria-label={item.title}
                onMouseEnter={() => setHoveredSideId(item.id)}
                onFocus={() => setHoveredSideId(item.id)}
                onBlur={() => setHoveredSideId(null)}
                onClick={() => handleSideRailNavigate(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSideRailNavigate(item.id);
                  }
                }}
              >
                <span className="landing-side-icon notranslate" translate="no" style={{ background: item.bg, flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span className="landing-side-text">
                  <span className="landing-side-title">{item.title}</span>
                  <span className="landing-side-subtitle">{item.subtitle}</span>
                </span>
                {"pill" in item && item.pill ? (
                  <span
                    className="landing-side-pill manas-text-clip"
                    style={{ background: item.pill.bg, color: item.pill.fg }}
                    aria-hidden
                  >
                    {item.pill.text}
                  </span>
                ) : null}
                {item.dot ? (
                  <span
                    style={{
                      position: "absolute",
                      top: "6px",
                      left: "34px",
                      width: "7px",
                      height: "7px",
                      borderRadius: "999px",
                      background: "#22C55E",
                      border: "1.5px solid #FFFFFF"
                    }}
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          right: "18px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 130,
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        {[
          { bg: "#FFF", image: "/AnytimeBUDDY.jpeg", label: "Doctor", href: "/ai-power-hub" },
          { bg: "#111827", image: "/HitASixer.jpeg", label: "Cricket", href: "/hit-a-sixer" },
          { bg: "#03163A", image: "/Pet.jpg", label: "Digital Pet", href: "/pet" }
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              width: "78px",
              height: "78px",
              borderRadius: "999px",
              background: item.bg,
              border: "3px solid rgba(255,255,255,0.92)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              animation: `landingAvatarFloat 3.8s ease-in-out ${idx * 0.35}s infinite`,
              transition: "transform 180ms ease, box-shadow 180ms ease"
            }}
            aria-label={item.label}
            role="button"
            tabIndex={0}
            onClick={() => navigate(item.href)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(item.href);
              }
            }}
          >
            <img
              src={item.image}
              alt={item.label}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
                borderRadius: "999px",
                background: item.bg
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ position: "fixed", right: "24px", bottom: "24px", zIndex: 140 }}>
        <button
          type="button"
          style={{
            width: "62px",
            height: "62px",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
            boxShadow: "0 16px 36px rgba(0,0,0,0.22)",
            color: "white",
            position: "relative",
            animation: "landingChatFloat 3.2s ease-in-out infinite"
          }}
          aria-label="Chat"
        >
          <span style={{ fontSize: "30px", display: "inline-block", transform: "rotate(0deg)", animation: "landingChatTilt 3s ease-in-out infinite" }}>&#129302;</span>
          <span
            style={{
              position: "absolute",
              top: "-8px",
              left: "-7px",
              width: "18px",
              height: "18px",
              borderRadius: "999px",
              background: "#EF4444",
              color: "white",
              fontSize: "11px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(255,255,255,0.9)"
            }}
          >
            3
          </span>
          <span
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "14px",
              height: "14px",
              borderRadius: "999px",
              background: "#22C55E",
              border: "2px solid rgba(255,255,255,0.95)"
            }}
            aria-hidden
          />
        </button>
      </div>

      <main className="landing-main">
        <section className="landing-gt-strip" aria-label="Live and next 2 hours">
          <div className="landing-gt-strip-inner">
            <div className="landing-gt-strip-header">
              <div className="landing-gt-strip-left">
                <span style={{ fontSize: "13px" }} aria-hidden="true">
                  &#128308;
                </span>
                <span className="landing-gt-strip-title">Live &amp; Next 2 Hours</span>
                <span className="landing-gt-strip-badge">FREE</span>
              </div>
              <button
                type="button"
                className="landing-gt-strip-link"
                onClick={() => navigate("/group-therapy")}
              >
                View full schedule &rarr;
              </button>
            </div>
            <div
              className="landing-gt-boxes"
              style={{
                gridTemplateColumns: "repeat(3, 1fr)"
                // gridTemplateColumns:
                //   visibleGtSessions.length === 1
                //     ? "1fr"
                //     : visibleGtSessions.length === 2
                //       ? "1fr 1fr"
                //       : "repeat(3, 1fr)"
              }}
            >
              {visibleGtSessions.length === 0 ? (
                <div className="landing-gt-box-empty">
                  No sessions in the next 2 hours.{" "}
                  <button type="button" onClick={() => navigate("/group-therapy")}>
                    See full schedule &rarr;
                  </button>
                </div>
              ) : (
                visibleGtSessions.map((session) => {
                  const status = getGtStatus(session, now, pageEpoch.current);
                  const countdown = getGtCountdown(session, now, pageEpoch.current);
                  const seatsLeft = session.spots.total - session.spots.taken;
                  const seatPct = (session.spots.taken / session.spots.total) * 100;
                  const boxClass =
                    status === "live" ? "landing-gt-box-live" : status === "soon" ? "landing-gt-box-soon" : "landing-gt-box-upcoming";
                  const barColor = status === "live" ? "#FF9933" : status === "soon" ? "#3B82F6" : "#EAB308";

                  return (
                    <div key={session.theme} className={`landing-gt-box ${boxClass}`}>
                      <div className="landing-gt-box-top">
                        <span className="landing-gt-box-theme">
                          <span className="landing-gt-emoji">{session.emoji}</span> {session.theme}
                        </span>
                        {status === "live" ? (
                          <span className="landing-gt-status landing-gt-status-live">
                            <span className="landing-gt-dot" />
                            LIVE
                          </span>
                        ) : status === "soon" ? (
                          <span className="landing-gt-status landing-gt-status-soon">
                            &#128293; {formatCountdown(countdown)}
                          </span>
                        ) : (
                          <span className="landing-gt-status landing-gt-status-upcoming">
                            &#9200; {formatCountdown(countdown)}
                          </span>
                        )}
                      </div>
                      <div className="landing-gt-box-meta">
                        <span>&#128104;&#8205;&#9877;&#65039; {session.host}</span>
                        <span>&#127760; {session.lang}</span>
                      </div>
                      {seatsLeft <= 3 && seatsLeft > 0 ? (
                        <div className="landing-gt-box-seats landing-gt-box-seats-hot">
                          &#128293; Only {seatsLeft} seat{seatsLeft > 1 ? "s" : ""} left!
                          <span className="landing-gt-seats-bar">
                            <span className="landing-gt-seats-fill" style={{ width: `${seatPct}%`, background: barColor }} />
                          </span>
                        </div>
                      ) : (
                        <div className="landing-gt-box-seats-muted">
                          &#128101; {session.spots.taken}/{session.spots.total} joined
                        </div>
                      )}
                      <button
                        type="button"
                        className={`landing-gt-box-btn ${status === "live"
                          ? "landing-gt-box-btn-live"
                          : status === "soon"
                            ? "landing-gt-box-btn-soon"
                            : "landing-gt-box-btn-upcoming"
                          }`}
                        onClick={() => navigate("/group-therapy")}
                      >
                        {status === "live"
                          ? "\u26A1 JOIN NOW \u2014 FREE"
                          : status === "soon"
                            ? "\uD83D\uDD25 JOIN \u2014 Starting Soon"
                            : "\uD83D\uDD14 Remind Me"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <div className="landing-hero-section" style={{ textAlign: "center", padding: "50px 24px 30px", maxWidth: "980px", margin: "0 auto", width: "100%" }}>
          <h1 className="landing-hero-title">
            You're <span className="landing-hero-accent">not alone</span>. Let's take
            <br />
            this <span className="landing-hero-accent">together</span>.
          </h1>
          <p className="landing-hero-subtitle">
            Feeling overwhelmed? Confused? That's okay. We'll help you
            <br />
            understand your feelings in a safe, quiet space.
          </p>
          <p className="landing-hero-hint">Takes just 60 seconds.</p>

          <button type="button" className="landing-hero-cta" onClick={handleScrollToAssess}>
            START FREE SCREENING &rarr;
          </button>

          <div className="landing-trust-badges">
            {["Confidential", "No Judgment", "Immediate"].map((t) => (
              <div key={t} className="landing-trust-badge">
                <span className="landing-trust-dot" aria-hidden="true" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <section
          className="landing-pros-section"
          aria-label="For Mental Health Professionals"
          style={{
            background: "transparent",
            padding: "42px 16px 42px 16px"
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#001A4D",
                opacity: 0.7,
                marginBottom: "8px"
              }}
            >
              <span style={{ fontSize: "14px" }}>&#10022;</span>
              FOR MENTAL HEALTH PROFESSIONALS
            </div>

            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontSize: "14px",
                fontWeight: 400,
                color: "#3D3D5C",
                marginBottom: "24px"
              }}
            >
              Join India&apos;s growing network &mdash; Discover plans, create your profile, start earning
            </div>

            <div className="pro-grid">
              <div className="landing-pro-card">
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "white", background: "linear-gradient(135deg,#7C3AED,#A78BFA)", padding: "4px 8px", borderRadius: "999px" }}>RCI VERIFIED</span>
                </div>
                <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
                  <div style={{ width: "92px", height: "92px", borderRadius: "999px", border: "2px dashed rgba(124,58,237,0.45)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(237,233,254,0.65)" }}>
                    <span style={{ fontSize: "34px" }}>&#129504;</span>
                  </div>
                </div>
                <div style={{ marginTop: "14px", fontSize: "13px", fontWeight: 800, color: "#1A1A2E" }}>Psychologist</div>
                <div style={{ marginTop: "6px", fontSize: "10px", fontWeight: 400, color: "#666680", lineHeight: 1.45 }}>Clinical &amp; counseling psychology. RCI registered. Earn ₹60K&ndash;₹2L/mo</div>
                <button type="button" onClick={() => navigate("/provider-landing")} style={{ marginTop: "14px", border: "1.5px solid rgba(124,58,237,0.7)", background: "rgba(255,255,255,0.95)", color: "#6D28D9", fontWeight: 900, fontSize: "12px", padding: "10px 14px", borderRadius: "999px", cursor: "pointer" }}>
                  &#10022; Join Now
                </button>
                <div style={{ marginTop: "10px", fontSize: "8.5px", fontWeight: 600, color: "#666680" }}>Discover &mdash; Plans &mdash; Profile</div>
              </div>

              <div className="landing-pro-card">
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "white", background: "linear-gradient(135deg,#0EA5A6,#22C1C3)", padding: "4px 8px", borderRadius: "999px" }}>NMC VERIFIED</span>
                </div>
                <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
                  <div style={{ width: "92px", height: "92px", borderRadius: "999px", border: "2px dashed rgba(14,165,166,0.45)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(204,251,241,0.55)" }}>
                    <span style={{ fontSize: "34px" }}>&#128181;</span>
                  </div>
                </div>
                <div style={{ marginTop: "14px", fontSize: "13px", fontWeight: 800, color: "#1A1A2E" }}>Psychiatrist</div>
                <div style={{ marginTop: "6px", fontSize: "10px", fontWeight: 400, color: "#666680", lineHeight: 1.45 }}>Diagnosis, medication, e-prescriptions. NMC registered MDs</div>
                <button type="button" onClick={() => navigate("/provider-landing")} style={{ marginTop: "14px", border: "1.5px solid rgba(14,165,166,0.7)", background: "rgba(255,255,255,0.95)", color: "#0F766E", fontWeight: 900, fontSize: "12px", padding: "10px 14px", borderRadius: "999px", cursor: "pointer" }}>
                  &#10022; Join Now
                </button>
                <div style={{ marginTop: "10px", fontSize: "8.5px", fontWeight: 600, color: "#666680" }}>Discover &mdash; Plans &mdash; Profile</div>
              </div>

              <div className="landing-pro-card">
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "white", background: "linear-gradient(135deg,#16A34A,#22C55E)", padding: "4px 8px", borderRadius: "999px" }}>0% FEE &mdash; 3 MO</span>
                </div>
                <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
                  <div style={{ width: "92px", height: "92px", borderRadius: "999px", border: "2px dashed rgba(34,197,94,0.45)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(220,252,231,0.6)" }}>
                    <span style={{ fontSize: "34px" }}>&#128154;</span>
                  </div>
                </div>
                <div style={{ marginTop: "14px", fontSize: "13px", fontWeight: 800, color: "#1A1A2E" }}>Therapist</div>
                <div style={{ marginTop: "6px", fontSize: "10px", fontWeight: 400, color: "#666680", lineHeight: 1.45 }}>CBT, DBT, REBT, integrative. Build your practice on your terms</div>
                <button type="button" onClick={() => navigate("/provider-landing")} style={{ marginTop: "14px", border: "1.5px solid rgba(34,197,94,0.7)", background: "rgba(255,255,255,0.95)", color: "#15803D", fontWeight: 900, fontSize: "12px", padding: "10px 14px", borderRadius: "999px", cursor: "pointer" }}>
                  &#10022; Join Now
                </button>
                <div style={{ marginTop: "10px", fontSize: "8.5px", fontWeight: 600, color: "#666680" }}>Discover &mdash; Plans &mdash; Profile</div>
              </div>

              <div className="landing-pro-card">
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "white", background: "linear-gradient(135deg,#D97706,#F59E0B)", padding: "4px 8px", borderRadius: "999px" }}>CERTIFIED</span>
                </div>
                <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
                  <div style={{ width: "92px", height: "92px", borderRadius: "999px", border: "2px dashed rgba(245,158,11,0.45)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(254, 243, 199, 0.7)" }}>
                    <span style={{ fontSize: "34px" }}>&#11088;</span>
                  </div>
                </div>
                <div style={{ marginTop: "14px", fontSize: "13px", fontWeight: 800, color: "#1A1A2E" }}>NLP Coach</div>
                <div style={{ marginTop: "6px", fontSize: "10px", fontWeight: 400, color: "#666680", lineHeight: 1.45 }}>Neuro-linguistic programming. Life coaching. Transformation specialists</div>
                <button type="button" onClick={() => navigate("/provider-landing")} style={{ marginTop: "14px", border: "1.5px solid rgba(245,158,11,0.75)", background: "rgba(255,255,255,0.95)", color: "#B45309", fontWeight: 900, fontSize: "12px", padding: "10px 14px", borderRadius: "999px", cursor: "pointer" }}>
                  &#10022; Join Now
                </button>
                <div style={{ marginTop: "10px", fontSize: "8.5px", fontWeight: 600, color: "#666680" }}>Discover &mdash; Plans &mdash; Profile</div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="assessSection"
          className="landing-assess-section"
          style={{
            background: "transparent",
            padding: "28px 16px"
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              className="landing-assess-card"
              style={{
                background: "rgba(255,255,255,0.92)",
                borderRadius: "28px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 18px 60px rgba(0,0,0,0.10)",
                padding: "34px 32px"
              }}
            >
              <div className="assess-grid">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#059669" }} />
                    <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "#002365" }}>FREE MENTAL HEALTH CHECK-UP</span>
                  </div>

                  <div className="landing-assess-heading">
                    Not sure where to start?
                    <br />
                    Take a <em>free assessment</em> &mdash; your way.
                  </div>

                  <div style={{ fontSize: "13px", color: "#666680", lineHeight: 1.7, fontWeight: 400, maxWidth: "640px" }}>
                    A quick PHQ-9 screening takes 3 minutes. Available in Hindi, Kannada, Tamil, Telugu &amp; English. Get your results instantly &mdash; no signup,
                    no charge, completely confidential.
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "18px", fontSize: "11px", fontWeight: 600, color: "#3D3D5C" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "8px", background: "rgba(226,232,240,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                        &#128274;
                      </span>
                      100% Confidential
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "8px", background: "rgba(226,232,240,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                        &#127381;
                      </span>
                      Always Free
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "8px", background: "rgba(226,232,240,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                        &#127760;
                      </span>
                      5 Languages
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "8px", background: "rgba(226,232,240,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                        &#9889;
                      </span>
                      Instant Results
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(226,232,240,0.95)",
                      borderRadius: "18px",
                      padding: "16px",
                      boxShadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px"
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "rgba(237,233,254,0.8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                        &#128241;
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A2E" }}>In-App Check-In</div>
                        <div style={{ marginTop: "3px", fontSize: "10.5px", fontWeight: 400, color: "#666680", lineHeight: 1.45 }}>
                          Emoji mood picker &bull; 60-second Vibe Check &bull; Track your streak
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        padding: "8px 12px",
                        borderRadius: "999px",
                        background: "rgba(237,233,254,0.95)",
                        color: "#6D28D9",
                        whiteSpace: "nowrap"
                      }}
                    >
                      OPEN APP
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(226,232,240,0.95)",
                      borderRadius: "18px",
                      padding: "16px",
                      boxShadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px"
                    }}
                    onClick={() => window.open("https://wa.me/919876543210", "_blank")}
                    role="button"
                    tabIndex={0}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "rgba(220,252,231,0.85)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                        &#128172;
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1A1A2E" }}>WhatsApp Assessment</div>
                        <div style={{ marginTop: "3px", fontSize: "10.5px", fontWeight: 400, color: "#666680", lineHeight: 1.45 }}>
                          Chat-based PHQ-9 &bull; Reply at your pace &bull; Get PDF report
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        padding: "8px 12px",
                        borderRadius: "999px",
                        background: "rgba(220,252,231,0.95)",
                        color: "#15803D",
                        whiteSpace: "nowrap"
                      }}
                    >
                      CHAT NOW
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-triple-section" aria-label="Feature cards" style={{ padding: "0 16px" }}>
          <div style={{ maxWidth: "1260px", margin: "0 auto" }}>
            <div className="triple-grid">
              <div
                className="landing-feature-card"
                style={{
                  borderRadius: "18px",
                  border: "2px solid rgba(245, 158, 11, 0.9)",
                  background: "linear-gradient(135deg, rgba(255, 237, 213, 0.98), rgba(255, 247, 237, 0.9))",
                  padding: "18px",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
                  cursor: "pointer"
                }}
                role="button"
                tabIndex={0}
                onClick={() => navigate("/nri-landing")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate("/nri-landing");
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 900, letterSpacing: "2px", textTransform: "uppercase", color: "#F97316" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#38BDF8" }} />
                  FOR NRIS & GLOBAL INDIANS
                </div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#9A3412", lineHeight: 1.15, marginTop: "10px" }}>
                  Find a <span style={{ fontStyle: "italic", fontFamily: "'Playfair Display', serif" }}>Janmabhoomi</span>
                  <br />
                  Connection &mdash; Heal
                </div>
                <div style={{ fontSize: "12px", color: "#7C2D12", lineHeight: 1.6, fontWeight: 700, marginTop: "10px" }}>
                  Therapy in your mother tongue with Indian therapists who understand your desi dilemma &mdash; career pressure abroad, family guilt, identity crisis,
                  relationships across continents.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                  {["IST + Your Timezone", "Hindi · Tamil · Telugu · Kannada", "HIPAA + DPDPA", "USD / GBP / AED / SGD"].map((chip) => (
                    <div key={chip} style={{ fontSize: "10px", fontWeight: 900, color: "#9A3412", background: "rgba(255,255,255,0.65)", border: "1px solid rgba(251, 191, 36, 0.55)", padding: "4px 8px", borderRadius: "999px" }}>
                      {chip}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#9CA3AF", textDecoration: "line-through", fontWeight: 800 }}>$45/session</span>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: "#B45309" }}>$29</span>
                  <span style={{ fontSize: "11px", fontWeight: 900, color: "#166534", background: "rgba(187, 247, 208, 0.7)", border: "1px solid #BBF7D0", padding: "4px 10px", borderRadius: "999px" }}>
                    SAVE 35%
                  </span>
                </div>
                <button type="button" onClick={() => navigate("/nri-landing")} style={{ marginTop: "12px", width: "100%", border: "none", cursor: "pointer", borderRadius: "14px", padding: "12px 14px", background: "linear-gradient(135deg, #C2410C, #EA580C)", color: "white", fontWeight: 900, fontSize: "12px", boxShadow: "0 18px 40px rgba(0,0,0,0.12)" }}>
                  IN Connect to Home &mdash; Start Free &rarr;
                </button>
              </div>

              <div className="landing-feature-card" style={{ borderRadius: "18px", border: "2px solid rgba(34, 197, 94, 0.55)", background: "linear-gradient(135deg, rgba(220, 252, 231, 0.96), rgba(240, 253, 244, 0.92))", padding: "18px", boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 900, letterSpacing: "2px", textTransform: "uppercase", color: "#15803D" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#A78BFA" }} />
                  FOR PRACTICING THERAPISTS
                </div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#14532D", lineHeight: 1.15, marginTop: "10px" }}>MyDigitalClinic</div>
                <div style={{ fontSize: "12px", color: "#166534", lineHeight: 1.6, fontWeight: 700, marginTop: "10px" }}>
                  Already have patients? Digitize your practice. Your patients, your records, your control. No marketplace. No patient-sharing.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                  {["Session Notes", "Scheduling", "Prescriptions", "PHQ-9 Tracking", "DPDPA"].map((chip) => (
                    <div key={chip} style={{ fontSize: "10px", fontWeight: 900, color: "#14532D", background: "rgba(255,255,255,0.65)", border: "1px solid rgba(34, 197, 94, 0.35)", padding: "4px 8px", borderRadius: "999px" }}>
                      {chip}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "white", background: "rgba(21, 128, 61, 0.9)", padding: "5px 10px", borderRadius: "999px" }}>3 DAYS FREE</span>
                  <span style={{ fontSize: "12px", fontWeight: 900, color: "#166534" }}>Pick only modules you need &mdash; from &#8377;99/mo</span>
                </div>
                <button type="button" onClick={() => navigate("/my-digital-clinic")} style={{ marginTop: "12px", width: "100%", border: "none", cursor: "pointer", borderRadius: "14px", padding: "12px 14px", background: "linear-gradient(135deg, #14532D, #1F7A3D)", color: "white", fontWeight: 900, fontSize: "12px", boxShadow: "0 18px 40px rgba(0,0,0,0.12)" }}>
                  Configure My Clinic &rarr;
                </button>
              </div>

              <div className="landing-feature-card" style={{ borderRadius: "18px", border: "2px solid rgba(99, 102, 241, 0.6)", background: "linear-gradient(135deg, rgba(224, 231, 255, 0.98), rgba(245, 243, 255, 0.9))", padding: "18px", boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 900, letterSpacing: "2px", textTransform: "uppercase", color: "#7C3AED" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#111827" }} />
                  DIGITAL COMPANIONS
                </div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#4C1D95", lineHeight: 1.15, marginTop: "10px" }}>
                  Meet Your Healing
                  <br />
                  Companions
                </div>
                <div style={{ fontSize: "12px", color: "#6D28D9", lineHeight: 1.6, fontWeight: 700, marginTop: "10px" }}>Nurture a companion that grows with your wellness journey.</div>
                <div className="landing-pet-grid" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(99, 102, 241, 0.25)", padding: "10px", borderRadius: "14px" }}>
                  {[{ name: "Baby Dino", sub: "Oxytocin", icon: "\uD83E\uDD96" }, { name: "Retriever", sub: "Serotonin", icon: "\uD83D\uDC36" }, { name: "Elephant", sub: "Dopamine", icon: "\uD83D\uDC18" }, { name: "Chintu", sub: "Endorphins", icon: "\uD83D\uDC31" }].map((p) => (
                    <div key={p.name} style={{ flex: "1 1 110px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "12px", background: "rgba(124,58,237,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>{p.icon}</div>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 900, color: "#4C1D95" }}>{p.name}</div>
                        <div style={{ fontSize: "10px", fontWeight: 900, color: "#6D28D9" }}>{p.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#6D28D9", marginTop: "10px" }}>&bull; Oxytocin (love) &bull; Serotonin (happy) &bull; Dopamine (reward) &bull; Endorphins (energy)</div>
                <button type="button" onClick={() => navigate("/pet")} style={{ marginTop: "12px", width: "100%", border: "none", cursor: "pointer", borderRadius: "14px", padding: "12px 14px", background: "linear-gradient(135deg, #6D28D9, #7C3AED)", color: "white", fontWeight: 900, fontSize: "12px", boxShadow: "0 18px 40px rgba(0,0,0,0.12)" }}>Name Your Pet &mdash; Adopt FREE</button>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-group-section" aria-label="Live and upcoming group sessions">
          <div className="landing-group-zone">
            <div className="landing-group-zone-header">
              <div className="landing-group-zone-title">
                <span aria-hidden="true">&#128293;</span>
                Live &amp; Upcoming Group Sessions
              </div>
              <div className="landing-group-zone-count">{liveGroupCount} LIVE NOW</div>
            </div>
          </div>
          <div className="landing-group-zone-grid">
            <div className="landing-group-glow-grid">
              {groupGlowSessions.map((session) => (
                <div
                  key={session.topic}
                  className={`landing-group-glow-box${session.isLive ? " landing-group-glow-box-live" : ""}`}
                >
                  <div className="landing-gg-header">
                    <div className="landing-gg-topic">
                      {session.emoji} {session.topic}
                    </div>
                    {session.isLive ? (
                      <div className="landing-gg-live-dot">LIVE</div>
                    ) : (
                      <span className="landing-gg-upcoming-dot">{session.upcomingLabel}</span>
                    )}
                  </div>
                  <div className="landing-gg-body">
                    <div className="landing-gg-therapist">
                      <div className="landing-gg-avatar">{session.avatar}</div>
                      <div>
                        <div className="landing-gg-tname">{session.therapistName}</div>
                        <div className="landing-gg-tcred">{session.therapistCred}</div>
                      </div>
                    </div>
                    <div className="landing-gg-details">
                      {session.details.map((detail) => (
                        <span key={detail}>{detail}</span>
                      ))}
                    </div>
                    <div className="landing-gg-seats">
                      <div className="landing-gg-seats-label">
                        <span className="landing-gg-seats-left">
                          {session.isUpcoming
                            ? `${session.seatsLeft} couples left!`
                            : `${session.seatsLeft} seats left!`}
                        </span>
                        <span className="landing-gg-seats-total">
                          {session.isUpcoming ? `${session.seatsMax} couples max` : `${session.seatsMax} max`}
                        </span>
                      </div>
                      <div className="landing-gg-seats-bar">
                        <div className="landing-gg-seats-fill" style={{ width: `${session.seatsFillPct}%` }} />
                      </div>
                    </div>
                    <div className="landing-gg-price-row">
                      <div className="landing-gg-price">
                        {session.wasPrice ? (
                          <span className="landing-gg-price-was">&#8377;{session.wasPrice}</span>
                        ) : null}{" "}
                        &#8377;{session.price} <span className="landing-gg-price-per">{session.perLabel}</span>
                      </div>
                      <button
                        type="button"
                        className={`landing-gg-join-btn ${session.isUpcoming ? "landing-gg-join-btn-upcoming" : "landing-gg-join-btn-live"
                          }`}
                        onClick={() => navigate("/group-therapy")}
                      >
                        {session.buttonText}
                      </button>
                    </div>
                  </div>
                  <div className="landing-gg-social-proof">{session.socialProof}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <style>{`
        @keyframes landingAvatarFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
          100% { transform: translateY(0px); }
        }
        @keyframes landingChatFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes landingChatTilt {
          0% { transform: rotate(0deg); }
          72% { transform: rotate(0deg); }
          82% { transform: rotate(-10deg); }
          92% { transform: rotate(10deg); }
          100% { transform: rotate(0deg); }
        }
        .landing-page-root {
          overflow-x: clip;
          --landing-section-gap: 72px;
          --landing-logo-size: 56px;
          --landing-ocean: #002365;
          --landing-ocean-deep: #001a4d;
          --landing-dark: #1a1a2e;
          --landing-dark-soft: #3d3d5c;
          --landing-gray: #666680;
          --landing-green: #059669;
          --landing-gold: #7f8000;
          display: flex;
          flex-direction: column;
          flex: 1 0 auto;
          font-family: 'DM Sans', sans-serif;
          color: var(--landing-dark);
          -webkit-font-smoothing: antialiased;
        }

        .landing-side-rail {
          width: 56px !important;
          transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          contain: layout style;
        }
        .landing-side-rail-expanded {
          width: 290px !important;
        }
        .landing-side-rail:not(.landing-side-rail-expanded) .landing-side-text,
        .landing-side-rail:not(.landing-side-rail-expanded) .landing-side-pill,
        .landing-side-rail:not(.landing-side-rail-expanded) .landing-side-section-label {
          display: none !important;
        }
        .landing-side-item {
          padding: 6px 8px;
          gap: 10px;
          height: 44px;
          max-height: 44px;
          min-width: 0;
          overflow: hidden;
          transition: background 180ms ease, transform 180ms ease;
        }
        .landing-side-item:hover,
        .landing-side-item.is-active {
          background: rgba(255, 255, 255, 0.72);
          transform: translateX(1px);
        }
        .landing-side-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.10);
          border: 1px solid rgba(226, 232, 240, 0.9);
        }
        .landing-side-text {
          display: flex;
          flex: 1 1 0%;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 160ms ease, transform 200ms ease;
          pointer-events: none;
        }
        .landing-side-rail-expanded .landing-side-text {
          opacity: 1;
          transform: translateX(0px);
          pointer-events: auto;
        }
        .landing-side-title {
          display: block;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          line-height: 15px;
          height: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          width: 100%;
        }
        .landing-side-subtitle {
          display: block;
          margin-top: 2px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(15, 23, 42, 0.62);
          line-height: 13px;
          height: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          width: 100%;
        }
        .landing-side-pill {
          margin-left: auto;
          flex: 0 0 auto;
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 999px;
          letter-spacing: 0.4px;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.10);
          opacity: 0;
          transform: translateX(10px);
          transition: opacity 160ms ease, transform 200ms ease;
          border: 2px solid rgba(255, 255, 255, 0.9);
          pointer-events: none;
          max-width: 46px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .landing-side-rail-expanded .landing-side-pill {
          opacity: 1;
          transform: translateX(0px);
          pointer-events: auto;
        }
        .landing-side-section-label {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #0ea5a6;
          margin: 6px 10px 1px;
          opacity: 0;
          transition: opacity 160ms ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          height: 14px;
          line-height: 14px;
          pointer-events: none;
        }
        .landing-side-rail-expanded .landing-side-section-label {
          opacity: 1;
        }
        .landing-main {
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1 1 auto;
          width: 100%;
          padding-top: 0;
          padding-bottom: 48px;
        }
        .landing-main > section,
        .landing-main > .landing-hero-section {
          background: transparent;
        }
        .landing-main > section,
        .landing-main > .landing-hero-section {
          margin-bottom: var(--landing-section-gap);
        }
        .landing-main > section:last-child {
          margin-bottom: calc(var(--landing-section-gap) / 2);
        }
        .landing-main > .landing-gt-strip {
          margin-bottom: 0;
        }
        .landing-hero-section {
          padding-top: 0;
        }
        .landing-main > .landing-hero-section,
        .landing-main > section {
          margin-top: 0 !important;
        }
        .landing-hero-title {
          font-size: clamp(26px, 4.5vw, 48px);
          font-weight: 700;
          color: var(--landing-dark);
          line-height: 1.18;
          margin: 0 0 12px 0;
          font-family: 'Playfair Display', serif;
        }
        .landing-hero-accent {
          color: var(--landing-gold);
        }
        .landing-hero-subtitle {
          font-size: 15px;
          color: var(--landing-dark-soft);
          line-height: 1.65;
          margin: 0 0 8px 0;
          font-weight: 400;
        }
        .landing-hero-hint {
          font-size: 14px;
          color: var(--landing-ocean);
          font-weight: 600;
          margin: 0 0 20px 0;
        }
        .landing-hero-cta {
          background: #ffffff;
          color: var(--landing-dark);
          padding: 13px 38px;
          border-radius: 30px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
          font-family: 'DM Sans', sans-serif;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .landing-hero-cta:hover {
          transform: scale(1.04);
          box-shadow: 0 8px 36px rgba(0, 0, 0, 0.14);
        }
        .landing-trust-badges {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .landing-trust-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 400;
          color: var(--landing-dark-soft);
        }
        .landing-trust-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--landing-ocean);
          flex-shrink: 0;
        }
        .landing-assess-heading {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--landing-dark);
          line-height: 1.3;
          margin-bottom: 10px;
        }
        .landing-assess-heading em {
          font-style: italic;
          color: var(--landing-ocean);
        }
        .pro-grid {
                  display: grid;
                  grid-template-columns: repeat(4, minmax(0, 1fr));
                  gap: 18px;
                }
                .landing-pro-card {
                  background: rgba(255, 255, 255, 0.92);
                  border: 1px solid rgba(226, 232, 240, 0.95);
                  border-radius: 22px;
                  padding: 18px 16px;
                  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.07);
                  min-width: 0;
                }
                .assess-grid {
                  display: grid;
                  grid-template-columns: 1.25fr 0.75fr;
                  gap: 26px;
                  align-items: start;
                }
                .triple-grid {
                  display: grid;
                  grid-template-columns: repeat(3, minmax(0, 1fr));
                  gap: 16px;
                }
                .landing-feature-card {
                  min-width: 0;
                }
        .landing-gt-strip {
          background: transparent;
          padding: 10px 0;
          width: 100%;
          margin-top: 0;
        }
        .landing-gt-strip-inner {
          max-width: 1260px;
          margin: 0 auto;
          padding: 0 16px;
        }
        .landing-gt-strip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .landing-gt-strip-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .landing-gt-strip-title {
          font-size: 11px;
          font-weight: 800;
          color: var(--landing-dark);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .landing-gt-strip-badge {
          font-size: 8px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 8px;
          background: var(--landing-green);
          color: white;
          letter-spacing: 0.3px;
        }
        .landing-gt-strip-link {
          font-size: 10px;
          color: var(--landing-ocean);
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }
        .landing-gt-strip-link:hover {
          color: var(--landing-ocean-deep);
          text-decoration: underline;
        }
        .landing-gt-boxes {
          display: grid;
          gap: 12px;
        }
        .landing-gt-box-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 16px;
          font-size: 12px;
          color: var(--landing-gray);
        }
        .landing-gt-box-empty button {
          color: var(--landing-ocean);
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }
        .landing-gt-box {
          border-radius: 14px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .landing-gt-box:hover {
          transform: translateY(-3px);
        }
        .landing-gt-box-live {
          background: #fff7ed;
          border: 1.5px solid #fed7aa;
          box-shadow: 0 4px 20px rgba(249, 115, 22, 0.08);
        }
        .landing-gt-box-soon {
          background: #eff6ff;
          border: 1.5px solid #bfdbfe;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
        }
        .landing-gt-box-upcoming {
          background: #fefce8;
          border: 1.5px solid #fef08a;
          box-shadow: 0 4px 20px rgba(202, 138, 4, 0.08);
        }
        .landing-gt-box-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
          gap: 8px;
        }
        .landing-gt-box-theme {
          font-size: 13px;
          font-weight: 700;
          color: var(--landing-dark);
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .landing-gt-emoji {
          font-size: 17px;
          flex-shrink: 0;
        }
        .landing-gt-status {
          font-size: 8.5px;
          font-weight: 800;
          padding: 3.5px 10px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .landing-gt-status-live {
          background: #f97316;
          color: white;
        }
        .landing-gt-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: white;
          animation: landingLiveDot 1s ease infinite;
        }
        @keyframes landingLiveDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .landing-gt-status-soon {
          background: #2563eb;
          color: white;
        }
        .landing-gt-status-upcoming {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .landing-gt-box-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .landing-gt-box-meta span {
          font-size: 10.5px;
          color: var(--landing-gray);
        }
        .landing-gt-box-seats {
          font-size: 9px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 6px;
        }
        .landing-gt-box-seats-hot {
          color: #e11d48;
        }
        .landing-gt-box-seats-muted {
          font-size: 9px;
          font-weight: 600;
          color: var(--landing-gray);
          margin-bottom: 6px;
        }
        .landing-gt-seats-bar {
          width: 54px;
          height: 3px;
          border-radius: 2px;
          background: rgba(0, 0, 0, 0.08);
          overflow: hidden;
          display: inline-block;
          vertical-align: middle;
        }
        .landing-gt-seats-fill {
          display: block;
          height: 100%;
          border-radius: 2px;
        }
        .landing-gt-box-btn {
          width: 100%;
          padding: 8px;
          border: none;
          border-radius: 10px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.2px;
        }
        .landing-gt-box-btn-live {
          background: #ea580c;
          color: white;
        }
        .landing-gt-box-btn-soon {
          background: #2563eb;
          color: white;
        }
        .landing-gt-box-btn-upcoming {
          background: #ca8a04;
          color: white;
        }
        .landing-group-section {
          width: 100%;
        }
        .landing-group-zone {
          max-width: 1260px;
          margin: 0 auto;
          padding: 0 16px 8px;
        }
        .landing-group-zone-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .landing-group-zone-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--landing-dark);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .landing-group-zone-count {
          font-size: 11px;
          font-weight: 600;
          color: #ef4444;
          background: #fee2e2;
          padding: 3px 10px;
          border-radius: 10px;
        }
        .landing-group-zone-grid {
          max-width: 1260px;
          margin: 0 auto;
          padding: 0 16px;
        }
        .landing-group-glow-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
          padding: 14px 0 0;
        }
        @keyframes landingGlowPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.15); }
          50% { box-shadow: 0 0 28px rgba(239, 68, 68, 0.35); }
        }
        .landing-group-glow-box {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid #fecaca;
          transition: all 0.3s;
          min-width: 0;
        }
        .landing-group-glow-box-live {
          animation: landingGlowPulse 2.5s ease infinite;
          border-color: #ef4444;
        }
        .landing-group-glow-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .landing-gg-header {
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border-bottom: 1px solid #fee2e2;
        }
        .landing-gg-topic {
          font-size: 13px;
          font-weight: 700;
          color: var(--landing-dark);
          line-height: 1.3;
        }
        .landing-gg-live-dot {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #ef4444;
          white-space: nowrap;
        }
        .landing-gg-live-dot::before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: landingLiveDot 1.5s ease infinite;
        }
        .landing-gg-upcoming-dot {
          font-size: 10px;
          font-weight: 600;
          color: #f59e0b;
          background: #fef3c7;
          padding: 2px 8px;
          border-radius: 8px;
          white-space: nowrap;
        }
        .landing-gg-body {
          padding: 12px 14px;
        }
        .landing-gg-therapist {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .landing-gg-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e0f4f7, #b2ebf2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .landing-gg-tname {
          font-size: 11px;
          font-weight: 600;
          color: #2d3748;
        }
        .landing-gg-tcred {
          font-size: 9px;
          color: #718096;
        }
        .landing-gg-details {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 10px;
          color: #718096;
          flex-wrap: wrap;
        }
        .landing-gg-seats {
          margin-bottom: 10px;
        }
        .landing-gg-seats-label {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-bottom: 3px;
        }
        .landing-gg-seats-left {
          color: #ef4444;
          font-weight: 700;
        }
        .landing-gg-seats-total {
          color: #a0aec0;
        }
        .landing-gg-seats-bar {
          height: 4px;
          background: #fee2e2;
          border-radius: 2px;
          overflow: hidden;
        }
        .landing-gg-seats-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444, #f97316);
          border-radius: 2px;
        }
        .landing-gg-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .landing-gg-price {
          font-size: 14px;
          font-weight: 800;
          color: #1a2332;
        }
        .landing-gg-price-was {
          font-size: 10px;
          color: #a0aec0;
          text-decoration: line-through;
          margin-right: 4px;
        }
        .landing-gg-price-per {
          font-size: 10px;
          font-weight: 500;
          color: #718096;
        }
        .landing-gg-join-btn {
          padding: 7px 16px;
          border-radius: 10px;
          border: none;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          color: white;
          white-space: nowrap;
        }
        .landing-gg-join-btn-live {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        .landing-gg-join-btn-upcoming {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        .landing-gg-social-proof {
          padding: 8px 14px;
          background: #fff5f5;
          border-top: 1px solid #fee2e2;
          font-size: 9.5px;
          color: #e53e3e;
          font-weight: 600;
          line-height: 1.45;
        }
        @media (max-width: 980px) {
          .landing-page-root {
            background-attachment: scroll !important;
            --landing-section-gap: 48px;
            --landing-logo-size: 48px;
          }
          .landing-hero-section {
            padding: 16px 14px 0 14px !important;
          }
                  .landing-hero-title {
                    font-size: clamp(26px, 4.5vw, 48px) !important;
                    line-height: 1.18 !important;
                  }
                  .landing-pros-section {
                    padding-top: 28px !important;
                  }
                  .landing-assess-card {
                    padding: 22px 16px !important;
                    border-radius: 20px !important;
                  }
                  .landing-assess-heading {
                    font-size: clamp(24px, 6.5vw, 32px) !important;
                  }
                  .landing-assess-section [role="button"] {
                    flex-wrap: wrap;
                  }
                  .landing-assess-section [role="button"] > div:last-child {
                    white-space: normal;
                  }
                  .pro-grid,
                  .triple-grid,
                  .landing-gt-boxes,
                  .assess-grid {
                    grid-template-columns: 1fr !important;
                    gap: 16px;
                  }
                  .landing-pro-card,
                  .landing-feature-card,
                  .landing-group-glow-box {
                    width: 100%;
                  }
                  .landing-pro-card {
                    text-align: center;
                  }
                  .landing-pro-card button {
                    width: 100%;
                    max-width: 280px;
                  }
                  .landing-feature-card br {
                    display: none;
                  }
                  .landing-feature-card > div:nth-child(2) {
                    font-size: clamp(20px, 5.5vw, 24px) !important;
                  }
                  .landing-pet-grid > div {
                    flex: 1 1 calc(50% - 10px);
                    min-width: 0;
                  }
                  .landing-group-zone-title {
                    font-size: clamp(14px, 4vw, 15px);
                  }
                  .landing-gg-price-row {
                    flex-direction: column;
                    align-items: stretch;
                  }
                  .landing-gg-join-btn {
                    width: 100%;
                  }
        }
        @media (max-width: 600px) {
                  .landing-hero-title br {
                    display: none;
                  }
                  .landing-hero-section p br {
                    display: none;
                  }
                  .landing-page-root {
                    --landing-section-gap: 40px;
                  }
                  .landing-main {
                    padding-bottom: 72px;
                  }
                  .landing-pet-grid > div {
                    flex: 1 1 100%;
                  }
                }
      `}</style>
    </div>
  );
};

export default LandingPage;
