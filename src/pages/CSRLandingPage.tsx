import { useNavigate } from 'react-router-dom';
import { Calculator, Download, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';

const CSRLandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page-root" style={{ minHeight: '100vh', backgroundColor: "#F8FAFC", color: '#1A1A2E', paddingBottom: '60px' }}>

            <div style={{ background: 'linear-gradient(135deg, #d0edea 0%, #dbeafe 100%)', padding: '80px 20px', textAlign: 'center', borderBottom: '1px solid #cddde8' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-serif text-[#0B2D5E]">
                        CSR + Mental Health — Section 135 Guide
                    </h1>
                    <p className="text-[#1A1A2E]" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.5', opacity: 0.9, fontSize: '1.05rem' }}>
                        Fulfill your CSR mandate under Section 135 of the Companies Act, 2013 by investing in scalable mental health initiatives. Claim up to 30% tax deduction.
                    </p>
                    <div className="flex justify-center items-center gap-4">
                        <Button
                            onClick={() => navigate('/corporate-landing')}
                            style={{ background: '#0B2D5E', color: 'white', border: 'none' }}
                            className="rounded-full shadow-lg hover:shadow-xl hover:opacity-90 transition-all font-bold tracking-wide w-full sm:w-auto px-8 py-3.5 text-[14px]"
                        >
                            Explore Corporate Plans <ArrowRight className="inline-block ml-1" size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-5xl mx-auto px-6 py-16">
                <h2 className="text-2xl font-bold mb-10 text-center text-[#0B2D5E]">Resources for Your CSR Strategy</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Tax Benefit Calculator */}
                    <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-lg flex flex-col hover:-translate-y-1 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-[#E6F0EB] flex items-center justify-center mb-6">
                            <Calculator className="w-7 h-7 text-[#326B54]" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#1A1A2E]">Tax Benefit Calculator</h3>
                        <p className="text-[#666680] leading-relaxed mb-6 flex-grow">
                            Estimate your potential tax savings under Section 135. Learn how funding mental wellness programs for communities and employees can reduce your tax liability by up to 30%.
                        </p>
                        <Button
                            onClick={() => navigate('/corporate-landing')}
                            className="w-full bg-[#326B54] hover:bg-[#2A5A46] text-white rounded-xl py-3 font-bold text-center flex justify-center"
                        >
                            Calculate Savings
                        </Button>
                    </div>

                    {/* Proposal Template */}
                    <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-lg flex flex-col hover:-translate-y-1 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-[#E6EEF8] flex items-center justify-center mb-6">
                            <Download className="w-7 h-7 text-[#0B2D5E]" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#1A1A2E]">Proposal Template</h3>
                        <p className="text-[#666680] leading-relaxed mb-6 flex-grow">
                            Download a ready-to-use, legally compliant CSR proposal template. Present to your board with clear impact metrics, ROI projections, and compliance guarantees.
                        </p>
                        <Button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = '/CSR_Proposal_Template.pdf';
                                link.download = 'CSR_Proposal_Template.pdf';
                                link.click();
                            }}
                            className="w-full bg-[#0B2D5E] hover:bg-[#061C3D] text-white rounded-xl py-3 font-bold text-center flex justify-center"
                        >
                            Download Template
                        </Button>
                    </div>
                </div>
            </div>

            {/* Why Partner Section */}
            <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10 text-[#0B2D5E]" />
                </div>
                <h2 className="text-3xl font-black mb-6 text-[#0B2D5E]">End-to-End Compliance</h2>
                <p className="text-[#3D3D5C] mb-8 text-lg leading-relaxed">
                    Partnering with Manas360 ensures you meet 5 core compliances in one shot: DPDPA, NMC/RCI guidelines, POSH Act, OSH Act, and CSR Section 135.
                </p>
                <Button
                    onClick={() => navigate('/corporate-landing')}
                    className="bg-transparent border-2 border-[#0B2D5E] text-[#0B2D5E] hover:bg-[#0B2D5E] hover:text-white px-8 py-3 rounded-full font-bold transition-colors inline-block text-center flex justify-center w-full sm:w-auto"
                >
                    Learn About Enterprise Solutions
                </Button>
            </div>

        </div>
    );
};

export default CSRLandingPage;
