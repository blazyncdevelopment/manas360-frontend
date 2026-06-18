import { useEffect } from 'react';
import './ContactUs.css';

export default function ContactUsPage() {
    useEffect(() => {
        document.title = "Contact Us — MANAS360 Mental Wellness Pvt. Ltd.";
    }, []);

    return (
        <div className="contact-us-page">
            {/* ===== HERO ===== */}
            <div className="hero">
                <div className="hero-inner">
                    <div className="hero-eyebrow">Contact MANAS360</div>
                    <h1>We&apos;re here. <em>Anytime.</em></h1>
                    <p className="hero-sub">
                        Whether you&apos;re a patient seeking support, a therapist exploring partnership, or a company looking for employee wellness — reach out. We respond within 24 hours.
                    </p>
                </div>
            </div>

            {/* ===== MAIN ===== */}
            <div className="main">

                {/* CONTACT CARDS */}
                <div className="contact-grid">

                    {/* REGISTERED OFFICE */}
                    <div className="contact-card">
                        <div className="card-icon sage">🏢</div>
                        <h3>Registered Office</h3>
                        <div className="card-sub">MANAS360 Mental Wellness Pvt. Ltd.</div>
                        <div className="contact-item">
                            <span className="ci-icon">📍</span>
                            <div>
                                6, MLV, Talaghatpura,<br />
                                Kanakapura Road,<br />
                                Bengaluru 560062,<br />
                                Karnataka, India
                            </div>
                        </div>
                        <div className="contact-item">
                            <span className="ci-icon">📞</span>
                            <div>
                                <span className="ci-label">STD Code</span>
                                P: 91-80
                            </div>
                        </div>
                    </div>

                    {/* PHONE & WHATSAPP */}
                    <div className="contact-card">
                        <div className="card-icon clay">📱</div>
                        <h3>Call & WhatsApp</h3>
                        <div className="card-sub">Mon–Sat · 9 AM – 9 PM IST</div>
                        <div className="contact-item">
                            <span className="ci-icon">💬</span>
                            <div>
                                <span className="ci-label">WhatsApp</span>
                                <a href="https://wa.me/918951927280" target="_blank" rel="noreferrer">+91-89519 27280</a>
                            </div>
                        </div>
                        <div className="contact-item">
                            <span className="ci-icon">📞</span>
                            <div>
                                <a href="tel:+918951927280">+91-89519 27280</a>
                            </div>
                        </div>
                        <div className="contact-item">
                            <span className="ci-icon">🌐</span>
                            <div>
                                <span className="ci-label">Website</span>
                                <a href="https://manas360.com" target="_blank" rel="noreferrer">MANAS360.com</a>
                            </div>
                        </div>
                    </div>

                    {/* EMAIL DEPARTMENTS (Full Width) */}
                    <div className="contact-card full-width">
                        <div className="card-icon blue">📧</div>
                        <h3>Email Us</h3>
                        <div className="card-sub">Reach the right team directly — we respond within 24 hours</div>

                        <div className="dept-grid">
                            <div className="dept-chip">
                                <div className="dept-name">General Enquiries</div>
                                <div className="dept-email"><a href="mailto:info@manas360.com">info@manas360.com</a></div>
                            </div>
                            <div className="dept-chip">
                                <div className="dept-name">Sales & Partnerships</div>
                                <div className="dept-email"><a href="mailto:info@manas360.com">info@manas360.com</a></div>
                            </div>
                            <div className="dept-chip">
                                <div className="dept-name">Services & Support</div>
                                <div className="dept-email"><a href="mailto:info@manas360.com">info@manas360.com</a></div>
                            </div>
                            <div className="dept-chip">
                                <div className="dept-name">Media & Press</div>
                                <div className="dept-email"><a href="mailto:info@manas360.com">info@manas360.com</a></div>
                            </div>
                            <div className="dept-chip">
                                <div className="dept-name">Legal & Compliance</div>
                                <div className="dept-email"><a href="mailto:legal@manas360.com">legal@manas360.com</a></div>
                            </div>
                            <div className="dept-chip">
                                <div className="dept-name">Careers</div>
                                <div className="dept-email"><a href="mailto:careers@manas360.com">careers@manas360.com</a></div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* MAP */}
                <div className="map-section">
                    <a href="https://maps.google.com/?q=6+MLV+Talaghatpura+Kanakapura+Road+Bengaluru+560062" target="_blank" rel="noreferrer">
                        <span className="map-pin">📍</span>
                        <div className="map-text">View on Google Maps</div>
                        <div className="map-sub">6, MLV, Talaghatpura, Kanakapura Road, Bengaluru 560062</div>
                    </a>
                </div>

                {/* SOCIAL MEDIA */}
                <div className="social-section">
                    <h3>Connect With Us</h3>
                    <div className="social-handle">@manas360</div>

                    <div className="social-icons">
                        <a href="https://wa.me/918951927280" target="_blank" rel="noreferrer" className="social-icon si-wa" title="WhatsApp">
                            <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        </a>
                        <a href="https://www.instagram.com/manas360care?igsh=MW1tdnNrdXZjYXVqcA%3D%3D" target="_blank" rel="noreferrer" className="social-icon si-ig" title="Instagram">
                            <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        </a>
                        <a href="https://www.linkedin.com/company/manas360care/" target="_blank" rel="noreferrer" className="social-icon si-li" title="LinkedIn">
                            <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        </a>
                        <a href="https://www.youtube.com/@officialmanas360" target="_blank" rel="noreferrer" className="social-icon si-yt" title="YouTube">
                            <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        </a>
                    </div>
                </div>

                {/* LEGAL & REGISTRATION */}
                <div className="legal-section">
                    <h3>🏛️ Corporate Registration Details</h3>
                    <div className="legal-grid">
                        <div className="legal-item">
                            <span className="li-label">Corporate Identity Number (CIN)</span>
                            <span className="li-value">U86900KA2026PTC215013</span>
                        </div>
                        <div className="legal-item">
                            <span className="li-label">GSTIN</span>
                            <span className="li-value">29AAUCM4417G1Z1</span>
                        </div>
                        <div className="legal-item">
                            <span className="li-label">DPIIT Recognition Number</span>
                            <span className="li-value">DIPP244635</span>
                        </div>
                        <div className="legal-item">
                            <span className="li-label">Udyam Registration (MSME)</span>
                            <span className="li-value">KR-03-0654344</span>
                        </div>
                        <div className="legal-item">
                            <span className="li-label">Legal Jurisdiction</span>
                            <span className="li-value">Bengaluru Courts, Karnataka, India</span>
                        </div>
                        <div className="legal-item">
                            <span className="li-label">Legal Contact</span>
                            <span className="li-value"><a href="mailto:legal@manas360.com" style={{ color: 'var(--clay)', textDecoration: 'none' }}>legal@manas360.com</a></span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
