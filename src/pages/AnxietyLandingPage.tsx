import { useNavigate } from 'react-router-dom';
import { Shield, Brain, Heart, ArrowRight, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import './PremiumTheraphyLandingPage.css'; // Reuse a sleek stylesheet

const AnxietyLandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page-root" style={{ minHeight: '100vh', backgroundColor: "#F8FAFC", color: '#1A1A2E', paddingBottom: '60px' }}>

            <div style={{ background: 'linear-gradient(120deg, #0d9f76 0%, #138789 100%)', padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-serif text-white">
                        Anxiety Treatment Online India
                    </h1>
                    <p className="text-white" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.5', opacity: 0.9, fontSize: '1.05rem' }}>
                        Connect with specialized therapists for evidence-based anxiety treatment tailored to your needs.
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

            <div className="max-w-4xl mx-auto px-6 pt-12 pb-12 text-center">
            </div>

            {/* Symptoms Section */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold mb-8 text-center text-[#0B2D5E]">Are you experiencing these symptoms?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: <Heart className="w-6 h-6 text-[#0B2D5E]" />, title: 'Physical Symptoms', desc: 'Racing heart, sweating, shortness of breath, or stomach issues.' },
                        { icon: <Brain className="w-6 h-6 text-[#0B2D5E]" />, title: 'Racing Thoughts', desc: 'Overthinking, worst-case scenarios, and inability to switch off.' },
                        { icon: <Shield className="w-6 h-6 text-[#0B2D5E]" />, title: 'Avoidance', desc: 'Avoiding social situations, specific places, or responsibilities.' },
                    ].map((item, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-white/95 border border-slate-200 shadow-xl backdrop-blur-md hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-[#1A1A2E]">{item.title}</h3>
                            <p className="text-[#666680] leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Therapist Profiles */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold mb-8 text-center text-[#0B2D5E]">Our Specialized Anxiety Therapists</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { name: 'Dr. Priya Kapoor', spec: 'Clinical Psychologist', exp: '8 yrs exp.', rating: '4.9', reviews: 142, img: 'https://i.pravatar.cc/150?u=priya' },
                        { name: 'Dr. Rohan Desai', spec: 'CBT Specialist', exp: '10 yrs exp.', rating: '4.8', reviews: 98, img: 'https://i.pravatar.cc/150?u=rohan' },
                        { name: 'Sneha Patel', spec: 'Counseling Psychologist', exp: '5 yrs exp.', rating: '4.9', reviews: 156, img: 'https://i.pravatar.cc/150?u=sneha' },
                    ].map((doc, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-white/95 border border-slate-200 shadow-xl flex flex-col items-center text-center backdrop-blur-md hover:-translate-y-1 transition-transform">
                            <img src={doc.img} alt={doc.name} className="w-24 h-24 rounded-full mb-4 border-4 border-slate-100 shadow-sm" />
                            <h3 className="text-xl font-bold mb-1 text-[#1A1A2E]">{doc.name}</h3>
                            <p className="text-[#3D3D5C] font-medium mb-1">{doc.spec}</p>
                            <p className="text-[#666680] text-sm mb-4">
                                {doc.exp}
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

            {/* Testimonials */}
            <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                <h2 className="text-2xl font-bold mb-8 text-[#0B2D5E]">What Our Clients Say</h2>
                <div className="p-8 rounded-3xl bg-white/95 border border-slate-200 shadow-xl relative backdrop-blur-md">
                    <Star className="w-8 h-8 text-yellow-400 absolute top-6 right-6 opacity-50" />
                    <p className="text-lg text-[#3D3D5C] italic mb-8 leading-relaxed relative z-10 px-4 sm:px-12">
                        "I used to wake up with a pit in my stomach every day. Therapy helped me understand my triggers and gave me tools to stop panic attacks before they start. I finally feel like myself again."
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#0B2D5E]">R</div>
                        <div className="text-left">
                            <div className="font-bold text-[#1A1A2E]">Rahul M.</div>
                            <div className="text-sm text-[#666680]">Software Engineer, Bangalore</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="text-center py-12">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/free-screening')}
                    className="bg-[#0B2D5E] text-white hover:bg-[#061C3D] px-10 py-4 rounded-full font-bold shadow-xl"
                >
                    Start Your Free Screening
                </Button>
            </div>
        </div>
    );
};

export default AnxietyLandingPage;
