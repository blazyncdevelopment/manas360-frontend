import type { ReactNode } from 'react';
import type { AdminProviderOnboardingProfile, AdminVerificationDocument } from '../../api/admin.api';

const SLOT_LABELS: Record<string, string> = {
  morning: 'Morning (6am – 12pm)',
  afternoon: 'Afternoon (12pm – 5pm)',
  evening: 'Evening (5pm – 9pm)',
  night: 'Night (9pm – 12am)',
};

const formatAvailability = (availability: Record<string, string[]> | undefined): string => {
  if (!availability || typeof availability !== 'object') return '—';
  const lines = Object.entries(availability)
    .filter(([, slots]) => Array.isArray(slots) && slots.length > 0)
    .map(([day, slots]) => `${day}: ${slots.map((s) => SLOT_LABELS[s] || s).join(', ')}`);
  return lines.length > 0 ? lines.join(' · ') : '—';
};

const formatDocumentLabel = (type: string): string =>
  String(type || 'document')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const isPdfUrl = (url: string): boolean => /\.pdf($|\?|#)/i.test(url);
const isImageUrl = (url: string): boolean => /\.(jpe?g|png|gif|webp)($|\?|#)/i.test(url);

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value || '—'}</p>
    </div>
  );
}

function DocumentPreview({ doc }: { doc: AdminVerificationDocument }) {
  const label = formatDocumentLabel(doc.documentType);
  const url = doc.url;

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b border-gray-100">
        <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
        >
          Open in New Tab
        </a>
      </div>
      <div className="min-h-[280px] max-h-[420px] bg-gray-100 flex items-center justify-center overflow-hidden">
        {isImageUrl(url) ? (
          <img src={url} alt={label} className="max-h-[420px] w-full object-contain" />
        ) : isPdfUrl(url) ? (
          <iframe src={url} className="w-full h-[420px] border-0" title={label} />
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            View {label}
          </a>
        )}
      </div>
    </div>
  );
}

export type ProviderOnboardingReviewPanelProps = {
  profile: AdminProviderOnboardingProfile | null;
  documents: AdminVerificationDocument[];
};

export default function ProviderOnboardingReviewPanel({ profile, documents }: ProviderOnboardingReviewPanelProps) {
  const categories = profile?.clinicalCategories?.length
    ? profile.clinicalCategories.join(', ')
    : profile?.specializations?.length
      ? profile.specializations.join(', ')
      : '—';

  const hasProfile = Boolean(
    profile &&
      Object.values(profile).some((v) => {
        if (v === null || v === undefined || v === '') return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return Object.keys(v).length > 0;
        if (typeof v === 'boolean') return v;
        return true;
      }),
  );

  return (
    <div className="space-y-8">
      {hasProfile ? (
        <>
          <section className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Step 1 · Identity</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <DetailItem label="Full Name" value={profile?.name} />
              <DetailItem label="Phone" value={profile?.phone} />
              <DetailItem label="Date of Birth" value={profile?.dob} />
              <DetailItem
                label="Location"
                value={[profile?.city, profile?.state].filter(Boolean).join(', ') || undefined}
              />
              <DetailItem label="Contact Email" value={profile?.contactEmail} />
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Step 2 · Credentials</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <DetailItem label="Degree" value={profile?.degree} />
              <DetailItem label="University" value={profile?.university} />
              <DetailItem label="Year of Passing" value={profile?.yearOfPassing} />
              <DetailItem label="Education (summary)" value={profile?.education} />
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Steps 3–6 · Practice Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <DetailItem label="Clinical Categories" value={categories} />
              <DetailItem
                label="Years of Experience"
                value={
                  profile?.yearsOfExperience != null ? `${profile.yearsOfExperience} years` : undefined
                }
              />
              <DetailItem
                label="Consultation Fee"
                value={
                  profile?.consultationFee != null ? `₹${profile.consultationFee} / session` : undefined
                }
              />
              <DetailItem
                label="Hourly Rate"
                value={profile?.hourlyRate != null ? `₹${profile.hourlyRate} / hour` : undefined}
              />
              <div className="sm:col-span-2">
                <DetailItem label="Availability" value={formatAvailability(profile?.availability)} />
              </div>
              {profile?.shiftPreferences && profile.shiftPreferences.length > 0 && (
                <div className="sm:col-span-2">
                  <DetailItem label="Shift Preferences" value={profile.shiftPreferences.join(' · ')} />
                </div>
              )}
              <div className="sm:col-span-2">
                <DetailItem label="Tagline" value={profile?.tagline ? `"${profile.tagline}"` : undefined} />
              </div>
              <div className="sm:col-span-2">
                <DetailItem label="Bio" value={profile?.bio} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Step 7 · Agreement</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
              <DetailItem
                label="Ethics Agreement"
                value={profile?.ethicsAgreed ? 'Accepted' : profile?.ethicsAgreed === false ? 'Not accepted' : '—'}
              />
              <DetailItem label="Digital Signature" value={profile?.digitalSignature} />
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 px-5 py-4 text-sm text-amber-900">
          Structured profile fields were not returned by the API. Check uploaded documents below.
        </div>
      )}

      <section className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Uploaded Documents</h4>
        {documents.length === 0 ? (
          <div className="p-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl text-sm">
            No documents found for this provider.
          </div>
        ) : (
          <div className="space-y-6">
            {documents.map((doc) => (
              <DocumentPreview key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
