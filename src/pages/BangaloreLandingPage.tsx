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

            <div className="max-w-6xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold mb-8 text-center text-[#0B2D5E]">Top Rated Psychologists in Bangalore</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { name: 'Dr. Anjali Sharma', spec: 'Clinical Psychologist', area: 'Indiranagar', rating: '4.9', reviews: 124, img: 'https://i.pravatar.cc/150?u=anjali' },
                        { name: 'Dr. Vikram Reddy', spec: 'CBT Specialist', area: 'Koramangala', rating: '4.8', reviews: 98, img: 'https://i.pravatar.cc/150?u=vikram' },
                        { name: 'Sneha Patel', spec: 'Counseling Psychologist', area: 'HSR Layout', rating: '4.9', reviews: 156, img: 'https://i.pravatar.cc/150?u=sneha' },
                    ].map((doc, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-white/95 border border-slate-200 shadow-xl flex flex-col items-center text-center backdrop-blur-md hover:-translate-y-1 transition-transform">
                            <img src={doc.img} alt={doc.name} className="w-24 h-24 rounded-full mb-4 border-4 border-slate-100 shadow-sm" />
                            <h3 className="text-xl font-bold mb-1 text-[#1A1A2E]">{doc.name}</h3>
                            <p className="text-[#3D3D5C] font-medium mb-1">{doc.spec}</p>
                            <p className="text-[#666680] text-sm flex items-center justify-center gap-1 mb-4">
                                <MapPin className="w-3.5 h-3.5 text-[#0B2D5E]" /> {doc.area}, Bangalore
                            </p>
                            <div className="flex items-center gap-1 mb-6">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="font-bold text-[#1A1A2E]">{doc.rating}</span>
                                <span className="text-[#666680] text-sm">({doc.reviews} reviews)</span>
                            </div>

                        </div>
                    ))}
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
