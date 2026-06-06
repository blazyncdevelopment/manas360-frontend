import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage, providerRegister, uploadProviderDocument } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { hasProviderSubmittedOnboarding } from '../../lib/providerOnboardingFlow';
import {
  clearOnboardingSubmittedFlag,
  setOnboardingSubmittedFlag,
} from '../../utils/providerOnboardingStorage';

const clinicalCategories = [
  'Depression & Mood Disorders',
  'Anxiety Disorders',
  'ADHD',
  'Trauma & PTSD',
  'OCD',
  'Addiction',
  'Child & Adolescent',
  'Relationship & Family',
  'Sleep & Stress',
];

const stepLabels = [
  'Identity',
  'Credentials',
  'Specialization',
  'Logistics',
  'Availability',
  'Pricing & Bio',
  'Review & Submit',
];

const DAYS = [
  { day: 'Monday', short: 'Mon' },
  { day: 'Tuesday', short: 'Tue' },
  { day: 'Wednesday', short: 'Wed' },
  { day: 'Thursday', short: 'Thu' },
  { day: 'Friday', short: 'Fri' },
  { day: 'Saturday', short: 'Sat' },
  { day: 'Sunday', short: 'Sun' },
];

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '6am – 12pm' },
  { id: 'afternoon', label: 'Afternoon', time: '12pm – 5pm' },
  { id: 'evening', label: 'Evening', time: '5pm – 9pm' },
  { id: 'night', label: 'Night', time: '9pm – 12am' },
];

/** Map user auth role → professionalType expected by the backend */
const roleToProfessionalType = (role: string): string => {
  const r = String(role || '').toLowerCase().replace(/_/g, '');
  if (r === 'psychiatrist') return 'PSYCHIATRIST';
  if (r === 'psychologist') return 'PSYCHOLOGIST';
  if (r === 'coach') return 'COACH';
  return 'THERAPIST'; // default covers 'therapist' and unknown
};

type FormState = {
  /** Internal: stored alongside form data to detect cross-account cache pollution. */
  _userId?: string;
  // Step 1: Identity
  name: string;
  phone: string;
  dob: string;
  city: string;
  state: string;

  // Step 2: Credentials
  degree: string;
  university: string;
  yearOfPassing: string;
  degreeCertificateUrl: string;
  idProofUrl: string;

  // Step 3: Specialization
  clinicalCategories: string[];

  // Step 4: Logistics
  contactEmail: string;
  yearsOfExperience: number;

  // Step 5: Availability
  availability: Record<string, string[]>;
  consultationFee: number;

  // Step 6: Pricing & Bio
  hourlyRate: number;
  bio: string;
  tagline: string;

  // Verification & Sign
  ethicsAgreed: boolean;
  digitalSignature: string;
};

const ONBOARDING_CACHE_KEY = 'manas360_provider_onboarding_temp';

