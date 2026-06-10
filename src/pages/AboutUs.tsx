import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';

const PILLARS = [
  {
    icon: '🧠',
    title: 'Clinical Therapy',
    description:
      'Licensed psychologists and psychiatrists deliver evidence-based therapy (CBT, DBT, ACT, Psychodynamic) via audio and in-person sessions. Every provider is NMC/RCI verified.',
  },
  {
    icon: '🌐',
    title: 'Five Languages',
    description:
      'Hindi, English, Tamil, Telugu, and Kannada — because healing happens best in the language you feel in. Powered by Bhashini multilingual APIs.',
  },
  {
    icon: '📊',
    title: 'Clinical Assessments',
    description:
      'PHQ-9 and GAD-7 validated screening tools help match patients with the right provider at the right intensity. Track progress over time with visual outcome trends.',
  },
  {
    icon: '🤖',
    title: 'AnytimeBuddy',
    description:
      "An AI wellness companion available 24/7 for when it's 2 AM and you just need someone to listen. Not a replacement for therapy — a bridge to it.",
  },
  {
    icon: '🏥',
    title: 'MyDigitalClinic',
    description:
      'A practice management tool for therapists who want to digitize their existing clinic — patient records, session notes, prescriptions, scheduling — all DPDPA compliant.',
  },
  {
    icon: '📞',
    title: 'Voice-First Access',
    description:
      'IVR-based mental health screening and support via phone call — because not everyone has a smartphone, but everyone deserves access to care.',
  },
];

const STATS = [
  { num: '5', label: 'Indian languages\nsupported' },
  { num: '₹99', label: 'Platform access\nper month' },
  { num: '24/7', label: 'AnytimeBuddy\nAI companion' },
  { num: '0 km', label: 'Distance to\nyour therapist' },
];

const VALUES = [
  'Therapist-Owned Data',
  'Patient Privacy First',
  'Culturally Authentic Care',
  'Clinical Rigor',
  'Affordability Without Compromise',
  'Language Is a Right, Not a Feature',
  'Technology as Bridge, Not Replacement',
  'Transparency in Everything',
];

const COMPLIANCE_ITEMS = [
  'DPDPA 2023 fully compliant',
  'AES-256 encryption at rest',
  'TLS 1.3 encryption in transit',
  'AWS Mumbai (ap-south-1) data residency',
  '24-hour session data auto-purge option',
  'DPDPA consent architecture throughout',
  'Complete audit trail for all data access',
  'Right to erasure and data portability',
  'No AI training on patient data',
  'Bengaluru courts — exclusive legal jurisdiction',
];

function SectionDivider() {
  return (
    <div className="section-divider">
      <hr />
    </div>
  );
}

