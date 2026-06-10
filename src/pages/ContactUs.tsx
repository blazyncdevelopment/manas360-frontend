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
                                <a href="https://wa.me/918069409284" target="_blank" rel="noreferrer">+91-80 6940 9284</a>
                            </div>
                        </div>
                        <div className="contact-item">
                            <span className="ci-icon">📞</span>
                            <div>
                                <span className="ci-label">Phone</span>
                                <a href="tel:+918944942180">+91-8944 944 2180</a>
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
                    <div className="social-handle">@MANAS360MentalWellness</div>

                    <div className="social-icons">
                        <a href="https://facebook.com/MANAS360MentalWellness" target="_blank" rel="noreferrer" className="social-icon si-fb" title="Facebook">
                            <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </a>
                        <a href="https://x.com/MANAS360MentalWellness" target="_blank" rel="noreferrer" className="social-icon si-x" title="X (Twitter)">
                            <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                        <a href="https://linkedin.com/company/MANAS360MentalWellness" target="_blank" rel="noreferrer" className="social-icon si-li" title="LinkedIn">
                            <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        </a>
                        <a href="https://google.com/search?q=MANAS360MentalWellness" target="_blank" rel="noreferrer" className="social-icon si-goog" title="Google">
                            <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        </a>
                        <a href="https://youtube.com/@MANAS360MentalWellness" target="_blank" rel="noreferrer" className="social-icon si-yt" title="YouTube">
                            <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        </a>
                        <a href="https://pinterest.com/MANAS360MentalWellness" target="_blank" rel="noreferrer" className="social-icon si-pin" title="Pinterest">
                            <svg viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" /></svg>
                        </a>
                        <a href="https://mastodon.social/@MANAS360MentalWellness" target="_blank" rel="noreferrer" className="social-icon si-mast" title="Mastodon">
                            <svg viewBox="0 0 24 24"><path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 00.023-.043v-1.809a.052.052 0 00-.02-.041.053.053 0 00-.046-.01 20.282 20.282 0 01-4.709.547c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 01-.319-1.433.053.053 0 01.066-.054 19.648 19.648 0 004.636.546c.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.668 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" /></svg>
                        </a>
                        <a href="https://threads.net/@MANAS360MentalWellness" target="_blank" rel="noreferrer" className="social-icon si-threads" title="Threads">
                            <svg viewBox="0 0 24 24"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.083.718 5.496 2.057 7.164 1.432 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.186.408-2.228 1.33-2.934.812-.621 1.907-.977 3.085-1.001.856-.018 1.65.07 2.385.262-.066-.742-.24-1.306-.52-1.687-.36-.487-.956-.745-1.773-.767l-.09-.002c-.622 0-1.756.17-2.36.96l-1.608-1.163C8.07 5.904 9.714 5.322 11.375 5.322l.127.002c1.393.026 2.477.498 3.22 1.404.64.78.99 1.845 1.078 3.233.573.144 1.096.347 1.566.608 1.122.621 1.97 1.531 2.453 2.633.769 1.757.842 4.633-1.34 6.77-1.86 1.824-4.15 2.67-7.21 2.691-.062.037-.108.037-.083.037z" /></svg>
                        </a>
                        <a href="https://t.me/MANAS360MentalWellness" target="_blank" rel="noreferrer" className="social-icon si-tg" title="Telegram">
                            <svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                        </a>
                        <a href="https://wa.me/918069409284" target="_blank" rel="noreferrer" className="social-icon si-wa" title="WhatsApp">
                            <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
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