export default function ProviderOnboardingPageWrapper() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const providerRoles = ['therapist', 'psychiatrist', 'psychologist', 'coach'];
      const role = String(user.role || '').toLowerCase();
      if (providerRoles.includes(role) && !user.platformAccessActive) {
        navigate('/provider/subscription', { replace: true });
      } else if (providerRoles.includes(role) && hasProviderSubmittedOnboarding(user)) {
        navigate(user.isTherapistVerified ? '/provider/dashboard' : '/provider/verification-pending', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return <ProviderOnboardingPage />;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const isAllowedUpload = (file: File): boolean => {
  const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']);
  if (allowedTypes.has(file.type)) return true;
  return /\.(pdf|jpe?g|png)$/i.test(file.name);
};

function ProviderOnboardingPage() {
  const navigate = useNavigate();
  const { user, checkAuth, logout } = useAuth();

  // Build a user-scoped cache key so each account gets its own isolated progress.
  const userCacheKey = useMemo(() => {
    const uid = user?.id || user?.phone || user?.email || 'anonymous';
    return `${ONBOARDING_CACHE_KEY}_${uid}`;
  }, [user?.id, user?.phone, user?.email]);

  // Clean up any old generic (non-user-scoped) keys left over from previous versions.
  useEffect(() => {
    localStorage.removeItem(`${ONBOARDING_CACHE_KEY}_form`);
    localStorage.removeItem(`${ONBOARDING_CACHE_KEY}_step`);
  }, []);

  const [step, setStep] = useState(() => {
    const uid = user?.id || user?.phone || user?.email || 'anonymous';
    const saved = localStorage.getItem(`${ONBOARDING_CACHE_KEY}_${uid}_step`);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File upload state trackers
  const [uploadingDegree, setUploadingDegree] = useState(false);
  const [uploadingIdProof, setUploadingIdProof] = useState(false);
  const [degreeFileName, setDegreeFileName] = useState('');
  const [idProofFileName, setIdProofFileName] = useState('');
  const [degreeUploadError, setDegreeUploadError] = useState<string | null>(null);
  const [idProofUploadError, setIdProofUploadError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(() => {
    const uid = user?.id || user?.phone || user?.email || 'anonymous';
    const key = `${ONBOARDING_CACHE_KEY}_${uid}_form`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Discard cache if it was saved for a different user
        if (parsed._userId && parsed._userId !== uid) {
          localStorage.removeItem(key);
          localStorage.removeItem(`${ONBOARDING_CACHE_KEY}_${uid}_step`);
        } else {
          if (!parsed.phone) parsed.phone = String(user?.phone || '');
          if (!parsed.name) parsed.name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
          if (!parsed.contactEmail) parsed.contactEmail = String(user?.email || '');
          if (!parsed.availability || typeof parsed.availability !== 'object' || Array.isArray(parsed.availability)) {
            parsed.availability = {};
          }
          if (!Array.isArray(parsed.clinicalCategories)) parsed.clinicalCategories = [];
          if (typeof parsed.yearsOfExperience !== 'number') parsed.yearsOfExperience = 0;
          if (typeof parsed.consultationFee !== 'number') parsed.consultationFee = 0;
          if (typeof parsed.hourlyRate !== 'number') parsed.hourlyRate = 0;
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse onboarding cache', e);
      }
    }
    return {
      _userId: uid,
      name: [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim(),
      phone: String(user?.phone || ''),
      dob: '',
      city: '',
      state: '',
      degree: '',
      university: '',
      yearOfPassing: '',
      degreeCertificateUrl: '',
      idProofUrl: '',
      clinicalCategories: [],
      contactEmail: String(user?.email || ''),
      yearsOfExperience: 0,
      availability: {},
      consultationFee: 0,
      hourlyRate: 0,
      bio: '',
      tagline: '',
      ethicsAgreed: false,
      digitalSignature: '',
    };
  });

  // Persist progress to user-scoped localStorage keys.
  useEffect(() => {
    localStorage.setItem(`${userCacheKey}_form`, JSON.stringify(form));
    localStorage.setItem(`${userCacheKey}_step`, step.toString());
  }, [form, step, userCacheKey]);

  const completion = useMemo(() => Math.round((step / 7) * 100), [step]);
  const bioWordCount = form.bio.trim() ? form.bio.trim().split(/\s+/).length : 0;

  const toggleClinicalCategory = (value: string) => {
    setForm((prev) => {
      if (prev.clinicalCategories.includes(value)) {
        return { ...prev, clinicalCategories: prev.clinicalCategories.filter((item) => item !== value) };
      }
      return { ...prev, clinicalCategories: [...prev.clinicalCategories, value] };
    });
  };

  const toggleAvailability = (day: string, slotId: string) => {
    setForm((prev) => {
      const daySlots = prev.availability[day] || [];
      const updated = daySlots.includes(slotId)
        ? daySlots.filter((s) => s !== slotId)
        : [...daySlots, slotId];
      return {
        ...prev,
        availability: { ...prev.availability, [day]: updated },
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'degree' | 'id_proof') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isDegree = type === 'degree';
    const label = isDegree ? 'Degree Certificate' : 'ID Proof';

    if (!isAllowedUpload(file)) {
      const message = `${label} must be a PDF, JPG, or PNG file.`;
      if (isDegree) setDegreeUploadError(message);
      else setIdProofUploadError(message);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      const message = `${label} must be smaller than 10 MB.`;
      if (isDegree) setDegreeUploadError(message);
      else setIdProofUploadError(message);
      e.target.value = '';
      return;
    }

    if (isDegree) {
      setUploadingDegree(true);
      setDegreeFileName(file.name);
      setDegreeUploadError(null);
    } else {
      setUploadingIdProof(true);
      setIdProofFileName(file.name);
      setIdProofUploadError(null);
    }
    setError(null);

    try {
      await checkAuth({ force: true });

      const formData = new FormData();
      // 'document' = Multer field name; 'type' = enum validated by backend: license | degree | certificate
      formData.append('document', file);
      formData.append('type', isDegree ? 'degree' : 'certificate');

      const res = await uploadProviderDocument(formData);
      if (res?.url) {
        setForm((prev) => ({
          ...prev,
          [isDegree ? 'degreeCertificateUrl' : 'idProofUrl']: res.url,
        }));
      } else {
        throw new Error('No URL returned from upload API.');
      }
    } catch (err) {
      console.error(err);
      const raw = getApiErrorMessage(err, `Failed to upload ${label}. Please try again.`);
      // Backend endpoint not yet available — surface as a soft field notice, not a blocking error
      const isUnavailable = raw.toLowerCase().includes('unavailable') || raw.toLowerCase().includes('prisma');
      const message = isUnavailable
        ? 'Document upload is temporarily unavailable. You can continue without uploading and submit your documents later.'
        : raw;
      if (isDegree) {
        setDegreeUploadError(message);
        setDegreeFileName('');
      } else {
        setIdProofUploadError(message);
        setIdProofFileName('');
      }
      // Only set the page-level error for real failures, not for the known "unavailable" state
      if (!isUnavailable) {
        setError(message);
      }
    } finally {
      e.target.value = '';
      if (isDegree) {
        setUploadingDegree(false);
      } else {
        setUploadingIdProof(false);
      }
    }
  };

  const canContinue = (): boolean => {
    if (step === 1) return Boolean(form.name && form.phone && form.dob && form.city && form.state);
    if (step === 2) return Boolean(
      form.degree &&
      form.university &&
      form.yearOfPassing,
      // Documents are optional until the backend upload endpoint is available
    );
    if (step === 3) return form.clinicalCategories.length > 0;
    if (step === 4) return Boolean(
      form.city &&
      form.state &&
      form.contactEmail &&
      form.yearsOfExperience > 0,          // Bug fix: must be > 0 (can't have 0 years experience)
    );
    const hasAvailability = Object.values(form.availability || {}).some((slots) => slots && slots.length > 0);
    if (step === 5) return hasAvailability && form.consultationFee > 0;   // Bug fix: fee must be > 0
    if (step === 6) return Boolean(
      form.hourlyRate > 0 &&                // Bug fix: rate must be > 0
      form.bio.trim() &&
      form.tagline.trim() &&
      bioWordCount <= 500,                  // Bug fix: block if bio exceeds limit
    );
    // Step 7: ethics + signature required
    return Boolean(form.ethicsAgreed && form.digitalSignature.trim());
  };

  const submit = async () => {
    if (!canContinue()) return;
    setSubmitting(true);
    setError(null);
    try {
      const userKey = String(user?.id || user?.phone || user?.email || '').trim();
      if (userKey) {
        setOnboardingSubmittedFlag(userKey);
      }

      await providerRegister({
        // Use role-aware professionalType instead of hard-coded 'THERAPIST'
        professionalType: roleToProfessionalType(user?.role ?? ''),
        fullName: form.name,
        name: form.name,
        phone: form.phone,
        email: form.contactEmail,
        contactEmail: form.contactEmail,
        registrationNum: 'N/A',
        yearsOfExperience: Number(form.yearsOfExperience || 0),
        education: `${form.degree} from ${form.university} (${form.yearOfPassing})`,
        clinicalCategories: form.clinicalCategories,
        specializations: [],
        languages: ['English'],
        corporateReady: false,
        nriSessionEnabled: false,
        shiftPreferences: Object.entries(form.availability)
          .filter(([, slots]) => slots.length > 0)
          .map(([day, slots]) => `${day}: ${slots.join(',')}`),
        consultationFee: Number(form.consultationFee || 0),
        bankDetails: {
          accountName: form.name,
          accountNumber: 'N/A',
          ifsc: 'N/A',
          bankName: 'N/A',
        },
        tagline: form.tagline,
        bio: form.bio,
        digitalSignature: form.digitalSignature,
        ethicsAgreed: form.ethicsAgreed,
        dob: form.dob,
        city: form.city,
        state: form.state,
        degree: form.degree,
        university: form.university,
        yearOfPassing: form.yearOfPassing,
        degreeCertificateUrl: form.degreeCertificateUrl,
        idProofUrl: form.idProofUrl,
        availability: form.availability,
        hourlyRate: form.hourlyRate,
      });

      localStorage.removeItem(`${userCacheKey}_form`);
      localStorage.removeItem(`${userCacheKey}_step`);
      await checkAuth({ force: true });
      if (user?.isTherapistVerified && userKey) {
        clearOnboardingSubmittedFlag(userKey);
      }
      navigate('/provider/verification-pending', { replace: true });
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Unable to submit provider onboarding.');
      const rawMsg = String(err?.response?.data?.message || '').toLowerCase();
      const isAlreadySubmitted =
        msg.toLowerCase().includes('already in progress') ||
        msg.toLowerCase().includes('already submitted') ||
        rawMsg.includes('already in progress') ||
        rawMsg.includes('already submitted');
      if (isAlreadySubmitted) {
        const userKey = String(user?.id || user?.phone || user?.email || '').trim();
        if (userKey) {
          setOnboardingSubmittedFlag(userKey);
        }
        localStorage.removeItem(`${userCacheKey}_form`);
        localStorage.removeItem(`${userCacheKey}_step`);
        await checkAuth({ force: true });
        navigate('/provider/verification-pending', { replace: true });
        return;
      }
      const userKey = String(user?.id || user?.phone || user?.email || '').trim();
      if (userKey) {
        clearOnboardingSubmittedFlag(userKey);
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitSetup = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Provider Onboarding</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">Complete your professional profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleExitSetup()}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-50 shadow-sm"
            >
              Exit setup
            </button>
            <p className="shrink-0 text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">Step {step} of 7</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-2 w-full rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500 shadow-inner" style={{ width: `${completion}%` }} />
        </div>

        {/* Step labels */}
        <div className="mt-6 grid grid-cols-4 gap-2 md:grid-cols-7">
          {stepLabels.map((label, index) => {
            const active = index + 1 === step;
            const completed = index + 1 < step;
            return (
              <div
                key={label}
                className={`rounded-xl border py-2 px-1 text-center text-[10px] md:text-xs font-semibold transition-all duration-300 ${active
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : completed
                    ? 'border-emerald-100 bg-emerald-50/20 text-emerald-600'
                    : 'border-slate-100 bg-slate-50/50 text-slate-400'
                  }`}
              >
                {completed ? '✓ ' : ''}{label}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="mt-8 space-y-6">

          {/* ── Step 1: Identity ── */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Step 1 · Identity Details</p>
                <p className="mt-1 text-sm text-emerald-950/80">Please enter your basic information to initialize your provider profile.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Full Name <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    placeholder="Legal name on certificate"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Phone Number (Pre-filled) <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    disabled
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none"
                    value={form.phone}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Date of Birth <span className="text-rose-500">*</span></span>
                  <input
                    type="date"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    value={form.dob}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">City <span className="text-rose-500">*</span></span>
                    <input
                      type="text"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                      placeholder="e.g. Mumbai"
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">State <span className="text-rose-500">*</span></span>
                    <input
                      type="text"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                      placeholder="e.g. Maharashtra"
                      value={form.state}
                      onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Credentials ── */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Step 2 · Credentials &amp; Certificates</p>
                <p className="mt-1 text-sm text-emerald-950/80">Please submit your qualifications and document proof for clinical verification.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Degree <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    placeholder="e.g. M.Phil in Clinical Psychology"
                    value={form.degree}
                    onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">University / Institution <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    placeholder="e.g. NIMHANS"
                    value={form.university}
                    onChange={(e) => setForm((p) => ({ ...p, university: e.target.value }))}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Year of Passing <span className="text-rose-500">*</span></span>
                  <input
                    type="number"
                    min="1970"
                    max={new Date().getFullYear()}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    placeholder="e.g. 2020"
                    value={form.yearOfPassing}
                    onChange={(e) => setForm((p) => ({ ...p, yearOfPassing: e.target.value }))}
                  />
                </label>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                <p className="text-sm font-bold text-slate-800">Upload Verification Documents</p>
                <p className="text-xs text-slate-500">Please upload your registration certificates or degrees in PDF, JPG, or PNG format.</p>

                {/* Temporary notice: backend upload endpoint not yet available */}
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <span className="mt-0.5 text-amber-500 text-base leading-none">⚠</span>
                  <p className="text-xs font-medium text-amber-800 leading-5">
                    Document upload is temporarily unavailable while the backend storage is being set up.
                    You can skip this step and continue — you will be asked to upload your documents once the feature is ready.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Degree Certificate */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-600">Degree Certificate <span className="text-slate-400 font-normal">(optional)</span></span>
                    <div
                      className={`relative overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white transition hover:border-emerald-500 ${uploadingDegree ? 'pointer-events-none opacity-70' : ''}`}
                    >
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        onChange={(e) => void handleFileUpload(e, 'degree')}
                        aria-label="Upload degree certificate"
                      />
                      <div className="pointer-events-none flex items-center justify-center gap-2 p-6 text-sm text-slate-600">
                        {uploadingDegree ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                        ) : (
                          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        )}
                        {form.degreeCertificateUrl ? '✓ Replace Certificate' : 'Choose Degree Certificate File'}
                      </div>
                    </div>
                    {degreeFileName && <p className="text-xs text-slate-500 italic mt-1">Selected: {degreeFileName}</p>}
                    {form.degreeCertificateUrl && (
                      <span className="text-xs text-emerald-600 font-medium">✓ Uploaded Successfully</span>
                    )}
                    {degreeUploadError && (
                      <p className="text-xs font-medium text-rose-600">{degreeUploadError}</p>
                    )}
                  </div>

                  {/* ID Proof */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-600">ID Proof (Aadhaar / Passport) <span className="text-slate-400 font-normal">(optional)</span></span>
                    <div
                      className={`relative overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white transition hover:border-emerald-500 ${uploadingIdProof ? 'pointer-events-none opacity-70' : ''}`}
                    >
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        onChange={(e) => void handleFileUpload(e, 'id_proof')}
                        aria-label="Upload ID proof"
                      />
                      <div className="pointer-events-none flex items-center justify-center gap-2 p-6 text-sm text-slate-600">
                        {uploadingIdProof ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                        ) : (
                          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        )}
                        {form.idProofUrl ? '✓ Replace ID Proof' : 'Choose ID Proof File'}
                      </div>
                    </div>
                    {idProofFileName && <p className="text-xs text-slate-500 italic mt-1">Selected: {idProofFileName}</p>}
                    {form.idProofUrl && (
                      <span className="text-xs text-emerald-600 font-medium">✓ Uploaded Successfully</span>
                    )}
                    {idProofUploadError && (
                      <p className="text-xs font-medium text-rose-600">{idProofUploadError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Specialization ── */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Step 3 · Clinical Specializations</p>
                <p className="mt-1 text-sm text-emerald-950/80">Select the categories that align with your clinical expertise (select at least one).</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {clinicalCategories.map((item) => {
                  const selected = form.clinicalCategories.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleClinicalCategory(item)}
                      className={`rounded-2xl border p-4 text-left text-sm font-semibold transition duration-200 ${selected
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      {selected && <span className="mr-2 text-emerald-600 font-bold">✓</span>}
                      {item}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 font-medium">{form.clinicalCategories.length} {form.clinicalCategories.length === 1 ? 'category' : 'categories'} selected</p>
            </div>
          )}

          {/* ── Step 4: Logistics ── */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Step 4 · Logistics &amp; Location</p>
                <p className="mt-1 text-sm text-emerald-950/80">Confirm your operational address, primary contact details, and years of experience.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">City <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">State <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    value={form.state}
                    onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Contact Email <span className="text-rose-500">*</span></span>
                  <input
                    type="email"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    value={form.contactEmail}
                    onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Years of Experience <span className="text-rose-500">*</span></span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    value={form.yearsOfExperience || ''}
                    placeholder="e.g. 5"
                    onChange={(e) => setForm((p) => ({ ...p, yearsOfExperience: Math.max(0, Number(e.target.value)) }))}
                  />
                </label>
              </div>
            </div>
          )}

          {/* ── Step 5: Availability ── */}
          {step === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Step 5 · Availability Grid &amp; Consultation Fee</p>
                <p className="mt-1 text-sm text-emerald-950/80">Select your active days and time slots to configure booking availability.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 overflow-x-auto shadow-sm">
                <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-3 px-4 font-semibold text-slate-400 w-1/5">Time Slot</th>
                      {DAYS.map((d) => (
                        <th key={d.day} className="py-3 px-2 font-bold text-slate-700 text-center">{d.short}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot) => (
                      <tr key={slot.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-800">{slot.label}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{slot.time}</div>
                        </td>
                        {DAYS.map((d) => {
                          const selected = ((form.availability ?? {})[d.day] || []).includes(slot.id);
                          return (
                            <td key={d.day} className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleAvailability(d.day, slot.id)}
                                className={`mx-auto flex h-10 w-12 items-center justify-center rounded-xl border transition-all ${selected
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                                  : 'border-slate-200 bg-slate-50 text-transparent hover:border-slate-300'
                                  }`}
                              >
                                {selected ? '✓' : ''}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <label className="grid gap-1.5 max-w-md">
                <span className="text-sm font-semibold text-slate-700">Consultation Fee (₹ per session) <span className="text-rose-500">*</span></span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-8 pr-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    value={form.consultationFee || ''}
                    placeholder="e.g. 500"
                    onChange={(e) => setForm((p) => ({ ...p, consultationFee: Math.max(0, Number(e.target.value)) }))}
                  />
                </div>
              </label>
            </div>
          )}

          {/* ── Step 6: Pricing & Bio ── */}
          {step === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Step 6 · Pricing &amp; Professional Biography</p>
                <p className="mt-1 text-sm text-emerald-950/80">Configure your hourly charge rates and detail your clinical approaches.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Hourly Rate (₹) <span className="text-rose-500">*</span></span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-xl border border-slate-300 py-3 pl-8 pr-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                      value={form.hourlyRate || ''}
                      placeholder="e.g. 1500"
                      onChange={(e) => setForm((p) => ({ ...p, hourlyRate: Math.max(0, Number(e.target.value)) }))}
                    />
                  </div>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">Tagline <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    placeholder="e.g. Empowering individuals to build resilience."
                    value={form.tagline}
                    onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
                  />
                </label>
              </div>

              <label className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Professional Bio <span className="text-rose-500">*</span></span>
                  <span className={`text-xs font-semibold ${bioWordCount > 500 ? 'text-rose-600' : bioWordCount > 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {bioWordCount} / 500 words
                  </span>
                </div>
                <textarea
                  rows={6}
                  className={`rounded-xl border px-4 py-3 text-sm focus:outline-none transition ${bioWordCount > 500
                    ? 'border-rose-400 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  placeholder="Detail your therapeutic orientations, experiences, and background..."
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                />
                {bioWordCount > 500 && (
                  <p className="text-xs font-medium text-rose-600">Bio exceeds 500 words. Please shorten it before continuing.</p>
                )}
              </label>
            </div>
          )}

          {/* ── Step 7: Review & Submit ── */}
          {step === 7 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Step 7 · Final Review &amp; Signatures</p>
                <p className="mt-1 text-sm text-emerald-950/80">Please inspect your submitted details before completing the process.</p>
              </div>

              <div className="grid gap-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-700 divide-y divide-slate-200">
                <div className="grid grid-cols-2 gap-4 pb-4">
                  <div>
                    <span className="font-semibold text-slate-400">Full Name:</span>
                    <p className="text-slate-900 font-bold text-base mt-0.5">{form.name}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Phone Number:</span>
                    <p className="text-slate-900 font-medium mt-0.5">{form.phone}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Date of Birth:</span>
                    <p className="text-slate-900 font-medium mt-0.5">{form.dob}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Location:</span>
                    <p className="text-slate-900 font-medium mt-0.5">{form.city}, {form.state}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <span className="font-semibold text-slate-400">Degree &amp; Institution:</span>
                    <p className="text-slate-900 font-semibold mt-0.5">{form.degree} ({form.university})</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Year of Passing:</span>
                    <p className="text-slate-900 font-semibold mt-0.5">{form.yearOfPassing}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Degree Certificate:</span>
                    <p className="mt-0.5">
                      {form.degreeCertificateUrl
                        ? <span className="text-emerald-600 font-semibold">✓ Uploaded</span>
                        : <span className="text-rose-500">Not uploaded</span>}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">ID Proof:</span>
                    <p className="mt-0.5">
                      {form.idProofUrl
                        ? <span className="text-emerald-600 font-semibold">✓ Uploaded</span>
                        : <span className="text-rose-500">Not uploaded</span>}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <span className="font-semibold text-slate-400">Specializations:</span>
                    <p className="text-slate-900 font-semibold mt-0.5">{form.clinicalCategories.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Contact Email:</span>
                    <p className="text-slate-900 font-semibold mt-0.5">{form.contactEmail}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Years of Experience:</span>
                    <p className="text-slate-900 font-semibold mt-0.5">{form.yearsOfExperience} years</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <span className="font-semibold text-slate-400">Consultation Fee:</span>
                    <p className="text-slate-900 font-bold text-emerald-600 mt-0.5">₹{form.consultationFee} / session</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Hourly Rate:</span>
                    <p className="text-slate-900 font-bold text-emerald-600 mt-0.5">₹{form.hourlyRate} / hour</p>
                  </div>
                </div>

                <div className="pt-4">
                  <span className="font-semibold text-slate-400">Tagline:</span>
                  <p className="text-slate-900 font-medium mt-0.5 italic">"{form.tagline}"</p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 space-y-4">
                <p className="text-sm font-bold text-amber-900">Conduct &amp; Professional Agreement</p>
                <p className="text-xs leading-5 text-amber-800">
                  I agree that the details supplied are correct and that I will abide by all code regulations of clinical therapy.
                </p>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.ethicsAgreed}
                    onChange={(e) => setForm((p) => ({ ...p, ethicsAgreed: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm font-semibold text-amber-900">I agree to the Ethics &amp; Professional Conduct Agreement</span>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-sm font-semibold text-slate-700">Digital Signature <span className="text-rose-500">*</span></span>
                <input
                  type="text"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                  placeholder="Type your full legal name to sign"
                  value={form.digitalSignature}
                  onChange={(e) => setForm((p) => ({ ...p, digitalSignature: e.target.value }))}
                />
              </label>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          {step < 7 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(7, s + 1))}
              disabled={!canContinue() || submitting}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canContinue() || submitting}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
