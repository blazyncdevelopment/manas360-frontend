import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  fetchProviderSettings,
  updateProviderSettings,
  fetchProviderSubscription,
  type ProviderAvailabilitySlot,
  type ProviderSettingsResponse,
} from '../../api/provider';
import { uploadImage } from '../../api/upload';
import {
  User, Clock, Globe, DollarSign, Bell, Shield, CreditCard, Globe2,
  Upload, Loader2
} from 'lucide-react';

type SectionId = 'profile' | 'availability' | 'languages' | 'pricing' | 'international' | 'notifications' | 'security' | 'billing';

const SECTIONS: { id: SectionId; label: string; icon: React.FC<any> }[] = [
  { id: 'profile',       label: 'Profile',        icon: User },
  { id: 'availability',  label: 'Availability',   icon: Clock },
  { id: 'languages',     label: 'Languages',      icon: Globe },
  { id: 'pricing',       label: 'Pricing',        icon: DollarSign },
  { id: 'international', label: 'International',  icon: Globe2 },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'security',      label: 'Security',       icon: Shield },
  { id: 'billing',       label: 'Billing',        icon: CreditCard },
];

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada',
  'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi',
];

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TZ_POOLS = [
  { key: 'A', label: 'Australia', detail: 'AEST · IST +4.5h', flag: '🇦🇺' },
  { key: 'B', label: 'UK, Singapore, UAE', detail: 'GMT / GST · IST ±4h', flag: '🌍' },
  { key: 'C', label: 'US Eastern', detail: 'EST · IST −10.5h', flag: '🇺🇸' },
  { key: 'D', label: 'US Western / Pacific', detail: 'PST · IST −13.5h', flag: '🌎' },
];

const CARD = 'rounded-2xl border border-calm-sage/15 bg-white p-5 shadow-soft-sm';
const LABEL = 'block text-xs font-semibold uppercase tracking-widest text-charcoal/50 mb-1';
const INPUT = 'w-full rounded-xl border border-calm-sage/20 bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20';
const SAVE_BTN = 'rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50';

