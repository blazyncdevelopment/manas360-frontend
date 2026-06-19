import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./AiPowerHubLandingPage.css";

type HubCard = {
  icon: string;
  title: string;
  description: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
};

const hubCards: HubCard[] = [
  {
    icon: "🧠",
    title: "AnytimeBuddy AI",
    description: "Your personal AI companion. Guidance, coping strategies, and emotional support - powered by Claude.",
    badge: "AI",
    badgeBg: "#eae2ff",
    badgeColor: "#6d28d9"
  },
  {
    icon: "🫂",
    title: "AnytimeBuddy Chat",
    description: "24/7 text-based companion. Talk about anything, anytime. 3 free conversations every day.",
    badge: "24/7",
    badgeBg: "#e6e0ff",
    badgeColor: "#7c3aed"
  },
  {
    icon: "💭",
    title: "Vent Buddy",
    description: "A safe, judgment-free space to express your feelings. Just vent - no advice unless you ask.",
    badge: "Soon",
    badgeBg: "#edf1f6",
    badgeColor: "#4b5563"
  },
  {
    icon: "📝",
    title: "AI Session Notes",
    description: "Claude-powered clinical summaries for therapists. SOAP, CBT, and trauma templates. Save hours per week.",
    badge: "Pro",
    badgeBg: "#f8ecdb",
    badgeColor: "#d97706"
  }
];

const AiPowerHubLandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <main className="ai-hub-page" style={{ position: 'relative' }}>

      {/* <header className="ai-hub-header">
        <div className="ai-hub-container ai-hub-header-inner">
          <div className="ai-hub-logo">
            MANAS<span>360</span>
          </div>
          <button type="button" className="ai-hub-back" onClick={() => navigate("/")}>
            ← Back to Home
          </button>
        </div>
      </header> */}

      <section className="ai-hub-hero">
        <div className="ai-hub-container">
          <div className="ai-hub-bot" aria-hidden>
            🤖
          </div>
          <h1>AI Power Hub</h1>
          <p>AI-driven wellness tools - available 24/7, no appointment needed. Your personal AI companion for mental wellness.</p>
          <button type="button" className="ai-hub-primary" onClick={() => navigate("/login")}>
            Chat with AnytimeBuddy →
          </button>
        </div>
      </section>

      <section className="ai-hub-container ai-hub-grid" aria-label="AI tools for support">
        {hubCards.map((card) => (
          <article key={card.title} className="ai-hub-card">
            <div className="ai-hub-icon" aria-hidden>
              {card.icon}
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            {card.badge && (
              <span
                className="ai-hub-pill"
                style={{
                  background: card.badgeBg,
                  color: card.badgeColor
                }}
              >
                {card.badge}
              </span>
            )}
          </article>
        ))}
      </section>

      <section className="ai-hub-container ai-hub-cta">
        <h2>Your AI Companion Awaits</h2>
        <p>3 free conversations every day. No signup. No judgment. Just support.</p>
        <button type="button" onClick={() => navigate("/login")}>Start Chatting Free →</button>
      </section>

      {/* <footer className="ai-hub-footer">
        <div className="ai-hub-footer-logo">
          MANAS<span>360</span>
        </div>
        <p className="ai-hub-footer-tagline">From Episodic to Transformational</p>

        <div className="ai-hub-footer-links">
          <button type="button" onClick={() => navigate("/")}>Home</button>
          <span>·</span>
          <button type="button" onClick={() => navigate("/privacy")}>Privacy</button>
          <span>·</span>
          <button type="button" onClick={() => navigate("/terms")}>Terms</button>
          <span>·</span>
          <button type="button" onClick={() => navigate("/refunds")}>Refund</button>
          <span>·</span>
          <button type="button" onClick={() => navigate("/")}>Contact</button>
        </div>

        <p className="ai-hub-footer-copy">
          MANAS360 Mental Wellness Pvt. Ltd. - Bengaluru, Karnataka, India
          <br />
          © 2026 All rights reserved. MANAS360 is a technology aggregator, not a healthcare provider.
          <br />
          Crisis? Call KIRAN: 1800-599-0019 (24/7, Free)
        </p>
      </footer> */}
      <div className="w-full flex justify-start pb-4 pt-4">
        <button
          onClick={() => navigate('/landing')}
          className="inline-flex items-center gap-1 md:gap-1.5 bg-white border border-[#D5DEE9] rounded-full cursor-pointer font-bold text-[#0B2D5E] shadow-sm text-[11px] md:text-[13px] px-2.5 py-1.5 md:px-3.5 md:py-2 hover:bg-slate-50 transition-colors ml-4 md:ml-[80px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Go to Home
        </button>
      </div>
    </main>
  );
};

export default AiPowerHubLandingPage;
