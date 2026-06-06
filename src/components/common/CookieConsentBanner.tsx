import { useCallback, useEffect, useState } from 'react';
import './CookieConsentBanner.css';

const CONSENT_KEY = 'manas360_cookie_consent';
const TIMESTAMP_KEY = 'manas360_cookie_consent_ts';
const LEGACY_CONSENT_KEY = 'manas360_cookie_consent_v1';

function readConsent(): string | null {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) return stored;
    const legacy = localStorage.getItem(LEGACY_CONSENT_KEY);
    if (legacy === 'accepted' || legacy === 'rejected') {
      localStorage.setItem(CONSENT_KEY, legacy);
      localStorage.removeItem(LEGACY_CONSENT_KEY);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

function fireAnalytics() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'cookie_consent_accepted' });
}

function blockNonEssential() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'cookie_consent_declined' });
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export default function CookieConsentBanner() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [manageVisible, setManageVisible] = useState(false);

  const applyExistingConsent = useCallback((decision: string) => {
    setBannerVisible(false);
    setManageVisible(true);
    if (decision === 'accepted') fireAnalytics();
  }, []);

  useEffect(() => {
    const existing = readConsent();
    if (existing === 'accepted' || existing === 'rejected') {
      applyExistingConsent(existing);
    } else {
      const t = window.setTimeout(() => {
        setBannerVisible(true);
      }, 1500);
      return () => window.clearTimeout(t);
    }
  }, [applyExistingConsent]);

  const saveConsent = (decision: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(CONSENT_KEY, decision);
      localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
    } catch {
      // ignore storage errors
    }
    setBannerVisible(false);
    setManageVisible(true);
    if (decision === 'accepted') fireAnalytics();
    else blockNonEssential();
  };

  const reopenBanner = () => {
    try {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(TIMESTAMP_KEY);
    } catch {
      // ignore
    }
    setBannerVisible(true);
    setManageVisible(false);
  };

  return (
    <>
      <div
        id="manas-cookie-banner"
        className={bannerVisible ? undefined : 'hidden'}
        role="dialog"
        aria-label="Cookie consent"
        aria-live="polite"
      >
        <div className="mcb-inner">
          <div className="mcb-accent" />

          <div className="mcb-body">
            <div className="mcb-header">
              <span className="mcb-logo">
                MANAS<em>360</em>
              </span>
              <span className="mcb-badge">DPDPA 2023 Compliant</span>
            </div>

            <div className="mcb-title">We use cookies to improve your experience</div>

            <p className="mcb-text">
              When you visit MANAS360, we place small files called cookies on your device. These help us
              remember your preferences, understand how you use the platform, and show content that is
              relevant to you. <strong>We do not sell your data.</strong> You can accept or decline — your
              choice will not affect your ability to use the site.
            </p>

            <div className="mcb-types">
              <div className="mcb-type essential">
                <span className="mcb-type-dot" />
                <span>
                  <strong>Essential</strong> — login &amp; security (always on)
                </span>
              </div>
              <div className="mcb-type analytics">
                <span className="mcb-type-dot" />
                <span>Analytics — how pages are used (GA4)</span>
              </div>
              <div className="mcb-type functional">
                <span className="mcb-type-dot" />
                <span>Functional — language &amp; preferences</span>
              </div>
            </div>
          </div>

          <div className="mcb-footer">
            <div className="mcb-legal">
              Under India&apos;s <strong>DPDPA 2023</strong>, you can withdraw consent at any time via the
              &quot;Manage cookies&quot; link below. Essential cookies cannot be turned off as they are needed
              for the platform to work.
            </div>
            <div className="mcb-actions">
              <button
                type="button"
                className="mcb-btn mcb-btn-reject"
                id="mcb-reject"
                onClick={() => saveConsent('rejected')}
              >
                Decline
              </button>
              <button
                type="button"
                className="mcb-btn mcb-btn-accept"
                id="mcb-accept"
                onClick={() => saveConsent('accepted')}
              >
                Accept cookies
              </button>
            </div>
          </div>

          <div className="mcb-dpdpa">
            Compliant with Digital Personal Data Protection Act 2023 · Data stored on AWS Mumbai
            (ap-south-1) · Bengaluru jurisdiction
          </div>
        </div>
      </div>

      {manageVisible && (
        <button
          type="button"
          id="manas-cookie-manage-link"
          aria-label="Manage cookie preferences"
          onClick={reopenBanner}
        >
          🍪 Manage cookies
        </button>
      )}
    </>
  );
}
