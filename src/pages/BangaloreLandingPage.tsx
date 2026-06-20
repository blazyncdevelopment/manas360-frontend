import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Star } from 'lucide-react';
import Button from '../components/ui/Button';

const BangaloreLandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page-root" style={{ minHeight: '100vh', backgroundColor: "#F8FAFC", color: '#1A1A2E', paddingBottom: '60px' }}>

            <div style={{ background: '#326B54', padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-serif text-white">
                        Therapists in Bangalore
                    </h1>
                    <p className="text-white" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.5', opacity: 0.9, fontSize: '1.05rem' }}>
                        Browse our network of verified mental health professionals offering offline and online therapy in Bangalore.
                    </p>
                    <div className="flex justify-center items-center gap-4">
                        <Button
                            onClick={() => navigate('/free-screening')}
                            style={{ backgroundColor: 'white', color: '#326B54', border: 'none' }}
                            className="rounded-full shadow-lg hover:bg-slate-50 transition-all font-bold tracking-wide w-full sm:w-auto px-8 py-3.5 text-[14px]"
                        >
                            Start Assessment <ArrowRight className="inline-block ml-1" size={16} />
                        </Button>
                    </div>
                </div>
            </div>



            {/* Testimonials (Reviews) */}
            <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                <h2 className="text-2xl font-bold mb-8 text-[#0B2D5E]">What People in Bangalore Say</h2>
                <div className="p-8 rounded-3xl bg-white/95 border border-slate-200 shadow-xl relative backdrop-blur-md">
                    <Star className="w-8 h-8 text-yellow-400 absolute top-6 right-6 opacity-50" />
                    <p className="text-lg text-[#3D3D5C] italic mb-8 leading-relaxed relative z-10 px-4 sm:px-12">
                        "Finding a good therapist in Bangalore used to be so hard with the traffic and distance. The online sessions saved me hours of commute, and my therapist is incredibly understanding and professional."
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#0B2D5E]">A</div>
                        <div className="text-left">
                            <div className="font-bold text-[#1A1A2E]">Ananya S.</div>
                            <div className="text-sm text-[#666680]">Product Manager, Whitefield</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Maps / Local SEO Section */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="bg-white/95 border border-slate-200 rounded-3xl p-4 shadow-xl backdrop-blur-md">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d124415.86475306634!2d77.49887161048473!3d12.954280231502422!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                        width="100%"
                        height="400"
                        style={{ border: 0, borderRadius: '1rem' }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </div>
            
        </div>
    );
};

export default BangaloreLandingPage;
