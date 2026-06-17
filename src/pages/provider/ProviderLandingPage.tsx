import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './ProviderLandingPage.css';

type SocialProofNotification = {
    name: string;
    action: string;
    time: string;
    city: string;
};

type ProviderProfileFormData = {
    name: string;
    phone: string;
    qualification: string;
    registration: string;
};

type ProviderProfileFormErrors = Partial<Record<keyof ProviderProfileFormData, string>>;

const ProviderLandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [notification, setNotification] = useState<SocialProofNotification>({ name: 'Dr. Rajesh K.', action: 'Just completed NLP Certification', time: '2 minutes ago', city: 'Mumbai' });
    const [showNotification, setShowNotification] = useState(true);

    // Form state
    const [formData, setFormData] = useState<ProviderProfileFormData>({
        name: '',
        phone: '',
        qualification: '',
        registration: ''
    });
    const [formErrors, setFormErrors] = useState<ProviderProfileFormErrors>({});
    const [isRegistering, setIsRegistering] = useState(false);

    const notifications = useMemo<SocialProofNotification[]>(
        () => [
            { name: 'Dr. Rajesh K.', action: 'Just completed NLP Certification', time: '2 minutes ago', city: 'Mumbai' },
            { name: 'Dr. Priya S.', action: 'Earned ₹32,000 in first month', time: '5 minutes ago', city: 'Delhi' },
            { name: 'Dr. Amit R.', action: 'Just landed ₹2L corporate retainer', time: '8 minutes ago', city: 'Bangalore' },
            { name: 'Dr. Meera J.', action: 'Became Master Mentor', time: '12 minutes ago', city: 'Pune' },
            { name: 'Dr. Karthik V.', action: 'Started group therapy sessions', time: '15 minutes ago', city: 'Chennai' },
        ],
        [],
    );

    useEffect(() => {
        let notifIndex = 0;
        const notifInterval = setInterval(() => {
            setShowNotification(false);
            setTimeout(() => {
                notifIndex = (notifIndex + 1) % notifications.length;
                setNotification(notifications[notifIndex]);
                setShowNotification(true);
            }, 1000);
        }, 8000);

        return () => {
            clearInterval(notifInterval);
        };
    }, []);

    const normalizePhone = (value: string): string => value.replace(/[^\d+]/g, '');
    const isValidIndianMobile = (value: string): boolean => {
        const digits = value.replace(/\D/g, '');
        return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const nextValue = name === 'phone' ? normalizePhone(value) : value;
        setFormData(prev => ({ ...prev, [name]: nextValue }));
        setFormErrors((prev) => (prev[name as keyof ProviderProfileFormData] ? { ...prev, [name]: undefined } : prev));
    };

    const validateStep1 = (): ProviderProfileFormErrors => {
        const errors: ProviderProfileFormErrors = {};
        if (!formData.name.trim()) errors.name = 'Please enter your full name.';
        if (!formData.phone.trim()) errors.phone = 'Please enter your mobile number.';
        if (formData.phone.trim() && !isValidIndianMobile(formData.phone)) errors.phone = 'Please enter a valid mobile number.';
        if (!formData.qualification.trim()) errors.qualification = 'Please enter your qualification.';
        return errors;
    };

    const scrollToForm = () => {
        document.getElementById('step1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const redirectToProviderSignup = () => {
        const phoneDigits = formData.phone.replace(/\D/g, '');
        const qp = new URLSearchParams();
        qp.set('role', 'therapist');
        if (formData.name.trim()) qp.set('name', formData.name.trim());
        if (phoneDigits) qp.set('phone', phoneDigits.startsWith('91') ? `+${phoneDigits}` : `+91${phoneDigits}`);
        if (formData.qualification.trim()) qp.set('qualification', formData.qualification.trim());
        if (formData.registration.trim()) qp.set('rciNumber', formData.registration.trim());
        navigate(`/auth/signup?${qp.toString()}`);
    };

    const handleSubmit = async () => {
        if (isRegistering) return;
        const errors = validateStep1();
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            const firstField = (Object.keys(errors)[0] as keyof ProviderProfileFormData) || null;
            if (firstField) {
                const el = document.querySelector<HTMLInputElement>(`[name="${firstField}"]`);
                el?.focus();
            }
            return;
        }

        setIsRegistering(true);
        try {
            redirectToProviderSignup();
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div className="provider-landing">
            {/* Top Navigation Bar */}
            {/* <div className="top-actions">
                <button className="home-btn" onClick={() => navigate('/landing')}>← Home</button>
                <div className="top-auth">
                    <Link to="/auth/signup" className="top-register">Register</Link>
                    <Link to="/auth/login" className="top-login">Login</Link>
                </div>
            </div> */}



            {/* Social Proof Notifications */}
            <div className={`social-proof ${!showNotification ? 'hidden-proof' : ''}`}>
                <div className="social-proof-header">
                    <div className="avatar">{notification.name.split(' ')[0][0]}{notification.name.split(' ')[1][0]}</div>
                    <div>
                        <div className="social-proof-name">{notification.name}</div>
                        <div className="social-proof-action">{notification.action}</div>
                    </div>
                </div>
                <div className="social-proof-time">🎉 {notification.time} • {notification.city}</div>
            </div>

            {/* Hero Section */}
            <div className="hero">
                <div className="hero-left">
                    <h1>Your Journey to ₹2.5 Lakh/Month Starts Here</h1>
                    <p className="subtitle">Join 1,247 therapists already transforming their careers on MANAS360</p>

                    <div className="stats-bar">
                        <div className="stat">
                            <span className="stat-number">₹2.5L</span>
                            <span className="stat-label">Avg Income (Master Mentors)</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">573%</span>
                            <span className="stat-label">Average ROI</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">18 months</span>
                            <span className="stat-label">To Master Mentor</span>
                        </div>
                    </div>
                </div>

                <div className="hero-right" id="step1">
                    <div className="signup-flow">
                        <div className="signup-card">
                            <div className="signup-title">Register Your Profile</div>
                            <div className="signup-sub">Takes 60 seconds. This creates your provider identity on MANAS360.</div>

                            <div className="mt-4 space-y-3 text-left">
                                <Input
                                    id="sName"
                                    name="name"
                                    label="Full Name"
                                    type="text"
                                    placeholder="Dr. Priya Sharma"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    error={formErrors.name}
                                />
                                <Input
                                    id="sPhone"
                                    name="phone"
                                    label="Mobile Number"
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    error={formErrors.phone}
                                />
                                <Input
                                    id="sQual"
                                    name="qualification"
                                    label="Qualification"
                                    type="text"
                                    placeholder="e.g. M.Phil Clinical Psychology"
                                    value={formData.qualification}
                                    onChange={handleInputChange}
                                    error={formErrors.qualification}
                                />
                                <Input
                                    id="sReg"
                                    name="registration"
                                    label="RCI Number (Optional)"
                                    type="text"
                                    placeholder="Your RCI registration number"
                                    value={formData.registration}
                                    onChange={handleInputChange}
                                />

                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        fullWidth
                                        loading={isRegistering}
                                        className="btn btn-primary btn-lg w-full !rounded-lg hover:!bg-[var(--brand-navy-hover)]"
                                        onClick={handleSubmit}
                                    >
                                        {isRegistering ? 'Redirecting...' : 'Register →'}
                                    </Button>
                                </div>
                            </div>
                            <div className="s-footer-note mt-4 text-center text-sm text-gray-500">✅ No payment at this step. Your data is encrypted.</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Journey Wave Path */}
            <div className="journey-container">
                <svg className="wave-line" viewBox="0 0 100 2000" preserveAspectRatio="none">
                    <path d="M 50,0 Q 80,100 50,200 T 50,400 T 50,600 T 50,800 T 50,1000 T 50,1200 T 50,1400 T 50,1600 T 50,1800 T 50,2000" />
                </svg>

                <div className="wave-path">
                    {/* Milestone 1: Onboarding */}
                    <div className="milestone left" style={{ top: '50px' }}>
                        <div className="milestone-content">
                            <div className="milestone-badge">FREE</div>
                            <div className="milestone-title">🚀 Week 1: Get Started</div>
                            <div className="milestone-timeline">📅 Week 1-2 • ⏱️ 2 hours</div>
                            <div className="milestone-desc">
                                Submit credentials, complete platform training, get verified.
                                <strong>Zero investment required.</strong>
                            </div>
                            <div className="milestone-income">
                                <div className="income-label">Investment</div>
                                <span className="income-amount">₹0</span>
                            </div>
                        </div>
                        <div className="flag-post">
                            <div className="flag">🎯</div>
                        </div>
                    </div>

                    {/* Milestone 2: 5 Whys Certification */}
                    <div className="milestone right" style={{ top: '250px' }}>
                        <div className="milestone-content">
                            <div className="milestone-badge">FREE ONBOARDING</div>
                            <div className="milestone-title">🧠 Week 1: Free Onboarding</div>
                            <div className="milestone-timeline">📅 Week 3-4 • ⏱️ 6 hours</div>
                            <div className="milestone-desc">
                                Learn root cause analysis, empathy framework, and projecting questions.
                                Earn your first certification!
                            </div>
                            <div className="milestone-skills">
                                <span className="skill-tag">Root Cause Analysis</span>
                                <span className="skill-tag">Empathy Framework</span>
                                <span className="skill-tag">Active Listening</span>
                            </div>
                        </div>
                        <div className="flag-post">
                            <div className="flag">🎓</div>
                        </div>
                    </div>

                    {/* Milestone 3: First Revenue */}
                    <div className="milestone left" style={{ top: '450px' }}>
                        <div className="milestone-content">
                            <div className="milestone-badge">💰 REVENUE STARTS</div>
                            <div className="milestone-title">💵 Week 2: First Earnings</div>
                            <div className="milestone-timeline">📅 Week 5+ • 15 sessions/month</div>
                            <div className="milestone-desc">
                                Buy lead package (₹2,500), convert patients, start earning.
                                <strong>ROI: 399%</strong>
                            </div>
                            <div className="milestone-income">
                                <div className="income-label">Monthly Income</div>
                                <span className="income-amount">₹25,000</span>
                            </div>
                            <div className="milestone-footer">
                                ↗️ Dr. Priya S. earned ₹32,000 in her first month
                            </div>
                        </div>
                        <div className="flag-post">
                            <div className="flag">💰</div>
                        </div>
                    </div>

                    {/* Milestone 4: NLP Certification */}
                    <div className="milestone right" style={{ top: '650px' }}>
                        <div className="milestone-content">
                            <div className="milestone-badge">+30% RATES</div>
                            <div className="milestone-title">🧬 Month 3: NLP Master</div>
                            <div className="milestone-timeline">📅 Month 3-4 • ⏱️ 40 hours</div>
                            <div className="milestone-desc">
                                Advanced communication skills. Charge premium rates.
                                Free after 50 sessions!
                            </div>
                            <div className="milestone-income">
                                <div className="income-label">New Monthly Income</div>
                                <span className="income-amount">₹33,000</span>
                                <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
                                    ⬆️ +₹8,000 from previous month
                                </div>
                            </div>
                            <div className="milestone-skills">
                                <span className="skill-tag">NLP Practitioner</span>
                                <span className="skill-tag">Anchoring</span>
                                <span className="skill-tag">Reframing</span>
                            </div>
                        </div>
                        <div className="flag-post">
                            <div className="flag">🎯</div>
                        </div>
                    </div>

                    {/* Milestone 5: Corporate Access */}
                    <div className="milestone left" style={{ top: '850px' }}>
                        <div className="milestone-content">
                            <div className="milestone-badge">🚀 +150% RATES</div>
                            <div className="milestone-title">🏢 Month 6: Certified Corp-Executive Therapist</div>
                            <div className="milestone-timeline">📅 Month 5-6 • 🎯 B2B Access</div>
                            <div className="milestone-desc">
                                Unlock corporate clients. Deliver workshops. Land retainers.
                                <strong>₹15K-60K per workshop!</strong>
                            </div>
                            <div className="milestone-income">
                                <div className="income-label">Monthly Income (with workshops)</div>
                                <span className="income-amount">₹65,000</span>
                            </div>
                            <div className="milestone-footer">
                                💼 Dr. Amit R. landed a ₹2L/month retainer with TCS
                            </div>
                        </div>
                        <div className="flag-post">
                            <div className="flag">🏢</div>
                        </div>
                    </div>

                    {/* Milestone 6: Certified Aatman Coach */}
                    <div className="milestone right" style={{ top: '1050px' }}>
                        <div className="milestone-content">
                            <div className="milestone-badge">⭐ PREMIUM POSITIONING</div>
                            <div className="milestone-title">🕉️ Month 9: Certified Aatman Coach</div>
                            <div className="milestone-timeline">📅 Month 7-9 • ⏱️ 60 hours + retreat</div>
                            <div className="milestone-desc">
                                Master soul-level transformation. Eastern + Western synthesis.
                                <strong>Top 10% exclusive certification.</strong>
                            </div>
                            <div className="milestone-income">
                                <div className="income-label">Session Rate</div>
                                <span className="income-amount">₹6,500</span>
                                <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
                                    💎 Premium clients only
                                </div>
                            </div>
                            <div className="milestone-skills">
                                <span className="skill-tag">Vedanta</span>
                                <span className="skill-tag">Shadow Work</span>
                                <span className="skill-tag">Consciousness</span>
                            </div>
                        </div>
                        <div className="flag-post">
                            <div className="flag">💎</div>
                        </div>
                    </div>

                    {/* Milestone 7: Certified NRI-Global Indian Coach */}
                    <div className="milestone left" style={{ top: '1250px' }}>
                        <div className="milestone-content">
                            <div className="milestone-badge">DUAL PRACTICE</div>
                            <div className="milestone-title">🎯 Month 12: Certified NRI-Global Indian Coach</div>
                            <div className="milestone-timeline">📅 Month 10-12 • 🎓 ICF-equivalent</div>
                            <div className="milestone-desc">
                                Therapy + Coaching = 2x revenue streams.
                                Executive coaching: <strong>₹8,000/session</strong>
                            </div>
                            <div className="milestone-income">
                                <div className="income-label">Combined Monthly Income</div>
                                <span className="income-amount">₹1,20,000</span>
                            </div>
                        </div>
                        <div className="flag-post">
                            <div className="flag">🚀</div>
                        </div>
                    </div>

                    {/* Milestone 8: Group-Retreat Therapist */}
                    <div className="milestone right" style={{ top: '1450px' }}>
                        <div className="milestone-content">
                            <div className="milestone-badge">SCALE IMPACT</div>
                            <div className="milestone-title">👥 Month 18: Group-Retreat Therapist</div>
                            <div className="milestone-timeline">📅 Month 16-18 • 👥 8 people/session</div>
                            <div className="milestone-desc">
                                Serve 8 people simultaneously.
                                <strong>₹15,000 per group = ₹1,875/person</strong>
                            </div>
                            <div className="milestone-income">
                                <div className="income-label">With 2 Groups/Week</div>
                                <span className="income-amount">₹1,92,000</span>
                                <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
                                    + Individual sessions
                                </div>
                            </div>
                        </div>
                        <div className="flag-post">
                            <div className="flag">👥</div>
                        </div>
                    </div>

                    {/* Milestone 9: Master Mentor */}
                    <div className="milestone left" style={{ top: '1650px' }}>
                        <div className="milestone-content">
                            <div className="milestone-badge">👑 THE PINNACLE</div>
                            <div className="milestone-title">🏆 Month 18+: Master Mentor</div>
                            <div className="milestone-timeline">📅 Month 18+ • 👑 Top 5% Elite</div>
                            <div className="milestone-desc">
                                Train therapists. Earn passive income from supervisees.
                                <strong>Build your legacy.</strong>
                            </div>
                            <div className="milestone-income gold">
                                <div className="income-label">Total Monthly Income</div>
                                <span className="income-amount">₹2,53,000</span>
                                <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
                                    💰 Therapy + Coaching + Supervision + Groups
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '10px', fontSize: '12px' }}>
                                <strong style={{ color: '#92400e' }}>🎉 Dr. Meera S. hit ₹3.2L/month in Month 24</strong>
                            </div>
                        </div>
                        <div className="flag-post">
                            <div className="flag">👑</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison: Before vs After */}
            <div className="comparison-table">
                <div className="comparison-title">🔄 Your Career Transformation</div>

                <div className="comparison-row">
                    <div className="comparison-label">Monthly Income</div>
                    <div className="comparison-before">₹40,000</div>
                    <div className="comparison-after">₹2,53,000 📈</div>
                </div>

                <div className="comparison-row">
                    <div className="comparison-label">Career Control</div>
                    <div className="comparison-before">Employee</div>
                    <div className="comparison-after">Entrepreneur ⭐</div>
                </div>

                <div className="comparison-row">
                    <div className="comparison-label">Skills</div>
                    <div className="comparison-before">Basic therapy</div>
                    <div className="comparison-after">9 Certifications 🎓</div>
                </div>

                <div className="comparison-row">
                    <div className="comparison-label">Client Access</div>
                    <div className="comparison-before">Limited network</div>
                    <div className="comparison-after">Unlimited leads 🚀</div>
                </div>

                <div className="comparison-row">
                    <div className="comparison-label">Income Ceiling</div>
                    <div className="comparison-before">Fixed salary</div>
                    <div className="comparison-after">Sky's the limit 🌟</div>
                </div>

                <div className="comparison-row" style={{ border: 'none' }}>
                    <div className="comparison-label">Legacy Impact</div>
                    <div className="comparison-before">Individual</div>
                    <div className="comparison-after">Mentor generations 💙</div>
                </div>
            </div>

            {/* LEADS PRICING PLANS */}
            <div className="leads-section" id="leadsPricing">
                <div className="leads-header">
                    <h2>💰 Choose Your Lead Plan</h2>
                    <p>Buy leads, convert patients, earn 60% of every session. Platform access: ₹99/month.</p>
                </div>

                <div className="leads-grid">
                    {/* Plan 1: Starter (Free) */}
                    <div className="lead-plan">
                        <div className="lead-plan-name">Starter</div>
                        <div className="lead-plan-price">₹0 <span>/month</span></div>
                        <div className="lead-plan-period">No commitment</div>
                        <ul className="lead-plan-features">
                            <li><span className="icon">✅</span> Profile listing on marketplace</li>
                            <li><span className="icon">✅</span> 1 free lead/month</li>
                            <li><span className="icon">✅</span> Basic dashboard</li>
                            <li><span className="icon">❌</span> No priority matching</li>
                            <li><span className="icon">❌</span> No corporate leads</li>
                            <li><span className="icon">❌</span> No analytics</li>
                        </ul>
                        <button className="lead-plan-cta outline" onClick={scrollToForm}>Get Started Free</button>
                    </div>

                    {/* Plan 2: Growth */}
                    <div className="lead-plan">
                        <div className="lead-plan-name">Growth</div>
                        <div className="lead-plan-price">₹199 <span>/lead</span></div>
                        <div className="lead-plan-period">+ ₹99/mo platform access</div>
                        <ul className="lead-plan-features">
                            <li><span className="icon">✅</span> Warm leads (70-89 match)</li>
                            <li><span className="icon">✅</span> Up to 5 leads/month</li>
                            <li><span className="icon">✅</span> Patient preview before buy</li>
                            <li><span className="icon">✅</span> Basic analytics</li>
                            <li><span className="icon">❌</span> No corporate leads</li>
                            <li><span className="icon">✅</span> 50% refund if no response</li>
                        </ul>
                        <button className="lead-plan-cta primary" onClick={scrollToForm}>Start Growing →</button>
                    </div>

                    {/* Plan 3: Professional (Featured) */}
                    <div className="lead-plan featured">
                        <div className="lead-plan-badge">⭐ MOST POPULAR</div>
                        <div className="lead-plan-name">Professional</div>
                        <div className="lead-plan-price">₹299 <span>/lead</span></div>
                        <div className="lead-plan-period">+ ₹99/mo platform access</div>
                        <ul className="lead-plan-features">
                            <li><span className="icon">✅</span> Hot leads (90-100 match)</li>
                            <li><span className="icon">✅</span> Up to 10 leads/month</li>
                            <li><span className="icon">✅</span> Priority matching</li>
                            <li><span className="icon">✅</span> Full analytics dashboard</li>
                            <li><span className="icon">✅</span> Corporate B2B leads</li>
                            <li><span className="icon">✅</span> 50% refund if no response</li>
                        </ul>
                        <button className="lead-plan-cta gold" onClick={scrollToForm}>Go Professional →</button>
                    </div>

                    {/* Plan 4: Elite */}
                    <div className="lead-plan">
                        <div className="lead-plan-name">Elite</div>
                        <div className="lead-plan-price">₹399 <span>/lead</span></div>
                        <div className="lead-plan-period">+ ₹99/mo platform access</div>
                        <ul className="lead-plan-features">
                            <li><span className="icon">✅</span> Premium hot leads only</li>
                            <li><span className="icon">✅</span> Unlimited leads/month</li>
                            <li><span className="icon">✅</span> Auto-matching (AI)</li>
                            <li><span className="icon">✅</span> Executive coaching leads</li>
                            <li><span className="icon">✅</span> NRI client access</li>
                            <li><span className="icon">✅</span> Profile boosting</li>
                        </ul>
                        <button className="lead-plan-cta primary" onClick={scrollToForm}>Go Elite →</button>
                    </div>
                </div>

                <div className="leads-note">
                    <strong>Marketplace Leads:</strong> Unclaimed leads drop in price daily — ₹299 → ₹199 → ₹99.<br />
                    Revenue split: <strong>60% therapist / 40% platform</strong> on every session. Always.<br />
                    Platform access fee: <strong>₹99/month</strong> applies to all paid plans.
                </div>

                <div className="leads-comparison">
                    <table>
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Starter</th>
                                <th>Growth</th>
                                <th>Professional</th>
                                <th>Elite</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Lead price</td>
                                <td>Free (1/mo)</td>
                                <td>₹199</td>
                                <td>₹299</td>
                                <td>₹399</td>
                            </tr>
                            <tr>
                                <td>Leads per month</td>
                                <td>1</td>
                                <td>5</td>
                                <td>10</td>
                                <td>Unlimited</td>
                            </tr>
                            <tr>
                                <td>Match quality</td>
                                <td>Cold (50-69)</td>
                                <td>Warm (70-89)</td>
                                <td>Hot (90-100)</td>
                                <td>Premium hot</td>
                            </tr>
                            <tr>
                                <td>Patient preview</td>
                                <td className="cross">—</td>
                                <td className="check">✓</td>
                                <td className="check">✓</td>
                                <td className="check">✓</td>
                            </tr>
                            <tr>
                                <td>Revenue share (you keep)</td>
                                <td>60%</td>
                                <td>60%</td>
                                <td>60%</td>
                                <td>60%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CTA Section — Self-Service Provider Lifecycle */}
            <div className="cta-section">
                <h2 className="cta-title">Start Your Provider Journey Now</h2>
                <p className="cta-subtitle">No phone calls. No waiting. Self-service from register to earning.</p>

                <button className="s-btn s-btn-gold" style={{ maxWidth: '280px', margin: '0 auto 30px', display: 'block' }} onClick={scrollToForm}>
                    Register Your Profile Now →
                </button>

                <div className="cost-of-waiting">
                    <h3 style={{ color: '#92400e', fontSize: '18px', marginBottom: '12px' }}>⚠️ The Cost of Waiting</h3>
                    <p style={{ color: '#78350f', fontSize: '13px', lineHeight: '1.6' }}>
                        Every month you delay is <strong>₹25,000-₹2,53,000</strong> you're not earning.
                        That's <strong>₹3L-₹30L per year</strong> left on the table.
                        <br /><br />
                        <strong>Dr. Priya waited 6 months before joining.</strong><br />
                        "I thought I wasn't ready. Biggest mistake. I lost ₹1.5L in potential income."
                        <br /><br />
                        <strong style={{ fontSize: '15px' }}>Don't make the same mistake.</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProviderLandingPage;
