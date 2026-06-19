import { useCallback, useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { homeSections, getJourney } from './howItWorksData';
import type {
  HomeCard,
  JourneyBlock,
  JourneyContent,
  JourneyId,
  StepItem,
} from './howItWorksTypes';
import './HowItWorksPage.css';

function RichText({ content, className }: { content: ReactNode; className?: string }) {
  if (typeof content === 'string') {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return <span className={className}>{content}</span>;
}

function StepDescription({ content }: { content: ReactNode }) {
  if (typeof content === 'string') {
    return (
      <div
        className="step-description"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return <div className="step-description">{content}</div>;
}

function FlowSteps({ steps, startIndex = 0 }: { steps: StepItem[]; startIndex?: number }) {
  return (
    <>
      {steps.map((step, index) => (
        <div className="flow-step" key={`${step.number ?? index}-${step.title}`}>
          <div className="step-number">{step.number ?? startIndex + index + 1}</div>
          <div className="step-title">{step.title}</div>
          <StepDescription content={step.description} />
          <span className="step-action">✓ {step.action}</span>
        </div>
      ))}
    </>
  );
}

function PricingTable({ rows }: { rows: JourneyBlock & { kind: 'pricing' } }) {
  return (
    <div className="pricing-table">
      {rows.rows.map((row, rowIndex) => (
        <div className="pricing-row" key={rowIndex}>
          {row.cells.map((cell) => (
            <div key={cell.label}>
              <div className="pricing-label">{cell.label}</div>
              <div className="pricing-value">{cell.value}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function JourneyBlocks({ blocks }: { blocks: JourneyBlock[] }) {
  return (
    <>
      {blocks.map((block, blockIndex) => {
        if (block.kind === 'pricing') {
          return <PricingTable key={`pricing-${blockIndex}`} rows={block} />;
        }

        if (block.kind === 'phase') {
          return (
            <div key={`phase-${blockIndex}`}>
              <div className={`phase-box ${block.variant}`}>
                <h4>{block.title}</h4>
                <p>{block.subtitle}</p>
              </div>
              <div className="journey-flow flush-top">
                <FlowSteps steps={block.steps} />
              </div>
            </div>
          );
        }

        return (
          <div className="journey-flow" key={`steps-${blockIndex}`}>
            <FlowSteps steps={block.steps} />
          </div>
        );
      })}
    </>
  );
}

function HomeCardBadge({ card }: { card: HomeCard }) {
  if (!card.badge) return null;
  if (card.badgeType === 'freebie') {
    return <div className="freebie-badge">{card.badge}</div>;
  }
  if (card.badgeType === 'analytics') {
    return <div className="analytics-badge">{card.badge}</div>;
  }
  return <div className="feature-badge">{card.badge}</div>;
}

const HowItWorksPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<JourneyId>('home');

  const showJourney = useCallback((id: JourneyId) => {
    setActiveSection(id);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  useEffect(() => {
    document.title = 'MANAS360 — Interactive Demo · All Journeys';
  }, []);

  const handleCardKeyDown = (id: JourneyId) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showJourney(id);
    }
  };

  const renderJourneySection = (journey: JourneyContent) => (
    <section className="journey-section">
      <div className="journey-header">
        <h2>{journey.heading}</h2>
        <p>{journey.description}</p>
        {journey.stats.length > 0 ? (
          <div className="journey-stats">
            {journey.stats.map((stat) => (
              <div className="stat" key={`${stat.icon}-${String(stat.text).slice(0, 24)}`}>
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-text">
                  <RichText content={stat.text} />
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {journey.blocks.length > 0 ? <JourneyBlocks blocks={journey.blocks} /> : null}

      {journey.tipTitle ? (
        <div className="tips-box">
          <h4>{journey.tipTitle}</h4>
          <p>
            <RichText content={journey.tipText} />
          </p>
        </div>
      ) : null}

      <div className="nav-buttons">
        {journey.next ? (
          <button
            className="btn btn-outline"
            onClick={() => showJourney(journey.next!.id)}
            type="button"
          >
            {journey.next.label}
          </button>
        ) : null}
      </div>
    </section>
  );

  const activeJourney = activeSection === 'home' ? null : getJourney(activeSection);

  return (
    <div className="how-it-works-page" style={{ position: 'relative' }}>

      <div className="container !pt-[72px] md:!pt-[80px]">


        {activeSection === 'home' ? (
          <section className="journey-section">
            <div className="hero">
              <span className="hero-sub">Interactive Demo</span>
              <h1>
                Explore MANAS360
                <br />
                <span className="accent">All User Journeys</span>
              </h1>
              <p>
                No login required. Click any journey below to experience complete user pathways with
                fees, flows, and outcomes. Navigate freely and discover your perfect entry point.
              </p>
              <p className="hero-tip">
                💡 Tip: Start with freebies (top), explore core pathways (middle), try cool features
                (bottom), or dive into AI-powered analytics.
              </p>
            </div>

            {homeSections.map((section) => (
              <div className="journey-section-grid" key={section.title}>
                <div className="section-title">{section.title}</div>
                <div className="section-subtitle">{section.subtitle}</div>
                <div className={`role-grid ${section.gridClass}`}>
                  {section.cards.map((card) => (
                    <div
                      className={`role-card${card.featureCard ? ' feature-card' : ''}`}
                      key={card.id}
                      onClick={() => showJourney(card.id)}
                      onKeyDown={handleCardKeyDown(card.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <HomeCardBadge card={card} />
                      <span className="role-icon">{card.icon}</span>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                      <span className="cta">{card.cta}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : activeJourney ? (
          renderJourneySection(activeJourney)
        ) : null}
      </div>

      <div className="w-full flex justify-start pb-6 pt-0 -mt-4 md:-mt-12 relative z-10">
        <div className="flex items-center gap-2 ml-4 md:ml-[80px]">
          {activeSection !== 'home' && (
            <button
              onClick={() => setActiveSection('home')}
              className="inline-flex items-center gap-1 md:gap-1.5 bg-white border border-[#D5DEE9] rounded-full cursor-pointer font-bold text-[#0B2D5E] shadow-sm text-[11px] md:text-[13px] px-2.5 py-1.5 md:px-3.5 md:py-2 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Go Back
            </button>
          )}
          <button
            onClick={() => navigate('/landing')}
            className="inline-flex items-center gap-1 md:gap-1.5 bg-white border border-[#D5DEE9] rounded-full cursor-pointer font-bold text-[#0B2D5E] shadow-sm text-[11px] md:text-[13px] px-2.5 py-1.5 md:px-3.5 md:py-2 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
