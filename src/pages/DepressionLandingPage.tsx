import { useNavigate } from 'react-router-dom';
import { ArrowRight, Languages, Activity, Users, Star } from 'lucide-react';
import Button from '../components/ui/Button';

const DepressionLandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page-root" style={{ minHeight: '100vh', backgroundColor: "#F8FAFC", color: '#1A1A2E', paddingBottom: '60px' }}>

            <div style={{ background: 'linear-gradient(120deg, #0d9f76 0%, #138789 100%)', padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-serif text-white">
                        Depression Help Online
                    </h1>
                    <p className="text-white" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.5', opacity: 0.9, fontSize: '1.05rem' }}>
                        Our compassionate specialists are here to support you with effective treatment plans for a brighter tomorrow.
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

            {/* PHQ-9 Preview Embed */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="p-10 rounded-3xl bg-white/95 text-[#1A1A2E] shadow-xl relative overflow-hidden border border-slate-200 backdrop-blur-md">
                    <div className="absolute top-0 right-0 px-5 py-2 bg-slate-100 text-[#0B2D5E] font-bold rounded-bl-2xl text-sm">
                        PHQ-9 Preview
                    </div>
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-[#0B2D5E]">
                        <Activity className="w-7 h-7 text-[#0B2D5E]" /> Over the last 2 weeks, how often have you been bothered by:
                    </h2>

                    <div className="space-y-4 mb-10">
                        <div className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/50 text-[#3D3D5C] font-medium">
                            1. Little interest or pleasure in doing things?
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/50 text-[#3D3D5C] font-medium">
                            2. Feeling down, depressed, or hopeless?
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/50 text-[#3D3D5C] font-medium">
                            3. Trouble falling or staying asleep, or sleeping too much?
                        </div>
                    </div>

                    <Button
                        onClick={() => navigate('/free-screening')}
                        className="w-full bg-[#0B2D5E] hover:bg-[#061C3D] text-white py-4 rounded-xl font-bold text-lg"
                    >
                        Complete Full Assessment
                    </Button>
                </div>
            </div>

            {/* Therapist Matching */}
            <div className="max-w-5xl mx-auto px-6 py-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-[#0B2D5E]" />
                </div>
                <h2 className="text-3xl font-black mb-4 text-[#0B2D5E]">Smart Therapist Matching</h2>
                <p className="text-[#3D3D5C] max-w-2xl mx-auto mb-10 text-lg">
                    Based on your PHQ-9 score and personal preferences, we match you with clinical psychologists specialized in treating depression through CBT and holistic methods.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-10">
                    <span className="px-5 py-2.5 rounded-full bg-white/80 border border-slate-200 shadow-sm text-[#1A1A2E] font-medium">Cognitive Behavioral Therapy (CBT)</span>
                    <span className="px-5 py-2.5 rounded-full bg-white/80 border border-slate-200 shadow-sm text-[#1A1A2E] font-medium">Mindfulness-Based Therapy</span>
                    <span className="px-5 py-2.5 rounded-full bg-white/80 border border-slate-200 shadow-sm text-[#1A1A2E] font-medium">Interpersonal Therapy</span>
                </div>


            </div>

            {/* Hindi Content Block */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="p-10 rounded-3xl bg-white/95 border border-slate-200 shadow-xl relative backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Languages className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="text-2xl font-black text-[#1A1A2E]">हिंदी में सहायता उपलब्ध है</h3>
                    </div>
                    <p className="text-lg text-[#3D3D5C] mb-8 leading-relaxed font-medium">
                        डिप्रेशन (अवसाद) कोई कमजोरी नहीं है, यह एक बीमारी है जिसका इलाज संभव है। यदि आप उदास महसूस करते हैं, किसी काम में मन नहीं लगता, या नींद की समस्या है, तो आप अकेले नहीं हैं। हमारे विशेषज्ञ मनोवैज्ञानिक आपकी भाषा में आपकी मदद करने के लिए यहाँ हैं।
                    </p>
                    <Button
                        onClick={() => navigate('/hi/therapy')}
                        className="bg-[#0B2D5E] hover:bg-[#061C3D] text-white border-none py-3 px-8 rounded-full font-bold shadow-md"
                    >
                        हिंदी में स्क्रीनिंग शुरू करें
                    </Button>
                </div>
            </div>

        </div>
    );
};

export default DepressionLandingPage;
