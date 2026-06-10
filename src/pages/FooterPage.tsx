
import React from "react";
import { useNavigate } from "react-router-dom";



const logo = "/AppIcon.jpeg";

export const landingFooterStyles = `
        .landing-footer {
          flex-shrink: 0;
          width: 100%;
          margin-top: auto;
          margin-bottom: 0;
          font-family: var(--sans, 'DM Sans', sans-serif);
          background: linear-gradient(180deg, #0B2D5E 0%, #06203F 100%);
          color: #ffffff;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr;
          gap: 28px;
          align-items: start;
        }

        .landing-footer .footer-title {
          font-family: var(--serif, 'Outfit', 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.01em;
          color: rgba(164, 168, 48, 0.95);
          margin-bottom: 10px;
        }

        .landing-footer .footer-link {
          font-size: 12px;
          opacity: 0.86;
          margin-bottom: 8px;
          font-weight: 700;
          display: block;
          border: none;
          background: transparent;
          color: inherit;
          padding: 0;
          cursor: pointer;
          text-align: left;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .landing-footer .footer-link:hover {
          opacity: 1;
          transform: translateY(-1px);
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(190, 224, 233, 0.6);
        }

        .landing-footer .footer-contact-link {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 8px;
          font-weight: 800;
          display: block;
          color: inherit;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .landing-footer .footer-contact-link:hover {
          opacity: 1;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(190, 224, 233, 0.6);
        }

        .landing-footer .footer-social-chip {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(255,255,255,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
          user-select: none;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
        }
        
        .landing-footer .footer-social-chip:hover {
          background: rgba(255,255,255,0.22);
          transform: translateY(-1px);
          opacity: 1;
        }

        .landing-footer-crisis {
          margin-top: 28px;
          max-width: 1120px;
          margin-left: auto;
          margin-right: auto;
          border: 0.5px solid rgba(248, 113, 113, 0.7);
          background-color: rgba(239, 68, 68, 0.1);
          background-image: linear-gradient(
            180deg,
            rgba(254, 202, 202, 0.12) 0%,
            rgba(239, 68, 68, 0.08) 100%
          );
          border-radius: 14px;
          padding: 14px 18px;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          color: rgba(255,255,255,0.92);
          box-shadow: 0 10px 28px rgba(239, 68, 68, 0.2);
          backdrop-filter: blur(14px);
        }

        .landing-footer-crisis .crisis-inner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          line-height: 1.4;
        }

        .landing-footer-crisis .crisis-badge {
          width: 15px;
          height: 13px;
          border-radius: 3px;
          background-color: #ff2f5b;
          box-shadow: 0 8px 16px rgba(255, 47, 91, 0.3);
          position: relative;
          flex: 0 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 6px;
          font-weight: 800;
          letter-spacing: 0.02em;
          line-height: 1;
          border: 1px solid rgba(255, 255, 255, 0.55);
        }

        .landing-footer-copy {
          margin-top: 18px;
          text-align: center;
          font-size: 11px;
          opacity: 0.75;
          font-weight: 700;
          line-height: 1.6;
        }

        @media (max-width: 980px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .landing-footer {
            padding: 36px 16px calc(88px + env(safe-area-inset-bottom, 0px)) 16px !important;
          }
          .footer-grid {
            gap: 22px !important;
          }
          .footer-grid > div {
            padding-bottom: 4px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .footer-grid > div:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .landing-footer-crisis {
            font-size: 11px !important;
            line-height: 1.55 !important;
            padding: 12px !important;
            text-align: left !important;
          }
          .landing-footer-copy {
            font-size: 10px !important;
            line-height: 1.65 !important;
            padding: 0 4px;
          }
        }
`;