export default function AboutUsPage() {
  useEffect(() => {
    document.title = "About — MANAS360 | Bharat's Mental Wellness Ecosystem";
  }, []);

  return (
    <div className="about-us-page">
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">About MANAS360</div>
          <h1>
            From Episodic Care
            <br />
            to <em>Transformational Wellness</em>
          </h1>
          <p className="hero-sub">
            MANAS360 is Bharat&apos;s digital mental wellness ecosystem — connecting patients with
            verified mental health professionals across languages, geographies, and income levels.
            Built in India, for India.
          </p>
        </div>
      </div>

      <div className="section">
        <h2>
          The Gap We&apos;re <span className="accent">Closing</span>
        </h2>
        <p className="lead">
          India has 0.75 psychiatrists per 100,000 people. The global average is 13. Over 150
          million Indians need mental health support — fewer than 30 million have access to it.
        </p>
        <p>
          The problem isn&apos;t just shortage. It&apos;s silence. It&apos;s the mother who calls her
          sleeplessness &quot;normal.&quot; The engineer who calls his panic attacks &quot;just
          stress.&quot; The student who thinks asking for help means weakness. For decades, mental
          health in India has been episodic — you go to a doctor when you&apos;re in crisis, get a
          prescription, and disappear until the next crisis.
        </p>
        <p>
          MANAS360 exists to change that. We believe mental health care should be sustained,
          accessible, culturally respectful, and available in the language you think in — not just the
          language of medical textbooks.
        </p>
      </div>

      <SectionDivider />

      <div className="section">
        <h2>
          What <span className="accent">MANAS360</span> Does
        </h2>
        <p>
          We are a technology aggregator platform — not a healthcare provider. We connect patients
          seeking mental wellness support with verified, licensed professionals (psychologists,
          psychiatrists, therapists, NLP coaches, and executive coaches) through a secure,
          DPDPA-compliant digital infrastructure.
        </p>

        <div className="pillars-grid">
          {PILLARS.map((pillar) => (
            <div className="pillar-card" key={pillar.title}>
              <span className="pillar-icon">{pillar.icon}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat-strip-inner">
          {STATS.map((stat) => (
            <div className="stat-item" key={stat.num}>
              <span className="stat-num">{stat.num}</span>
              <span className="stat-label">
                {stat.label.split('\n').map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>
          Why <span className="accent">&quot;MANAS&quot;</span>
        </h2>
        <p>
          In Sanskrit, <strong>Manas</strong> (मनस्) means mind — the seat of thought, emotion, and
          consciousness. It represents the faculty through which we perceive the world and make
          meaning of our experience. The &quot;360&quot; reflects our conviction that mental wellness
          isn&apos;t a single intervention. It&apos;s a complete circle — prevention, early
          screening, professional therapy, sustained support, and relapse prevention.
        </p>

        <div className="quote-block">
          <p>
            &quot;We&apos;re not building a therapy marketplace. We&apos;re building the
            infrastructure for a country of 1.4 billion people to finally treat mental health with the
            same seriousness as physical health — in their language, at their price point, on their
            phone.&quot;
          </p>
          <span className="attribution">— MANAS360 Founding Team</span>
        </div>
      </div>

      <SectionDivider />

      <div className="section">
        <h2>
          From Episodic to <span className="accent">Transformational</span>
        </h2>
        <p className="lead">
          Most mental health platforms stop at connecting you with a therapist. We believe that&apos;s
          only the beginning.
        </p>
        <p>
          MANAS360 is designed around the full continuum of care: screening and early detection
          through clinically validated tools, matching with verified providers who speak your language
          and understand your context, sustained therapeutic engagement through session tracking and
          homework, AI-assisted support between sessions through AnytimeBuddy, and long-term progress
          monitoring to prevent relapse.
        </p>
        <p>
          We differentiate from crisis-response services like Tele MANAS (which do critical,
          life-saving work) by focusing on what comes after the crisis — the sustained journey from
          surviving to thriving. Not episodic intervention, but transformational wellness.
        </p>
      </div>

      <SectionDivider />

      <div className="section">
        <h2>
          What We <span className="accent">Stand For</span>
        </h2>
        <p>
          Every decision at MANAS360 — from our pricing to our data architecture to our language
          support — is guided by a simple question:{' '}
          <em>
            does this make mental health care more accessible, more trustworthy, and more effective for
            the people who need it most?
          </em>
        </p>

        <div className="values-row">
          {VALUES.map((value) => (
            <span className="value-tag" key={value}>
              {value}
            </span>
          ))}
        </div>
      </div>

      <SectionDivider />

      <div className="section">
        <h2>
          Trust & <span className="accent">Compliance</span>
        </h2>
        <p>
          MANAS360 operates as a technology aggregator — not a healthcare provider. We do not store
          patient personal health information directly. All clinical data is encrypted,
          therapist-owned, and governed by the Digital Personal Data Protection Act (DPDPA) 2023. Our
          infrastructure is built for Indian data residency requirements.
        </p>

        <div className="compliance-section">
          <h3>Our Compliance Framework</h3>
          <div className="compliance-grid">
            {COMPLIANCE_ITEMS.map((item) => (
              <div className="compliance-item" key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionDivider />

      <div className="section">
        <h2>
          Built in <span className="accent">Bharat</span>, for Bharat
        </h2>
        <p>
          MANAS360 is headquartered in Bengaluru with roots in Dharwad, Karnataka. We are a small,
          focused team building technology infrastructure that we believe India&apos;s mental health
          ecosystem urgently needs. Our Clinical Advisory Board is chaired by Dr. Sindhuja, ensuring
          every clinical decision on the platform meets the highest professional standards.
        </p>
        <p>
          We work with verified providers across India&apos;s mental health spectrum — psychiatrists
          registered with the National Medical Commission (NMC), clinical psychologists with RCI
          credentials, licensed therapists, NLP practitioners, and executive coaches. Each provider is
          independently verified before appearing on the platform.
        </p>
        <p>
          Our payment infrastructure runs exclusively on PhonePe in Indian Rupees. Our authentication
          uses Phone + OTP (no email required). Our IVR system works on 2G networks. Every design
          choice reflects a single intent: this platform is built for India&apos;s reality, not
          borrowed from the West.
        </p>
      </div>

      <div className="footer-cta">
        <h2>The journey begins with one step.</h2>
        <p>
          A 2-minute screening. In your language. On your phone. No email needed. No judgment. Just
          the first step toward achha hoon main.
        </p>
        <Link to="/assessment" className="cta-btn">
          Start Your Free Screening →
        </Link>
      </div>
    </div>
  );
}
