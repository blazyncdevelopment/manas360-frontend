import { useNavigate } from 'react-router-dom';
import { Shield, Brain, Heart, ArrowRight, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import './PremiumTheraphyLandingPage.css'; // Reuse a sleek stylesheet

const HindiAnxietyLandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page-root" style={{ minHeight: '100vh', backgroundColor: "#F8FAFC", color: '#1A1A2E', paddingBottom: '60px' }}>

            <div style={{ background: 'linear-gradient(120deg, #0d9f76 0%, #138789 100%)', padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-serif text-white">
                        एंग्जायटी का इलाज (Anxiety Treatment Online)
                    </h1>
                    <p className="text-white" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.5', opacity: 0.9, fontSize: '1.05rem' }}>
                        एंग्जायटी (घबराहट) से छुटकारा पाएं। हमारे विशेषज्ञ मनोवैज्ञानिकों से जुड़ें जो आपकी भाषा में आपकी मदद करेंगे।
                    </p>
                    <div className="flex justify-center items-center gap-4">
                        <Button
                            onClick={() => navigate('/एंजाइटी')}
                            style={{ backgroundColor: 'white', color: '#326B54', border: 'none' }}
                            className="rounded-full shadow-lg hover:bg-slate-50 transition-all font-bold tracking-wide w-full sm:w-auto px-8 py-3.5 text-[14px]"
                        >
                            निःशुल्क मूल्यांकन शुरू करें <ArrowRight className="inline-block ml-1" size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Symptoms Section */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold mb-8 text-center text-[#0B2D5E]">क्या आप इन लक्षणों का अनुभव कर रहे हैं?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: <Heart className="w-6 h-6 text-[#0B2D5E]" />, title: 'शारीरिक लक्षण', desc: 'दिल की धड़कन तेज होना, पसीना आना, सांस लेने में तकलीफ या पेट की समस्या।' },
                        { icon: <Brain className="w-6 h-6 text-[#0B2D5E]" />, title: 'लगातार चिंता (Racing Thoughts)', desc: 'हर समय सोचना, नकारात्मक विचार और दिमाग को शांत न कर पाना।' },
                        { icon: <Shield className="w-6 h-6 text-[#0B2D5E]" />, title: 'लोगों से बचना (Avoidance)', desc: 'सामाजिक स्थितियों, विशिष्ट स्थानों या जिम्मेदारियों से बचना।' },
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

            {/* Testimonials */}
            <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                <h2 className="text-2xl font-bold mb-8 text-[#0B2D5E]">हमारे ग्राहकों का क्या कहना है</h2>
                <div className="p-8 rounded-3xl bg-white/95 border border-slate-200 shadow-xl relative backdrop-blur-md">
                    <Star className="w-8 h-8 text-yellow-400 absolute top-6 right-6 opacity-50" />
                    <p className="text-lg text-[#3D3D5C] italic mb-8 leading-relaxed relative z-10 px-4 sm:px-12">
                        "मैं हर दिन पेट में घबराहट के साथ उठता था। थेरेपी ने मुझे अपनी समस्याओं को समझने में मदद की। अब मैं फिर से सामान्य महसूस करता हूँ।"
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#0B2D5E]">R</div>
                        <div className="text-left">
                            <div className="font-bold text-[#1A1A2E]">राहुल एम.</div>
                            <div className="text-sm text-[#666680]">सॉफ्टवेयर इंजीनियर, बेंगलुरु</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="text-center py-12">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/एंजाइटी')}
                    className="bg-[#0B2D5E] text-white hover:bg-[#061C3D] px-10 py-4 rounded-full font-bold shadow-xl"
                >
                    निःशुल्क मूल्यांकन शुरू करें (Free Screening)
                </Button>
            </div>
        </div>
    );
};

export default HindiAnxietyLandingPage;