export const FooterPage: React.FC = () => {
  const navigate = useNavigate();

  const footerQuickLinkRoutes: Record<string, string> = {
<<<<<<< HEAD
    "About Us": "/about",
    "How It Works": "/how-it-works",
    "Specialized Care": "/specialized-care",
    "For Providers": "/provider-landing",
=======
    "About Us": "/landing",
    "How It Works": "/how-it-works",
    "Specialized Care": "/specialized-care",
    "For Providers": "/my-digital-clinic",
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
    "NRI | Global Inc": "/nri-landing",
    Careers: "/landing",

  };

  const footerLegalRoutes: Record<string, string> = {
    "Privacy Policy": "/privacy",
    "Terms of Service": "/terms",
    "Cookie Policy": "/cookie-policy",
    "DPDPA Compliance": "/privacy",
    "Refund Policy": "/refunds",
    Disclaimer: "/legal/community-guidelines"
  };

  const handleFooterRoute = (routeMap: Record<string, string>, label: string) => {
    const path = routeMap[label];
    if (path) {
      navigate(path);
    }
  };

  return (
    <>
      <footer className="landing-footer" aria-label="Footer" style={{ padding: "54px 16px calc(18px + env(safe-area-inset-bottom, 0px)) 16px" }}>
        <div style={{ maxWidth: "1260px", margin: "0 auto" }}>
          <div className="footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "rgba(255,255,255,0.95)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={logo} alt="MANAS360" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, opacity: 0.9, lineHeight: 1.6 }}>Holistic Mental Wellness<br />Anytime, Anywhere</div>
              <div style={{ marginTop: "14px", fontSize: "11px", opacity: 0.75, fontWeight: 700, lineHeight: 1.7 }}>MANAS360 Mental Wellness Pvt. Ltd.<br />Bengaluru, Karnataka, India</div>
            </div>

            <div>
              <div className="footer-title">Quick Links</div>
              {["About Us", "How It Works", "Specialized Care", "For Providers", "NRI | Global Inc", "Careers",].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleFooterRoute(footerQuickLinkRoutes, t)}
                  className="footer-link"
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <div className="footer-title">Legal</div>
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "DPDPA Compliance", "Refund Policy", "Disclaimer"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleFooterRoute(footerLegalRoutes, t)}
                  className="footer-link"
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <div className="footer-title">Get in Touch</div>
              <a
                href="mailto:support@manas360.com"
                className="footer-contact-link"
              >
                &#9993; support@manas360.com
              </a>
              <a
                href="tel:+918867736009"
                className="footer-contact-link"
              >
                &#9742; +91-8867736009
              </a>
              <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "14px", fontWeight: 800 }}>&#128172; WhatsApp Support</div>
              <div style={{ display: "flex", gap: "10px", opacity: 0.85 }}>
                {[
                  { key: "wa", label: "wa", aria: "WhatsApp", href: "https://wa.me/919876543210" },
                  { key: "ig", label: "ig", aria: "Instagram", href: "https://instagram.com/manas360" },
                  { key: "in", label: "in", aria: "LinkedIn", href: "https://linkedin.com/company/manas360" },
                  { key: "x", label: "x", aria: "X (Twitter)", href: "https://x.com/manas360" }
                ].map((s) => (
                  <a
                    key={s.key}
                    className="footer-social-chip"
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.aria}
                    title={s.aria}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="landing-footer-crisis">
            <span className="crisis-inner">
              <span className="crisis-badge" aria-hidden="true">SOS</span>
              <span>
                In Crisis? Call KIRAN: 1800-599-0019 (24/7, Free) &middot; iCall: 9152987821 &middot; Vandrevala: 1860-2662-345
              </span>
            </span>
          </div>

          <div className="landing-footer-copy">
            &copy; 2026 MANAS360 Mental Wellness Pvt. Ltd. All rights reserved &middot; Bengaluru, Karnataka, India
            <br />
            MANAS360 is a technology aggregator platform.
          </div>
        </div>
      </footer>
      <style>{`${landingFooterStyles}`}</style>



    </>
  );
};

export default FooterPage;
