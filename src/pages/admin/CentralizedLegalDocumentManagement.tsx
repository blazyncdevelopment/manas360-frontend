import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Shield, UserRound, Landmark } from 'lucide-react';

type LegalFeatureCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  accentColor: string;
  onClick?: () => void;
};

function LegalFeatureCard({ title, description, icon, accentColor, onClick }: LegalFeatureCardProps) {
  return (
    <article
      className="relative min-h-[180px] rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 ease-out cursor-pointer hover:-translate-y-1 flex flex-col justify-between"
      onClick={onClick}
      style={{ borderTop: `4px solid ${accentColor}` }}
    >
      <div>
        <div 
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          {icon}
        </div>
        <h3 className="mt-4 text-lg font-bold tracking-tight text-gray-900 leading-snug">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          {description}
        </p>
      </div>
      <div className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700">
        Access Portal &rarr;
      </div>
    </article>
  );
}

export default function CentralizedLegalDocumentManagement() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto w-full max-w-[1240px] px-4 py-8">
      <div className="overflow-hidden rounded-3xl border border-blue-100 bg-[#f8faff] p-8 shadow-sm sm:p-10">
        <header className="mx-auto max-w-3xl text-center mb-10">
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
            Regulatory Hub v3.1
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Centralized Legal{' '}
            <span className="text-blue-600 block sm:inline">Document Management</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-gray-500">
            The single source of truth for platform agreements, DPDPA 2023 privacy oversight, and automated risk mitigation.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <LegalFeatureCard
            title="Patient Registration"
            description="DPDPA-compliant consent and digital signature acceptance logs."
            icon={<UserRound className="h-5 w-5" />}
            accentColor="#3b82f6" // blue
            onClick={() => navigate('/admin/users')}
          />
          <LegalFeatureCard
            title="NRI Legal Protection"
            description="Jurisdiction rules and liability waivers for international users."
            icon={<Landmark className="h-5 w-5" />}
            accentColor="#f43f5e" // rose/red
            onClick={() => navigate('/admin/data-privacy-hub')}
          />
          <LegalFeatureCard
            title="Governance Console"
            description="Manage document versioning, repository, and compliance tracking."
            icon={<FileText className="h-5 w-5" />}
            accentColor="#6366f1" // indigo
            onClick={() => navigate('/admin/compliance')}
          />
          <LegalFeatureCard
            title="Patient Rights Portal"
            description="Access, correction, and data deletion requests under DPDPA."
            icon={<Shield className="h-5 w-5" />}
            accentColor="#10b981" // emerald
            onClick={() => navigate('/admin/data-requests')}
          />
        </div>
      </div>
    </section>
  );
}