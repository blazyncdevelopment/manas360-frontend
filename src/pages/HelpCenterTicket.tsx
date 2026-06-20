import React, { useState, useRef } from 'react';
import { ChevronDown, Upload } from 'lucide-react';
import { http } from '../lib/http';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import './HelpCenterTicket.css';

const HelpCenterTicket: React.FC = () => {
    const [openFaq, setOpenFaq] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [issueHeading, setIssueHeading] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ticketFormRef = useRef<HTMLDivElement>(null);

    const toggleFaq = (id: string) => {
        setOpenFaq(openFaq === id ? null : id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('issue_heading', issueHeading);
            formData.append('content', content);
            if (image) {
                formData.append('image', image);
            }

            await http.post('/help-center', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setStatus('success');
            setName('');
            setEmail('');
            setPhone('');
            setIssueHeading('');
            setContent('');
            setImage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error raising ticket:', error);
            setStatus('error');
        }
    };

    const faqs = [
        {
            id: 'password',
            title: 'Password Resets',
            content: 'We do not have passwords for login. You can log in with your registered mobile number and OTP.'
        },
        {
            id: 'howto',
            title: '"How To" Questions',
            content: 'Check out our Help Center guides and tutorials for step-by-step instructions on using the platform. You can find resources on scheduling, profile management, and more.'
        },
        {
            id: 'subscription',
            title: 'Subscription Info',
            content: 'To manage your subscription, navigate to the Billing section in your dashboard. Here you can view your current plan, upgrade, downgrade, or cancel your subscription.'
        },
        {
            id: 'session',
            title: 'Session Joining Help',
            content: 'If you did not get an email to verify, you can access all your session details directly in your dashboard. You can join your scheduled sessions directly from the dashboard by clicking the "Join Session" button. Ensure you log in 5 minutes before the session starts and have a stable internet connection.'
        },
        {
            id: 'booking',
            title: 'Booking Instructions',
            content: 'If you did not get an email to verify, you can view all your bookings directly in your dashboard. To book a new session, navigate to the booking section in your dashboard, select an available provider, pick a suitable time slot, and confirm your appointment. All updates and details will reflect immediately in your dashboard.'
        }
    ];

    return (
        <div className="help-center-page">
            <SEO 
                title="Help Center & Support — MANAS360" 
                description="Need assistance? Visit the MANAS360 Help Center. Find quick resolutions for frequently asked questions or raise a ticket."
                keywords="manas360 help center, customer support, raise ticket, mental health platform support, faq"
            />
            {/* Hero Section */}
            <div className="help-hero">
                <div className="help-hero-inner">
                    <h1>How can we help you today?</h1>
                    <p style={{ maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.5', opacity: 0.9, fontSize: '1.05rem' }}>
                        If you need assistance, please fill out the form below to raise a ticket. Our team will help you track and resolve your issue efficiently.
                    </p>
                </div>
            </div>

            {/* Main Content - FAQs & Common Issues */}
            <div className="help-main">
                <div className="help-section-title">
                    <h2>Common Issues</h2>
                    <p>Find quick resolutions for frequently asked questions</p>
                </div>

                <div className="help-faq-list">
                    {faqs.map((faq) => (
                        <div
                            key={faq.id}
                            className={`help-faq-item ${openFaq === faq.id ? 'active' : ''}`}
                        >
                            <button
                                className="help-faq-header"
                                onClick={() => toggleFaq(faq.id)}
                            >
                                <h3>{faq.title}</h3>
                                <ChevronDown
                                    size={20}
                                    className={`help-faq-icon ${openFaq === faq.id ? 'rotated' : ''}`}
                                />
                            </button>
                            <div className="help-faq-content">
                                <div className="help-faq-inner">
                                    <p>{faq.content}</p>
                                    <div className="help-faq-actions">
                                        <button className="help-btn-outline" onClick={() => ticketFormRef.current?.scrollIntoView({ behavior: 'smooth' })}>Still need help? Raise Ticket</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Raise Ticket Form */}
                <div className="help-extended-form" ref={ticketFormRef}>
                    <div className="help-form-header">
                        <h2>Raise a Ticket</h2>
                        <p>Provide details about your issue, and our support team will help you as soon as possible.</p>
                    </div>

                    {status === 'success' ? (
                        <div className="rounded-xl bg-green-50 p-8 text-center border border-green-100">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-green-900 mb-2">Ticket Submitted Successfully</h3>
                            <p className="text-green-700 mb-6">We have received your request and will get back to you shortly.</p>
                            <Button onClick={() => setStatus('idle')} className="btn btn-primary">
                                Submit Another Ticket
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 text-left">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <Input
                                    id="ticket-name"
                                    label="Full Name"
                                    placeholder="Jane Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <Input
                                    id="ticket-email"
                                    label="Email Address"
                                    type="email"
                                    placeholder="jane@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <Input
                                    id="ticket-phone"
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="+919876543210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                                <Input
                                    id="ticket-issue"
                                    label="Issue Heading"
                                    placeholder="e.g. Login Issue, Payment Failed"
                                    value={issueHeading}
                                    onChange={(e) => setIssueHeading(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description of Issue
                                </label>
                                <textarea
                                    className="w-full rounded-lg border border-slate-300 p-3 shadow-sm focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none transition-all"
                                    rows={5}
                                    placeholder="Please describe your issue in detail..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Attachment
                                </label>
                                <div className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-8 hover:bg-slate-50 transition-colors">
                                    <div className="text-center">
                                        <Upload className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                                        <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer rounded-md bg-transparent font-semibold text-sky focus-within:outline-none focus-within:ring-2 focus-within:ring-sky focus-within:ring-offset-2 hover:text-sky-hover"
                                            >
                                                <span>Upload a file</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    ref={fileInputRef}
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setImage(e.target.files[0]);
                                                        }
                                                    }}
                                                    accept="image/*"
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs leading-5 text-slate-500">PNG, JPG, GIF up to 10MB</p>
                                        {image && (
                                            <p className="mt-2 text-sm font-medium text-brand-navy">
                                                Selected file: {image.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                                    <p className="text-sm text-red-800">
                                        There was an error submitting your ticket. Please try again.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    loading={status === 'loading'}
                                    className="btn btn-primary btn-lg w-full !rounded-lg hover:!bg-[var(--brand-navy-hover)]"
                                >
                                    {status === 'loading' ? 'Submitting...' : 'Submit Ticket'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpCenterTicket;
