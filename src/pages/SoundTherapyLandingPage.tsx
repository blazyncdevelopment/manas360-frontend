import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SoundTherapyWorkspace from '../components/shared/SoundTherapyWorkspace';

export default function SoundTherapyLandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ position: 'relative' }}>
      <SoundTherapyWorkspace mode="landing" />
      <div className="w-full flex justify-start pb-4 pt-4">
        <button
          onClick={() => navigate('/landing')}
          className="inline-flex items-center gap-1 md:gap-1.5 bg-white border border-[#D5DEE9] rounded-full cursor-pointer font-bold text-[#0B2D5E] shadow-sm text-[11px] md:text-[13px] px-2.5 py-1.5 md:px-3.5 md:py-2 hover:bg-slate-50 transition-colors ml-4 md:ml-[80px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Go to Home
        </button>
      </div>
    </div>
  );
}
