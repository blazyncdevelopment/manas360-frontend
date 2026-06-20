import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ArrowRight, BrainCircuit } from 'lucide-react';
import Button from '../components/ui/Button';

const ExamStressLandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page-root" style={{ minHeight: '100vh', backgroundColor: "#F8FAFC", color: '#1A1A2E', paddingBottom: '60px' }}>

            {/* Hero Section */}
            <div style={{ background: 'linear-gradient(180deg, #d3e4f0 0%, #e2edf5 100%)', padding: '80px 20px', textAlign: 'center', borderBottom: '1px solid #cddde8' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-serif text-[#0B2D5E]">
                        Exam Stress Help for Students
                    </h1>
                    <p className="text-[#1A1A2E]" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.5', opacity: 0.9, fontSize: '1.05rem' }}>
                        Expert support for students facing performance pressure. Connect with specialized counselors for evidence-based strategies.
                    </p>
                    <div className="flex justify-center items-center gap-4">
                        <Button
                            onClick={() => navigate('/free-screening')}
                            style={{ background: '#0B2D5E', color: 'white', border: 'none' }}
                            className="rounded-full shadow-lg hover:shadow-xl hover:opacity-90 transition-all font-bold tracking-wide w-full sm:w-auto px-8 py-3.5 text-[14px]"
                        >
                            Take Student Assessment <ArrowRight className="inline-block ml-1" size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                <h2 className="text-2xl font-bold mb-10 text-center text-[#0B2D5E]">Resources for Exam Season</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Student Assessment */}
                    <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-lg flex flex-col hover:-translate-y-1 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-[#E6F0EB] flex items-center justify-center mb-6">
                            <BrainCircuit className="w-7 h-7 text-[#326B54]" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#1A1A2E]">Student Assessment</h3>
                        <p className="text-[#666680] leading-relaxed mb-6 flex-grow">
                            Feeling overwhelmed? Take our quick, confidential screening designed specifically for students to identify burnout, test anxiety, and stress levels.
                        </p>
                        <Button
                            onClick={() => navigate('/free-screening')}
                            className="w-full bg-[#326B54] hover:bg-[#2A5A46] text-white rounded-xl py-3 font-bold text-center flex justify-center"
                        >
                            Start Screening
                        </Button>
                    </div>

                    {/* Parent Guide */}
                    <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-lg flex flex-col hover:-translate-y-1 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-[#E6EEF8] flex items-center justify-center mb-6">
                            <Users className="w-7 h-7 text-[#0B2D5E]" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#1A1A2E]">Parent Guide</h3>
                        <p className="text-[#666680] leading-relaxed mb-3">
                            Learn how to support your child during exam season without adding pressure.
                        </p>
                        <div className="mt-1 p-5 bg-slate-50 rounded-xl border border-slate-100 text-left">
                            <h4 className="font-bold text-[#0B2D5E] mb-4 border-b pb-2">Parent Guide: Managing Exam Stress</h4>
                            
                            <div className="space-y-4 text-sm text-[#3D3D5C]">
                                <div>
                                    <strong className="text-[#1A1A2E] block mb-1">1. Identifying Signs of Stress</strong>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Changes in sleep or appetite.</li>
                                        <li>Irritability or withdrawal.</li>
                                    </ul>
                                </div>
                                
                                <div>
                                    <strong className="text-[#1A1A2E] block mb-1">2. Creating a Supportive Environment</strong>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Encourage regular breaks.</li>
                                        <li>Maintain a balanced diet.</li>
                                    </ul>
                                </div>
                                
                                <div>
                                    <strong className="text-[#1A1A2E] block mb-1">3. How to Talk About Exams</strong>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Focus on effort, not just grades.</li>
                                        <li>Be an active listener.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Study Tips Section */}
            <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-10 h-10 text-[#0B2D5E]" />
                </div>
                <h2 className="text-3xl font-black mb-6 text-[#0B2D5E]">Effective Study Strategies</h2>
                <p className="text-[#3D3D5C] mb-8 text-lg leading-relaxed">
                    Balance is key. Incorporate scheduled breaks, practice mindfulness before studying, and maintain a healthy sleep schedule to maximize retention and minimize stress.
                </p>
                <Button
                    onClick={() => navigate('/free-screening')}
                    className="bg-transparent border-2 border-[#0B2D5E] text-[#0B2D5E] hover:bg-[#0B2D5E] hover:text-white px-8 py-3 rounded-full font-bold transition-colors inline-block text-center flex justify-center w-full sm:w-auto"
                >
                    Speak with a Counselor
                </Button>
            </div>

        </div>
    );
};

export default ExamStressLandingPage;
