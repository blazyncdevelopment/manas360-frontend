import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Star } from 'lucide-react';
import Button from '../components/ui/Button';

const HindiTherapyLandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page-root" style={{ minHeight: '100vh', backgroundColor: "#F8FAFC", color: '#1A1A2E', paddingBottom: '60px' }}>

            <div style={{ background: '#326B54', padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-serif text-white">
                        हिंदी में मनोवैज्ञानिक परामर्श
                    </h1>
                    <p className="text-white" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.5', opacity: 0.9, fontSize: '1.05rem' }}>
                        भारत के सर्वश्रेष्ठ हिंदी-भाषी मनोवैज्ञानिकों से जुड़ें। मानसिक स्वास्थ्य विशेषज्ञ अब आपकी अपनी भाषा में उपलब्ध हैं।
                    </p>
                    <div className="flex justify-center items-center gap-4">
                        <Button
                            onClick={() => navigate('/थैरेपी')}
                            style={{ backgroundColor: 'white', color: '#326B54', border: 'none' }}
                            className="rounded-full shadow-lg hover:bg-slate-50 transition-all font-bold tracking-wide w-full sm:w-auto px-8 py-3.5 text-[14px]"
                        >
                            निःशुल्क मूल्यांकन शुरू करें <ArrowRight className="inline-block ml-1" size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold mb-8 text-center text-[#0B2D5E]">शीर्ष रेटेड मनोवैज्ञानिक (Top Rated Psychologists)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { name: 'डॉ. अंजलि शर्मा', spec: 'नैदानिक मनोवैज्ञानिक (Clinical Psychologist)', area: 'दिल्ली', rating: '4.9', reviews: 124, img: 'https://i.pravatar.cc/150?u=anjali' },
                        { name: 'डॉ. विक्रम रेड्डी', spec: 'सीबीटी विशेषज्ञ (CBT Specialist)', area: 'मुंबई', rating: '4.8', reviews: 98, img: 'https://i.pravatar.cc/150?u=vikram' },
                        { name: 'स्नेहा पटेल', spec: 'परामर्श मनोवैज्ञानिक (Counseling Psychologist)', area: 'बेंगलुरु', rating: '4.9', reviews: 156, img: 'https://i.pravatar.cc/150?u=sneha' },
                    ].map((doc, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-white/95 border border-slate-200 shadow-xl flex flex-col items-center text-center backdrop-blur-md hover:-translate-y-1 transition-transform">
                            <img src={doc.img} alt={doc.name} className="w-24 h-24 rounded-full mb-4 border-4 border-slate-100 shadow-sm" />
                            <h3 className="text-xl font-bold mb-1 text-[#1A1A2E]">{doc.name}</h3>
                            <p className="text-[#3D3D5C] font-medium mb-1">{doc.spec}</p>
                            <p className="text-[#666680] text-sm flex items-center justify-center gap-1 mb-4">
                                <MapPin className="w-3.5 h-3.5 text-[#0B2D5E]" /> {doc.area}, भारत
                            </p>
                            <div className="flex items-center gap-1 mb-6">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="font-bold text-[#1A1A2E]">{doc.rating}</span>
                                <span className="text-[#666680] text-sm">({doc.reviews} समीक्षाएं)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Final CTA */}
            <div className="text-center py-12">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/थैरेपी')}
                    className="bg-[#0B2D5E] text-white hover:bg-[#061C3D] px-10 py-4 rounded-full font-bold shadow-xl"
                >
                    निःशुल्क मूल्यांकन शुरू करें (Free Screening)
                </Button>
            </div>
            
        </div>
    );
};

export default HindiTherapyLandingPage;