const Toggle = ({
  checked, onChange, label, description,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-sm font-semibold text-charcoal">{label}</p>
      {description && <p className="mt-0.5 text-xs text-charcoal/55">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${checked ? 'bg-teal-600' : 'bg-calm-sage/20'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const createFallbackSlots = (): ProviderAvailabilitySlot[] =>
  WEEKDAY_LABELS.map((_, dayOfWeek) => ({ dayOfWeek, startTime: '09:00', endTime: '17:00', isAvailable: false }));

export default function Settings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>('profile');

  const settingsQuery = useQuery({ queryKey: ['providerSettings'], queryFn: fetchProviderSettings });
  const subQuery = useQuery({ queryKey: ['providerSubscription'], queryFn: () => fetchProviderSubscription().catch(() => null) });

  // Profile
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [specialtiesInput, setSpecialtiesInput] = useState('');
  const [tagline, setTagline] = useState('');

  // Availability
  const [availabilitySlots, setAvailabilitySlots] = useState<ProviderAvailabilitySlot[]>(createFallbackSlots());

  // Languages
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Pricing
  const [consultationFee, setConsultationFee] = useState<number>(0);

  // International
  const [acceptInternational, setAcceptInternational] = useState(false);
  const [internationalPools, setInternationalPools] = useState<string[]>([]);

  // Notifications
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifSessionNote, setNotifSessionNote] = useState(true);
  const [notifPayout, setNotifPayout] = useState(true);

  useEffect(() => {
    if (!settingsQuery.data) return;
    const d = settingsQuery.data as ProviderSettingsResponse & Record<string, any>;
    setBio(d.bio || '');
    setProfileImageUrl(d.profileImageUrl || '');
    setSpecialtiesInput((d.specializations || []).join(', '));
    setAvailabilitySlots(d.availabilitySlots?.length ? d.availabilitySlots : createFallbackSlots());
    setSelectedLanguages(d.languages || []);
    setConsultationFee(d.consultationFee ?? 0);
    setTagline(d.tagline || '');
    setAcceptInternational(Boolean(d.acceptInternational));
    setInternationalPools(Array.isArray(d.internationalPools) ? d.internationalPools : []);
  }, [settingsQuery.data]);

  const settings = settingsQuery.data ?? ({ providerId: '', displayName: '', email: '', bio: '', specializations: [], profileImageUrl: '', availabilitySlots: createFallbackSlots() } as ProviderSettingsResponse);
  const specialties = useMemo(() => specialtiesInput.split(',').map((v) => v.trim()).filter(Boolean), [specialtiesInput]);
  const enabledDays = availabilitySlots.filter((s) => s.isAvailable).length;

  const updateSlot = (dayOfWeek: number, patch: Partial<ProviderAvailabilitySlot>) =>
    setAvailabilitySlots((prev) => prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, ...patch } : s)));

  const togglePool = (key: string) =>
    setInternationalPools((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]);

  const toggleLanguage = (lang: string) =>
    setSelectedLanguages((prev) => prev.includes(lang) ? (prev.length > 1 ? prev.filter((l) => l !== lang) : prev) : [...prev, lang]);

  const updateMutation = useMutation({
    mutationFn: updateProviderSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(['providerSettings'], updated);
      toast.success('Settings saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Unable to save'),
  });

  const onSave = () => {
    updateMutation.mutate({
      bio,
      profileImageUrl,
      specializations: specialties,
      availabilitySlots,
      languages: selectedLanguages,
      consultationFee,
      tagline,
      ...(({ acceptInternational, internationalPools }) as any),
    } as any);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      const url = await uploadImage(file);
      setProfileImageUrl(url);
      toast.success('Photo uploaded successfully. Remember to save changes.');
    } catch (err: any) {
      toast.error('Failed to upload photo: ' + (err?.response?.data?.message || err.message));
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const sub = subQuery.data as any;
  const planName = sub?.plan ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : 'Free';
  const planStatus = sub?.status || 'inactive';
  const expiryDate = sub?.expiryDate ? new Date(sub.expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const renderSection = () => {
    if (settingsQuery.isLoading) return <div className="h-60 animate-pulse rounded-2xl bg-calm-sage/10" />;
    if (settingsQuery.isError) return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <p className="font-semibold text-rose-800">Unable to load settings</p>
        <p className="mt-1 text-sm text-rose-700">{settingsQuery.error instanceof Error ? settingsQuery.error.message : 'Settings unavailable.'}</p>
      </div>
    );

    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-5">
            <div className={CARD}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-charcoal">Patient-facing Identity</p>
                  <p className="mt-0.5 text-xs text-charcoal/55">This is what patients see when booking.</p>
                </div>
                <button type="button" onClick={onSave} disabled={updateMutation.isPending} className={SAVE_BTN}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={LABEL}>Display Name</label>
                  <input value={settings.displayName || ''} readOnly className={`${INPUT} bg-calm-sage/5 text-charcoal/60 cursor-not-allowed`} />
                  <p className="mt-1 text-xs text-charcoal/40">Set during onboarding — contact support to change.</p>
                </div>
                <div>
                  <label className={LABEL}>Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border border-calm-sage/30 shadow-sm" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-calm-sage/10 border border-calm-sage/20 text-charcoal/30 shadow-sm">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                    <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-full border border-teal-600 bg-white px-4 py-2 text-sm font-semibold text-teal-600 transition hover:bg-teal-50 disabled:opacity-50">
                      {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-charcoal/40">Visible to patients on your profile.</p>
                </div>
                <div>
                  <label className={LABEL}>Professional Tagline</label>
                  <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} placeholder="e.g. Compassionate trauma-informed therapist" className={INPUT} />
                  <p className="mt-1 text-xs text-charcoal/40">{tagline.length}/120</p>
                </div>
                <div>
                  <label className={LABEL}>Specialties (comma-separated)</label>
                  <input value={specialtiesInput} onChange={(e) => setSpecialtiesInput(e.target.value)} placeholder="Trauma, Anxiety, CBT" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Professional Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={7} placeholder="Describe your clinical approach and what patients can expect." className={`${INPUT} resize-none`} />
                  <p className="mt-1 text-xs text-charcoal/40">{bio.length}/2000</p>
                </div>
              </div>
            </div>

            {/* Verified Credentials (read-only) */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Verified Credentials</p>
              <p className="mt-1 text-sm text-amber-800">Read-only — verified during onboarding. Contact support to update.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Registration Type', value: settings.registrationType },
                  { label: 'Registration Number', value: settings.registrationNum },
                  { label: 'Highest Qualification', value: settings.highestQual },
                  { label: 'RCI License', value: settings.licenseRci },
                  { label: 'NMC License', value: settings.licenseNmc },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-amber-200 bg-white/70 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">{label}</p>
                    <p className="mt-1 text-sm font-medium text-charcoal">{value || <span className="italic text-charcoal/30">Not on file</span>}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'availability':
        return (
          <div className={CARD}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-charcoal">Working Hours</p>
                <p className="mt-0.5 text-xs text-charcoal/55">Patient bookings follow these time windows. {enabledDays} active days.</p>
              </div>
              <button type="button" onClick={onSave} disabled={updateMutation.isPending} className={SAVE_BTN}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
            <div className="space-y-3">
              {availabilitySlots.map((slot) => (
                <div key={slot.dayOfWeek} className="rounded-xl border border-calm-sage/15 bg-calm-sage/5 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 min-w-[120px]">
                      <input type="checkbox" checked={slot.isAvailable} onChange={(e) => updateSlot(slot.dayOfWeek, { isAvailable: e.target.checked })} className="h-4 w-4 rounded border-calm-sage/30 text-teal-600 focus:ring-teal-400" />
                      <span className="text-sm font-semibold text-charcoal">{WEEKDAY_LABELS[slot.dayOfWeek]}</span>
                    </label>
                    <div className="flex items-center gap-2 ml-auto">
                      <input type="time" value={slot.startTime} disabled={!slot.isAvailable} onChange={(e) => updateSlot(slot.dayOfWeek, { startTime: e.target.value })} className="rounded-xl border border-calm-sage/20 px-3 py-2 text-sm text-charcoal disabled:bg-calm-sage/5 disabled:text-charcoal/30" />
                      <span className="text-xs text-charcoal/40">to</span>
                      <input type="time" value={slot.endTime} disabled={!slot.isAvailable} onChange={(e) => updateSlot(slot.dayOfWeek, { endTime: e.target.value })} className="rounded-xl border border-calm-sage/20 px-3 py-2 text-sm text-charcoal disabled:bg-calm-sage/5 disabled:text-charcoal/30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'languages':
        return (
          <div className={CARD}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-charcoal">Session Languages</p>
                <p className="mt-0.5 text-xs text-charcoal/55">Select all languages you can conduct sessions in.</p>
              </div>
              <button type="button" onClick={onSave} disabled={updateMutation.isPending} className={SAVE_BTN}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button key={lang} type="button" onClick={() => toggleLanguage(lang)} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${selectedLanguages.includes(lang) ? 'border-teal-500 bg-teal-600 text-white' : 'border-calm-sage/20 text-charcoal/70 hover:border-teal-300'}`}>
                  {lang}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-charcoal/55">Selected: {selectedLanguages.length > 0 ? selectedLanguages.join(', ') : 'None'}</p>
          </div>
        );

      case 'pricing':
        return (
          <div className={CARD}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-charcoal">Session Rate</p>
                <p className="mt-0.5 text-xs text-charcoal/55">You earn 60% of this fee per session. MANAS360 retains 40%.</p>
              </div>
              <button type="button" onClick={onSave} disabled={updateMutation.isPending} className={SAVE_BTN}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
            <div className="max-w-xs">
              <label className={LABEL}>Consultation Fee (INR)</label>
              <div className="flex items-center rounded-xl border border-calm-sage/20 bg-white px-4 py-2.5 focus-within:border-teal-400">
                <span className="mr-1.5 text-sm text-charcoal/50">₹</span>
                <input type="number" min={300} max={5000} value={consultationFee} onChange={(e) => setConsultationFee(Number(e.target.value))} placeholder="1500" className="flex-1 bg-transparent text-sm text-charcoal outline-none" />
              </div>
              <p className="mt-1 text-xs text-charcoal/40">Range: ₹300 – ₹5,000 per session.</p>
            </div>
            {consultationFee > 0 && (
              <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
                <p className="text-sm font-semibold text-teal-800">Your payout: ₹{Math.round(consultationFee * 0.6).toLocaleString('en-IN')} per session</p>
                <p className="mt-0.5 text-xs text-teal-700">60% of ₹{consultationFee.toLocaleString('en-IN')} fee</p>
              </div>
            )}
          </div>
        );

      case 'international':
        return (
          <div className="space-y-4">
            <div className={CARD}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-charcoal">International & NRI Patients</p>
                  <p className="mt-0.5 text-xs text-charcoal/55">Accept leads from Indian diaspora worldwide at higher session rates.</p>
                </div>
                <button type="button" onClick={onSave} disabled={updateMutation.isPending} className={SAVE_BTN}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>

              <Toggle
                checked={acceptInternational}
                onChange={setAcceptInternational}
                label="Accept international (NRI) patients"
                description="Your profile will appear in searches by Indian diaspora worldwide."
              />

              {acceptInternational && (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
                    <p className="text-sm font-semibold text-teal-800">International sessions are priced at ₹2,999 – ₹4,999</p>
                    <p className="mt-0.5 text-xs text-teal-700">You earn 60% = ₹1,799 – ₹2,999 per session — significantly more than domestic rates.</p>
                  </div>

                  <div>
                    <p className={LABEL}>Timezone Pools You Cover</p>
                    <p className="mb-3 text-xs text-charcoal/55">Select the regions where you are willing to conduct sessions. These map to session time slots outside standard IST hours.</p>
                    <div className="space-y-3">
                      {TZ_POOLS.map((pool) => (
                        <label key={pool.key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${internationalPools.includes(pool.key) ? 'border-teal-300 bg-teal-50' : 'border-calm-sage/15 bg-white hover:border-teal-200'}`}>
                          <input type="checkbox" checked={internationalPools.includes(pool.key)} onChange={() => togglePool(pool.key)} className="h-4 w-4 rounded border-calm-sage/30 text-teal-600 focus:ring-teal-400" />
                          <span className="text-xl">{pool.flag}</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-charcoal">{pool.label}</p>
                            <p className="text-xs text-charcoal/55">{pool.detail}</p>
                          </div>
                          {internationalPools.includes(pool.key) && (
                            <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-bold text-white">ENABLED</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <p className="text-xs font-semibold text-indigo-700">How it works</p>
                    <ul className="mt-1.5 space-y-1 text-xs text-indigo-800">
                      <li>• NRI patients with matching timezone preference see your profile</li>
                      <li>• Sessions are scheduled outside standard IST hours to fit diaspora timezones</li>
                      <li>• You must have at least one matching availability slot in the timezone's window</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className={CARD}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-charcoal">Notification Preferences</p>
                <p className="mt-0.5 text-xs text-charcoal/55">Control which alerts you receive.</p>
              </div>
              <button type="button" onClick={() => toast.success('Notification preferences saved')} className={SAVE_BTN}>Save</button>
            </div>
            <div className="space-y-5">
              <Toggle checked={notifBooking} onChange={setNotifBooking} label="New booking alerts" description="Get notified when a patient books a session with you." />
              <div className="border-t border-calm-sage/10" />
              <Toggle checked={notifReminder} onChange={setNotifReminder} label="Session reminders" description="Reminder 30 minutes before your next session." />
              <div className="border-t border-calm-sage/10" />
              <Toggle checked={notifSessionNote} onChange={setNotifSessionNote} label="Session note reminders" description="Reminder to complete SOAP notes within 24 hours." />
              <div className="border-t border-calm-sage/10" />
              <Toggle checked={notifPayout} onChange={setNotifPayout} label="Payout notifications" description="Weekly payout summary every Monday." />
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <div className={CARD}>
              <p className="font-semibold text-charcoal">Account Security</p>
              <p className="mt-0.5 mb-5 text-xs text-charcoal/55">Manage password and 2-factor authentication.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-calm-sage/15 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-charcoal">Change Password</p>
                    <p className="text-xs text-charcoal/55">Update your login password.</p>
                  </div>
                  <button type="button" className="rounded-full border border-calm-sage/20 px-4 py-1.5 text-xs font-semibold text-charcoal/70 hover:bg-calm-sage/5">Update</button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-calm-sage/15 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-charcoal">Two-factor Authentication</p>
                    <p className="text-xs text-charcoal/55">Add OTP-based login protection.</p>
                  </div>
                  <span className="rounded-full bg-calm-sage/10 px-3 py-1 text-xs font-semibold text-charcoal/50">Coming soon</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'billing': {
        const pd = sub?.planDetails;
        return (
          <div className="space-y-4">
            <div className={CARD}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-charcoal">Subscription Plan</p>
                  <p className="mt-0.5 text-xs text-charcoal/55">Your current MANAS360 provider plan.</p>
                </div>
                <button type="button" onClick={() => navigate('/provider/subscription')} className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">Upgrade</button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Active Plan', value: planName },
                  { label: 'Status', value: planStatus === 'active' ? '● Active' : '○ Inactive', accent: planStatus === 'active' ? 'text-emerald-700' : 'text-amber-700' },
                  { label: 'Renewal Date', value: expiryDate },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="rounded-xl border border-calm-sage/15 bg-calm-sage/5 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">{label}</p>
                    <p className={`mt-1 text-base font-bold ${accent || 'text-charcoal'}`}>{value}</p>
                  </div>
                ))}
              </div>

              {pd && (
                <div className="mt-8 border-t border-calm-sage/10 pt-6">
                  <h4 className="mb-4 text-sm font-semibold text-charcoal">Plan Features & Limits</h4>
                  <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="flex justify-between border-b border-calm-sage/10 pb-2">
                      <span className="text-sm text-charcoal/60">Leads Per Week</span>
                      <span className="text-sm font-medium text-charcoal">{pd.leadsPerWeek} (Hot: {pd.hotLeads || 0} | Warm: {pd.warmLeads || 0} | Cold: {pd.coldLeads || 0})</span>
                    </div>
                    <div className="flex justify-between border-b border-calm-sage/10 pb-2">
                      <span className="text-sm text-charcoal/60">Leads Per Month</span>
                      <span className="text-sm font-medium text-charcoal">~{pd.leadsPerMonth} leads</span>
                    </div>
                    <div className="flex justify-between border-b border-calm-sage/10 pb-2">
                      <span className="text-sm text-charcoal/60">Claim Window</span>
                      <span className="text-sm font-medium text-charcoal">{pd.claimWindowHours} hours</span>
                    </div>
                    <div className="flex justify-between border-b border-calm-sage/10 pb-2">
                      <span className="text-sm text-charcoal/60">Lead Quality</span>
                      <span className="text-sm font-medium text-charcoal text-right pl-4">{pd.leadQualityMix}</span>
                    </div>
                    <div className="flex justify-between border-b border-calm-sage/10 pb-2">
                      <span className="text-sm text-charcoal/60">Delivery Days</span>
                      <span className="text-sm font-medium text-charcoal text-right pl-4">{(pd.deliveryDays || []).join(', ') || 'None'}</span>
                    </div>
                    <div className="flex justify-between border-b border-calm-sage/10 pb-2">
                      <span className="text-sm text-charcoal/60">Marketplace Access</span>
                      <span className="text-sm font-medium text-charcoal">{pd.marketplaceAccess ? `Yes (${pd.discount}% off)` : 'No'}</span>
                    </div>
                    <div className="flex justify-between border-b border-calm-sage/10 pb-2">
                      <span className="text-sm text-charcoal/60">Profile Listing</span>
                      <span className="text-sm font-medium text-charcoal">{pd.profileListing}</span>
                    </div>
                    <div className="flex justify-between border-b border-calm-sage/10 pb-2">
                      <span className="text-sm text-charcoal/60">Badge</span>
                      <span className="text-sm font-medium text-charcoal">{pd.certificationBadge}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-20 pt-2 md:px-6 lg:pb-6">
      {/* Page header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">Settings</h1>
        <p className="text-sm text-charcoal/60">Manage your clinical identity, availability, and preferences.</p>
      </header>

      <div className="flex gap-6 lg:items-start">
        {/* Sidebar nav */}
        <nav className="hidden w-52 shrink-0 flex-col gap-1 lg:flex">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeSection === id ? 'bg-teal-600 text-white shadow-sm' : 'text-charcoal/70 hover:bg-calm-sage/10'}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile horizontal tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden w-full">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${activeSection === id ? 'bg-teal-600 text-white' : 'border border-calm-sage/20 bg-white text-charcoal/70'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">{renderSection()}</div>
      </div>
    </div>
  );
}
