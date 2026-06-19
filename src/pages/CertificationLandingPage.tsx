import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { JourneyMap } from '../components/CertificationJourneyMap';
import { CERTIFICATIONS } from '../CertificationConstants';
import { CardSkeleton } from '../components/CertificationSkeleton';
import { SEO } from '../components/CertificationSEO';
import { useAuth } from '../context/AuthContext';
import { MyCertificationsPage } from './MyCertificationsPage';
import { getPublishedCourses } from '../api/courses';
import { Certification, BadgeColor } from '../CertificationTypes';

export const CertificationLandingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [certificationsData, setCertificationsData] = useState<Certification[]>(CERTIFICATIONS);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isProviderRoute = location.pathname.startsWith('/provider') || location.pathname.startsWith('/patient') || location.pathname.startsWith('/learner');
  const [activeTab, setActiveTab] = useState<'my' | 'browse'>(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') === 'browse' ? 'browse' : 'my';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'browse') {
      setActiveTab('browse');
    } else if (params.get('tab') === 'my') {
      setActiveTab('my');
    }
  }, [location.search]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        let coursesResult: any = await getPublishedCourses();
        if (!Array.isArray(coursesResult)) {
           let data = coursesResult.data;
           if (Array.isArray(data)) {
               coursesResult = data;
           } else {
               throw new Error("Invalid format");
           }
        }
        const mappedCertifications: Certification[] = coursesResult.map((course: any, index: number) => {
          const colors: BadgeColor[] = ['blue', 'green', 'yellow', 'orange', 'red', 'purple'];
          return {
            id: course.id,
            slug: course.id, 
            name: course.title,
            description: course.description || '',
            badgeColor: colors[index % colors.length], 
            tier: 'Professional', 
          duration_weeks: course.modules?.length || 0,
          price_inr: course.price,
          monthly_income_min_inr: 0,
          monthly_income_max_inr: 0,
          requirements: [],
          modulesCount: course.modules?.length || 0,
          prerequisites: [],
          syllabusPdfUrl: '',
          modules: course.modules?.map((m: any) => ({
            id: m.id,
            title: m.title,
            duration_minutes: m.lessons?.length ? m.lessons.length * 10 : 0,
            topics: m.lessons?.map((l: any) => l.title) || [],
          })) || [],
          faqs: [],
          testimonials: []
        };
        });
        setCertificationsData(mappedCertifications);
      } catch (error) {
        console.error('Failed to fetch courses', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="flex flex-col font-sans bg-white overflow-x-hidden selection:bg-purple-100 relative">

      <SEO title="Certification Journey | MANAS360" />

      {/* Hero Section */}
      {!isProviderRoute && (
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#0F172A] text-white py-24">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[140px]"></div>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-teal-400 text-xs font-bold uppercase tracking-[0.2em] animate-fade-in">
              India's #1 Mental Health Ecosystem
            </div>
            <h1 className="text-5xl md:text-8xl font-serif font-black leading-[1.1] mb-8 animate-slide-up bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
              Transform Your Career,<br />
              <span className="text-teal-400">Transform Lives.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-16 font-medium leading-relaxed animate-fade-in [animation-delay:200ms]">
              Choose from 6 specialized tracks designed to take you from a community champion to a professional consciousness master.
            </p>

            {!user && (
              <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in [animation-delay:260ms]">
                <Link
                  to="/auth/login?next=/certifications"
                  className="px-6 py-3 rounded-xl border border-white/40 text-white font-bold hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  to="/auth/signup?next=/certifications&role=learner"
                  className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100"
                >
                  Register
                </Link>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-8 mt-4 animate-fade-in [animation-delay:400ms]">
              {[
                { label: 'Certifications', val: '6' },
                { label: 'Max Income', val: '₹5L/mo' },
                { label: 'Success Rate', val: '98%' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <span className="block font-serif text-4xl md:text-6xl font-black mb-2 text-white">{stat.val}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tabs for provider route */}
      {isProviderRoute && (
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 w-full mt-6 mb-8">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('my')}
              className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors ${activeTab === 'my'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              My Certifications
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors ${activeTab === 'browse'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              Browse Certifications
            </button>
          </div>
        </div>
      )}

      {isProviderRoute && activeTab === 'my' ? (
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 w-full">
          <MyCertificationsPage />
        </div>
      ) : (
        <section id="journey" className={`w-full ${isProviderRoute ? 'py-4 bg-transparent border-0' : 'pt-32 pb-16 bg-slate-50 border-y border-slate-200'}`}>
          {!isProviderRoute && (
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-6 italic">The Professional Pathway</h2>
              <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto">Explore the transition from foundational peer support to elite clinical mastery.</p>
            </div>
          )}
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            {loading ? (
              <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
                <CardSkeleton /><CardSkeleton />
              </div>
            ) : (
              <JourneyMap certifications={certificationsData} />
            )}
            
            <div className="w-full flex justify-start mt-12">
              <button
                onClick={() => navigate('/landing')}
                className="inline-flex items-center gap-1 md:gap-1.5 bg-white border border-[#D5DEE9] rounded-full cursor-pointer font-bold text-[#0B2D5E] shadow-sm text-[11px] md:text-[13px] px-2.5 py-1.5 md:px-3.5 md:py-2 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Go to Home
              </button>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default CertificationLandingPage;
