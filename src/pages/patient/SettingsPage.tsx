import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  Eye,
  Globe,
  Settings2,
  Shield,
  User,
  Wallet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { patientApi } from '../../api/patient';
import { useAuth } from '../../context/AuthContext';
import { http } from '../../lib/http';
import {
  defaultAIAssistantPreferences,
  readAIAssistantPreferences,
  saveAIAssistantPreferences,
  type AIAssistantPreferences,
} from '../../lib/aiAssistantPreferences';

type SectionId =
  | 'profile'
  | 'notifications'
  | 'privacy'
  | 'therapy'
  | 'aiAssistant'
  | 'billing'
  | 'security';

const NRI_TIMEZONE_ZONES = [
  { id: 'us_east', flag: '🇺🇸', label: 'US East', sub: 'EDT/EST (UTC-4/-5)', pool: 'C' },
  { id: 'us_west', flag: '🇺🇸', label: 'US West', sub: 'PDT/PST (UTC-7/-8)', pool: 'D' },
  { id: 'uk', flag: '🇬🇧', label: 'UK', sub: 'BST/GMT (UTC+1/0)', pool: 'B' },
  { id: 'australia', flag: '🇦🇺', label: 'Australia', sub: 'AEST/AEDT (UTC+10/+11)', pool: 'A' },
  { id: 'singapore', flag: '🇸🇬', label: 'Singapore', sub: 'SGT (UTC+8)', pool: 'B' },
  { id: 'uae', flag: '🇦🇪', label: 'UAE / Gulf', sub: 'GST (UTC+4)', pool: 'B' },
];

type SettingsState = {
  profile: {
    name: string;
    email: string;
    phone: string;
    gender: string;
    timezone: string;
    showNameToProviders: boolean;
    nriDeclared: boolean;
    nriTimezonePool: string;
  };
  notifications: {
    communicationChannel: 'whatsapp' | 'sms' | 'email';
    preferredLanguage: 'English' | 'Hindi' | 'Kannada' | 'Tamil' | 'Telugu';
    appointmentReminder: boolean;
    therapistMessages: boolean;
    crisisAlerts: boolean;
  };
  privacy: {
    shareWithTherapist: boolean;
    allowMoodTracking: boolean;
    allowAiSuggestions: boolean;
  };
  therapy: {
    preferredTherapistGender: 'any' | 'female' | 'male';
    preferredTherapyType: 'CBT' | 'Mindfulness' | 'Coaching';
    sessionMode: 'Video' | 'Chat' | 'Audio';
    emergencyName: string;
    emergencyPhone: string;
    emergencyRelationship: string;
  };
  security: {
    twoFactorEnabled: boolean;
  };
};

const STORAGE_KEY = 'manas360-patient-settings-v1';

const TIMEZONES = [
  { value: 'Asia/Kolkata',       label: '🇮🇳 India (IST, UTC+5:30)' },
  { value: 'America/New_York',   label: '🇺🇸 US East (EST/EDT, UTC-5/-4)' },
  { value: 'America/Chicago',    label: '🇺🇸 US Central (CST/CDT, UTC-6/-5)' },
  { value: 'America/Denver',     label: '🇺🇸 US Mountain (MST/MDT, UTC-7/-6)' },
  { value: 'America/Los_Angeles',label: '🇺🇸 US West (PST/PDT, UTC-8/-7)' },
  { value: 'Europe/London',      label: '🇬🇧 UK (GMT/BST, UTC+0/+1)' },
  { value: 'Europe/Paris',       label: '🇪🇺 Europe Central (CET/CEST, UTC+1/+2)' },
  { value: 'Asia/Dubai',         label: '🇦🇪 UAE / Gulf (GST, UTC+4)' },
  { value: 'Asia/Singapore',     label: '🇸🇬 Singapore (SGT, UTC+8)' },
  { value: 'Australia/Sydney',   label: '🇦🇺 Australia East (AEST/AEDT, UTC+10/+11)' },
  { value: 'Australia/Perth',    label: '🇦🇺 Australia West (AWST, UTC+8)' },
  { value: 'America/Toronto',    label: '🇨🇦 Canada East (EST/EDT, UTC-5/-4)' },
  { value: 'America/Vancouver',  label: '🇨🇦 Canada West (PST/PDT, UTC-8/-7)' },
  { value: 'Asia/Riyadh',        label: '🇸🇦 Saudi Arabia (AST, UTC+3)' },
  { value: 'Asia/Kuwait',        label: '🇰🇼 Kuwait (AST, UTC+3)' },
  { value: 'Asia/Bahrain',       label: '🇧🇭 Bahrain (AST, UTC+3)' },
  { value: 'Asia/Qatar',         label: '🇶🇦 Qatar (AST, UTC+3)' },
  { value: 'Asia/Muscat',        label: '🇴🇲 Oman (GST, UTC+4)' },
  { value: 'Africa/Nairobi',     label: '🇰🇪 East Africa (EAT, UTC+3)' },
  { value: 'Pacific/Auckland',   label: '🇳🇿 New Zealand (NZST/NZDT, UTC+12/+13)' },
];

const defaultState: SettingsState = {
  profile: {
    name: '',
    email: '',
    phone: '',
    gender: '',
    timezone: 'Asia/Kolkata',
    showNameToProviders: true,
    nriDeclared: false,
    nriTimezonePool: '',
  },
  notifications: {
    communicationChannel: 'whatsapp',
    preferredLanguage: 'English',
    appointmentReminder: true,
    therapistMessages: true,
    crisisAlerts: true,
  },
  privacy: {
    shareWithTherapist: true,
    allowMoodTracking: true,
    allowAiSuggestions: true,
  },
  therapy: {
    preferredTherapistGender: 'any',
    preferredTherapyType: 'CBT',
    sessionMode: 'Video',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
  },
  security: {
    twoFactorEnabled: false,
  },
};

const sectionMeta = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'privacy' as const, label: 'Privacy', icon: Eye },
  { id: 'therapy' as const, label: 'Therapy Preferences', icon: Globe },
  { id: 'aiAssistant' as const, label: 'AI Assistant', icon: Bot },
  { id: 'billing' as const, label: 'Billing & Subscription', icon: Wallet },
  { id: 'security' as const, label: 'Security', icon: Shield },
];

const validSectionIds: SectionId[] = ['profile', 'notifications', 'privacy', 'therapy', 'aiAssistant', 'billing', 'security'];

const parseSectionId = (value: string | null): SectionId => {
  if (value && validSectionIds.includes(value as SectionId)) {
    return value as SectionId;
  }
  return 'profile';
};

const parseStored = (): Partial<SettingsState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const formatCurrencyInr = (amount: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(amount);

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFromQuery = parseSectionId(searchParams.get('section'));
  const { user, logout } = useAuth();
  const [state, setState] = useState<SettingsState>(defaultState);
  const [savedState, setSavedState] = useState<SettingsState>(defaultState);
  const [activeSection, setActiveSection] = useState<SectionId>(sectionFromQuery);
  const [mobileOpen, setMobileOpen] = useState<SectionId | null>(sectionFromQuery);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingData, setBillingData] = useState<{
    subscription: any | null;
    paymentMethod: any | null;
    invoices: any[];
  }>({ subscription: null, paymentMethod: null, invoices: [] });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Array<{ id: string; device?: string; ipAddress?: string; createdAt?: string; lastActiveAt?: string; isCurrent?: boolean }>>([]);
  const [aiAssistant, setAiAssistant] = useState<AIAssistantPreferences>(defaultAIAssistantPreferences);
  const [savedAiAssistant, setSavedAiAssistant] = useState<AIAssistantPreferences>(defaultAIAssistantPreferences);

  useEffect(() => {
    setActiveSection(sectionFromQuery);
    setMobileOpen(sectionFromQuery);
  }, [sectionFromQuery]);

  const setSectionInUrl = (section: SectionId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('section', section);
    setSearchParams(nextParams, { replace: true });
  };

  const handleSelectSection = (section: SectionId) => {
    setActiveSection(section);
    setSectionInUrl(section);
  };

  useEffect(() => {
    const hydrate = async () => {
      setLoading(true);
      setError(null);
      try {
        const fromStorage = parseStored();
        const aiPrefs = readAIAssistantPreferences();
        setAiAssistant(aiPrefs);
        setSavedAiAssistant(aiPrefs);
        let merged = { ...defaultState, ...fromStorage } as SettingsState;
        const [me, settingsRes] = await Promise.all([
          http.get('/v1/users/me'),
          patientApi.getSettings().catch(() => null),
        ]);
        const profile = me.data?.data ?? me.data;
        const serverSettings = (settingsRes as any)?.data?.settings ?? (settingsRes as any)?.settings ?? null;

        if (serverSettings && typeof serverSettings === 'object') {
          merged = {
            ...merged,
            profile: {
              ...merged.profile,
              ...(serverSettings.profile || {}),
            },
            notifications: {
              ...merged.notifications,
              ...(serverSettings.notifications || {}),
            },
            privacy: {
              ...merged.privacy,
              ...(serverSettings.privacy || {}),
            },
            therapy: {
              ...merged.therapy,
              ...(serverSettings.therapy || {}),
            },
            security: {
              ...merged.security,
              ...(serverSettings.security || {}),
            },
          };
        }

        const normalizedName = String(profile?.name || `${profile?.firstName || ''} ${profile?.lastName || ''}` || '').trim();
        merged = {
          ...merged,
          profile: {
            ...merged.profile,
            name: normalizedName,
            email: String(profile?.email || ''),
            phone: String(profile?.phone || ''),
            timezone: String(profile?.timezone || profile?.timeZone || merged.profile.timezone || 'Asia/Kolkata'),
            showNameToProviders: typeof profile?.showNameToProviders === 'boolean' ? profile.showNameToProviders : true,
            nriDeclared: Boolean(profile?.nriDeclared || profile?.nri_declared),
            nriTimezonePool: String(profile?.nriTimezonePool || profile?.nri_timezone_pool || merged.profile.nriTimezonePool || ''),
          },
        };
        setState(merged);
        setSavedState(merged);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    void hydrate();
  }, []);

  useEffect(() => {
    const sectionVisible = activeSection === 'billing' || mobileOpen === 'billing';
    if (!sectionVisible) return;

    void refreshBillingData();
  }, [activeSection, mobileOpen]);

  const refreshBillingData = async () => {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const [subscriptionRes, paymentRes, invoicesRes] = await Promise.all([
        patientApi.getSubscription().catch(() => null),
        patientApi.getPaymentMethod().catch(() => null),
        patientApi.getInvoices().catch(() => null),
      ]);

      const subscription = (subscriptionRes as any)?.data ?? subscriptionRes ?? null;
      const paymentMethod = (paymentRes as any)?.data ?? paymentRes ?? null;
      const invoices = (invoicesRes as any)?.data ?? invoicesRes ?? [];

      setBillingData({
        subscription,
        paymentMethod,
        invoices: Array.isArray(invoices) ? invoices : [],
      });
    } catch (err: any) {
      setBillingError(err?.response?.data?.message || err?.message || 'Failed to load billing details.');
    } finally {
      setBillingLoading(false);
    }
  };

  const sectionDirty = (section: SectionId): boolean => {
    if (section === 'aiAssistant') {
      return JSON.stringify(aiAssistant) !== JSON.stringify(savedAiAssistant);
    }
    return JSON.stringify(state[section as keyof SettingsState]) !== JSON.stringify(savedState[section as keyof SettingsState]);
  };

  const anyDirty = useMemo(() => sectionMeta.some((section) => sectionDirty(section.id)), [aiAssistant, savedAiAssistant, state, savedState]);

  const persistLocal = (next: SettingsState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const saveSection = async (section: SectionId) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (section === 'aiAssistant') {
        saveAIAssistantPreferences(aiAssistant);
        setSavedAiAssistant(aiAssistant);
        setSuccess('AI Assistant settings saved successfully.');
      } else if (section === 'profile') {
        const name = state.profile.name.trim();
        const phone = state.profile.phone.trim();
        const email = state.profile.email.trim();
        if (!email && !phone) {
          throw new Error('At least Email or Phone is required.');
        }
        const payload: Record<string, any> = {
          name,
          phone,
          showNameToProviders: state.profile.showNameToProviders,
          timezone: state.profile.timezone,
          nri_declared: state.profile.nriDeclared,
        };
        if (email) payload.email = email;
        if (state.profile.nriDeclared && state.profile.nriTimezonePool) {
          payload.nri_timezone_pool = state.profile.nriTimezonePool;
        } else if (!state.profile.nriDeclared) {
          payload.nri_timezone_pool = null;
        }
        const res = await http.patch('/v1/users/me', payload);
        const updated = res.data?.data ?? res.data;
        const updatedState: SettingsState = {
          ...state,
          profile: {
            ...state.profile,
            name: String(updated?.name || name),
            email: String(updated?.email || email),
            phone: String(updated?.phone || phone),
            showNameToProviders:
              typeof updated?.showNameToProviders === 'boolean'
                ? updated.showNameToProviders
                : state.profile.showNameToProviders,
          },
        };
        await patientApi.updateSettings(updatedState);
        setState(updatedState);
        setSavedState(updatedState);
        persistLocal(updatedState);
        setSuccess('Profile settings saved successfully.');
      } else {
        const next = { ...state };
        await patientApi.updateSettings(next);
        setSavedState(next);
        persistLocal(next);
        setSuccess('Settings saved successfully.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const discardSection = (section: SectionId) => {
    if (section === 'aiAssistant') {
      setAiAssistant(savedAiAssistant);
    } else {
      setState((prev) => ({ ...prev, [section]: savedState[section as keyof SettingsState] }));
    }
    setSuccess(null);
    setError(null);
  };

  const renderSwitch = (value: boolean, onToggle: () => void, label: string, subLabel?: string) => (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-calm-sage/20 bg-white/80 px-3 py-3">
      <div>
        <p className="text-sm font-medium text-charcoal">{label}</p>
        {subLabel && <p className="mt-0.5 text-xs text-charcoal/60">{subLabel}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${value ? 'bg-calm-sage' : 'bg-calm-sage/35'}`}
        aria-pressed={value}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${value ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm text-charcoal/80">
          Name
          <input
            value={state.profile.name}
            onChange={(event) => setState((prev) => ({ ...prev, profile: { ...prev.profile, name: event.target.value } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm text-charcoal/80">
          Email
          <input
            type="email"
            value={state.profile.email}
            onChange={(event) => setState((prev) => ({ ...prev, profile: { ...prev.profile, email: event.target.value } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
            placeholder="your@email.com"
          />
          <span className="mt-0.5 block text-[11px] text-charcoal/45">Optional — used when preferred channel is email.</span>
        </label>
        <label className="text-sm text-charcoal/80">
          Phone
          <input
            value={state.profile.phone}
            onChange={(event) => setState((prev) => ({ ...prev, profile: { ...prev.profile, phone: event.target.value } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm text-charcoal/80">
          Gender
          <input
            value={state.profile.gender}
            onChange={(event) => setState((prev) => ({ ...prev, profile: { ...prev.profile, gender: event.target.value } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
            placeholder="e.g. Female, Male, Non-binary"
          />
        </label>
        <label className="text-sm text-charcoal/80 md:col-span-2">
          Timezone
          <select
            value={state.profile.timezone}
            onChange={(event) => setState((prev) => ({ ...prev, profile: { ...prev.profile, timezone: event.target.value } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2 text-sm"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          <span className="mt-0.5 block text-[11px] text-charcoal/45">Used to schedule sessions and reminders in your local time.</span>
        </label>
      </div>
      {renderSwitch(
        state.profile.showNameToProviders,
        () => setState((prev) => ({ ...prev, profile: { ...prev.profile, showNameToProviders: !prev.profile.showNameToProviders } })),
        'Show my name to providers',
        'Turn off to appear as Anonymous Patient in provider views.',
      )}

      {/* NRI declaration checkbox */}
      <div className={`rounded-xl border px-4 py-3.5 transition ${state.profile.nriDeclared ? 'border-orange-300 bg-orange-50' : 'border-calm-sage/20 bg-white/80'}`}>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={state.profile.nriDeclared}
            onChange={(e) => setState((prev) => ({
              ...prev,
              profile: { ...prev.profile, nriDeclared: e.target.checked, nriTimezonePool: e.target.checked ? prev.profile.nriTimezonePool : '' },
            }))}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-orange-500"
          />
          <div>
            <p className="text-sm font-semibold text-charcoal">I am an NRI / living outside India</p>
            <p className="mt-0.5 text-xs text-charcoal/60">
              Check this if you are based outside India. We will match you with therapists available in your timezone window at NRI rates.
            </p>
          </div>
        </label>
      </div>

      {state.profile.nriDeclared && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-semibold text-orange-800">NRI Therapist Matching Pool</p>
          <p className="mt-0.5 text-xs text-orange-700/70">
            Select your region so we match you with therapists certified for your time window. This sets your session pricing to NRI rates.
          </p>
          {!state.profile.nriTimezonePool && (
            <p className="mt-2 text-xs font-medium text-orange-600">Please select a timezone below to complete your NRI profile.</p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NRI_TIMEZONE_ZONES.map((zone) => {
              const selected = state.profile.nriTimezonePool === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, profile: { ...prev.profile, nriTimezonePool: zone.id } }))}
                  className={`rounded-xl border px-3 py-2.5 text-center transition ${selected ? 'border-orange-400 bg-orange-100 ring-1 ring-orange-400 text-orange-900' : 'border-calm-sage/20 bg-white text-charcoal/70 hover:border-orange-200 hover:bg-orange-50'}`}
                >
                  <div className="text-lg">{zone.flag}</div>
                  <div className="mt-0.5 text-xs font-semibold">{zone.label}</div>
                  <div className="text-[10px] text-charcoal/50">{zone.sub}</div>
                  <div className={`mt-1 inline-block rounded px-1.5 text-[9px] font-bold ${selected ? 'bg-orange-300 text-orange-900' : 'bg-calm-sage/10 text-charcoal/50'}`}>Pool {zone.pool}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-3">
      <div className="rounded-xl border border-calm-sage/20 bg-white/80 px-3 py-3">
        <p className="text-sm font-medium text-charcoal">Preferred Contact Channel</p>
        <p className="mt-0.5 text-xs text-charcoal/60">How we reach you for reminders and updates.</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(['whatsapp', 'sms', 'email'] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setState((prev) => ({ ...prev, notifications: { ...prev.notifications, communicationChannel: ch } }))}
              className={`rounded-lg border px-2 py-2 text-sm ${state.notifications.communicationChannel === ch ? 'border-calm-sage bg-[#E8EFE6] text-charcoal font-semibold' : 'border-calm-sage/20 text-charcoal/70'}`}
            >
              {ch === 'whatsapp' ? '💬 WhatsApp' : ch === 'sms' ? '📱 SMS' : '✉️ Email'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-calm-sage/20 bg-white/80 px-3 py-3">
        <p className="text-sm font-medium text-charcoal">Preferred Language</p>
        <p className="mt-0.5 text-xs text-charcoal/60">Language for session reminders and communications.</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {(['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setState((prev) => ({ ...prev, notifications: { ...prev.notifications, preferredLanguage: lang } }))}
              className={`rounded-lg border px-2 py-2 text-sm ${state.notifications.preferredLanguage === lang ? 'border-calm-sage bg-[#E8EFE6] text-charcoal font-semibold' : 'border-calm-sage/20 text-charcoal/70'}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {renderSwitch(state.notifications.appointmentReminder, () => setState((prev) => ({ ...prev, notifications: { ...prev.notifications, appointmentReminder: !prev.notifications.appointmentReminder } })), 'Appointment reminders', 'Session time, reschedule alerts')}
        {renderSwitch(state.notifications.therapistMessages, () => setState((prev) => ({ ...prev, notifications: { ...prev.notifications, therapistMessages: !prev.notifications.therapistMessages } })), 'Therapist messages', 'Secure messages from your care team')}
        {renderSwitch(state.notifications.crisisAlerts, () => setState((prev) => ({ ...prev, notifications: { ...prev.notifications, crisisAlerts: !prev.notifications.crisisAlerts } })), 'Crisis support alerts', 'Urgent safety notifications — recommended ON')}
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {renderSwitch(state.privacy.shareWithTherapist, () => setState((prev) => ({ ...prev, privacy: { ...prev.privacy, shareWithTherapist: !prev.privacy.shareWithTherapist } })), 'Share mood & journal with therapist', 'Your therapist can see your mood logs and journal entries')}
        {renderSwitch(state.privacy.allowMoodTracking, () => setState((prev) => ({ ...prev, privacy: { ...prev.privacy, allowMoodTracking: !prev.privacy.allowMoodTracking } })), 'Mood tracking', 'Allow MANAS360 to track and store your daily mood data')}
        {renderSwitch(state.privacy.allowAiSuggestions, () => setState((prev) => ({ ...prev, privacy: { ...prev.privacy, allowAiSuggestions: !prev.privacy.allowAiSuggestions } })), 'AI-personalised suggestions', 'AnytimeBuddy uses your history to personalise responses')}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" className="rounded-lg border border-calm-sage/20 bg-white px-3 py-2 text-sm text-charcoal/80">Export Personal Data</button>
        <button type="button" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Delete Account</button>
      </div>
    </div>
  );


  const renderTherapy = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="text-sm text-charcoal/80">
          Preferred Therapist Gender
          <select
            value={state.therapy.preferredTherapistGender}
            onChange={(event) => setState((prev) => ({ ...prev, therapy: { ...prev.therapy, preferredTherapistGender: event.target.value as any } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          >
            <option value="any">Any</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>
        <label className="text-sm text-charcoal/80">
          Preferred Therapy Type
          <select
            value={state.therapy.preferredTherapyType}
            onChange={(event) => setState((prev) => ({ ...prev, therapy: { ...prev.therapy, preferredTherapyType: event.target.value as any } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          >
            <option value="CBT">CBT</option>
            <option value="Mindfulness">Mindfulness</option>
            <option value="Coaching">Coaching</option>
          </select>
        </label>
        <label className="text-sm text-charcoal/80">
          Session Mode
          <select
            value={state.therapy.sessionMode}
            onChange={(event) => setState((prev) => ({ ...prev, therapy: { ...prev.therapy, sessionMode: event.target.value as any } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          >
            <option value="Video">Video</option>
            <option value="Chat">Chat</option>
            <option value="Audio">Audio</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="text-sm text-charcoal/80">
          Emergency Contact Name
          <input
            value={state.therapy.emergencyName}
            onChange={(event) => setState((prev) => ({ ...prev, therapy: { ...prev.therapy, emergencyName: event.target.value } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm text-charcoal/80">
          Emergency Contact Phone
          <input
            value={state.therapy.emergencyPhone}
            onChange={(event) => setState((prev) => ({ ...prev, therapy: { ...prev.therapy, emergencyPhone: event.target.value } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm text-charcoal/80">
          Relationship
          <input
            value={state.therapy.emergencyRelationship}
            onChange={(event) => setState((prev) => ({ ...prev, therapy: { ...prev.therapy, emergencyRelationship: event.target.value } }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          />
        </label>
      </div>
    </div>
  );

  const renderAIAssistant = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-calm-sage/20 bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-charcoal/60">Voice Language</p>
        <select
          value={aiAssistant.voiceLanguage}
          onChange={(event) => setAiAssistant((prev) => ({ ...prev, voiceLanguage: event.target.value as AIAssistantPreferences['voiceLanguage'] }))}
          className="mt-2 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2 text-sm"
        >
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">Hindi (India)</option>
          <option value="en-US">English (US)</option>
        </select>
      </div>
      {renderSwitch(
        aiAssistant.preferIndianAccent,
        () => setAiAssistant((prev) => ({ ...prev, preferIndianAccent: !prev.preferIndianAccent })),
        'Prefer Indian accent voice',
        'AnytimeBuddy uses an Indian English voice tone',
      )}
    </div>
  );

  const renderBilling = () => {
    const subscription = billingData.subscription;
    const statusRaw = String(subscription?.status || '').toLowerCase();
    const planName = String(
      subscription?.plan?.name
      || subscription?.plan?.displayName
      || subscription?.plan?.key
      || subscription?.planName
      || subscription?.plan_key
      || subscription?.planKey
      || 'Free Tier',
    );

    const parseDateValue = (value?: string | null) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const renewalDateValue = parseDateValue(subscription?.expiryDate || subscription?.renewalDate);
    const renewalDate = renewalDateValue
      ? renewalDateValue.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    const getStatusLabel = (value: string) => {
      if (!value) return 'Locked';
      if (value.includes('trial')) return 'Trial';
      if (value.includes('active') || value.includes('renewed')) return 'Active';
      if (value.includes('past_due') || value.includes('grace') || value.includes('unpaid')) return 'Grace';
      if (value.includes('locked') || value.includes('inactive') || value.includes('cancel')) return 'Locked';
      return 'Locked';
    };

    const statusLabel = getStatusLabel(statusRaw);
    const statusBadgeClasses: Record<string, string> = {
      Active: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      Trial: 'border-amber-100 bg-amber-50 text-amber-900',
      Grace: 'border-amber-100 bg-amber-50 text-amber-900',
      Locked: 'border-rose-100 bg-rose-50 text-rose-700',
    };
    const statusBadgeClass = statusBadgeClasses[statusLabel] ?? statusBadgeClasses.Locked;

    const historyRecords = Array.isArray(billingData.invoices) ? billingData.invoices : [];
    const sortedHistory = [...historyRecords].sort((a, b) => {
      const aTs = parseDateValue(a?.createdAt)?.getTime() ?? 0;
      const bTs = parseDateValue(b?.createdAt)?.getTime() ?? 0;
      return bTs - aTs;
    });

    const formatInvoicePlanName = (entry: any) =>
      String(entry?.plan?.name || entry?.planName || entry?.plan?.key || entry?.planKey || entry?.description || '—');

    const resolveInvoiceAmountMajor = (entry: any): number => {
      const amountMinor = Number(entry?.amountMinor);
      if (Number.isFinite(amountMinor) && amountMinor > 0) {
        return amountMinor / 100;
      }
      const amount = Number(entry?.amount || entry?.total || 0);
      return Number.isFinite(amount) ? amount : 0;
    };

    const isRetryable = (statusValue: string) => /(failed|declined|error|cancel)/.test(statusValue);

    const downloadInvoice = async (invoiceId: string) => {
      try {
        const blob = await patientApi.downloadInvoice(invoiceId);
        const fileUrl = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = fileUrl;
        anchor.download = `invoice-${invoiceId}.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(fileUrl);
      } catch (error: any) {
        setBillingError(error?.response?.data?.message || 'Failed to download invoice.');
      }
    };

    return (
      <div className="space-y-4">
        {billingError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{billingError}</div>
        )}
        {billingLoading ? (
          <div className="rounded-xl border border-calm-sage/20 bg-white/80 p-4 text-sm text-charcoal/70">Loading billing details...</div>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-soft-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Billing &amp; Subscription</p>
              <div className="mt-3 space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-charcoal/60">Plan</p>
                    <p className="text-lg font-semibold text-charcoal">{planName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-charcoal/60">Status</p>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-charcoal/60">Renewal Date</p>
                    <p className="text-sm font-semibold text-charcoal">{renewalDate}</p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end">
                  <Link
                    to="/plans"
                    className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800"
                  >
                    Manage / Upgrade Plan
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-calm-sage/20 bg-white/80 p-4 shadow-soft-sm">
              <p className="text-sm font-semibold text-charcoal">Payment Method</p>
              <p className="mt-1 text-sm text-charcoal/75">
                {billingData.paymentMethod
                  ? `${billingData.paymentMethod.cardBrand || 'Card'} •••• ${billingData.paymentMethod.cardLast4 || '----'}`
                  : 'No registered payment methods'}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft-sm">
              <p className="text-sm font-semibold text-charcoal">Subscription History</p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Amount (incl. GST)</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-sm text-charcoal/60">
                          No invoices found.
                        </td>
                      </tr>
                    ) : (
                      sortedHistory.map((invoice: any, index: number) => {
                        const invoiceDateValue = parseDateValue(
                          invoice.createdAt || invoice.invoiceDate || invoice.updatedAt,
                        );
                        const invoiceDate = invoiceDateValue
                          ? invoiceDateValue.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—';
                        const statusText = String(invoice.status || 'unknown').toUpperCase();
                        const retryable = isRetryable(String(invoice.status || ''));
                        const amountValue = resolveInvoiceAmountMajor(invoice);

                        return (
                          <tr key={`invoice-${invoice.id || index}`} className="border-b border-slate-100">
                            <td className="px-3 py-3 font-medium text-charcoal">{invoiceDate}</td>
                            <td className="px-3 py-3 text-charcoal/80">{formatInvoicePlanName(invoice)}</td>
                            <td className="px-3 py-3 text-charcoal">{formatCurrencyInr(amountValue)}</td>
                            <td className="px-3 py-3 text-charcoal">
                              <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                {statusText}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {retryable ? (
                                <Link
                                  to="/plans"
                                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
                                >
                                  Retry
                                </Link>
                              ) : invoice?.id ? (
                                <button
                                  type="button"
                                  onClick={() => void downloadInvoice(String(invoice.id))}
                                  className="rounded-full border border-calm-sage/30 bg-calm-sage/10 px-3 py-1 text-xs font-semibold text-calm-sage transition hover:bg-calm-sage/20"
                                >
                                  Download
                                </button>
                              ) : (
                                <span className="text-xs text-charcoal/60">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    );
  };

  const renderSecurity = () => (
    <div className="space-y-3">
      {renderSwitch(state.security.twoFactorEnabled, () => setState((prev) => ({ ...prev, security: { ...prev.security, twoFactorEnabled: !prev.security.twoFactorEnabled } })), 'Two-factor authentication')}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPasswordForm((prev) => ({ ...prev }))}
          className="rounded-lg border border-calm-sage/20 bg-white px-3 py-2 text-sm text-charcoal/80"
        >
          Change Password
        </button>
        <button
          type="button"
          onClick={async () => {
            setSecurityLoading(true);
            setError(null);
            try {
              const res = await patientApi.getActiveSessions();
              const sessions = (res as any)?.data ?? res ?? [];
              setActiveSessions(Array.isArray(sessions) ? sessions : []);
              setSuccess('Login history loaded successfully.');
            } catch (err: any) {
              setError(err?.response?.data?.message || 'Failed to load login history.');
            } finally {
              setSecurityLoading(false);
            }
          }}
          className="rounded-lg border border-calm-sage/20 bg-white px-3 py-2 text-sm text-charcoal/80"
        >
          Login History
        </button>
        <button
          type="button"
          onClick={async () => {
            setSecurityLoading(true);
            setError(null);
            try {
              const res = await patientApi.getActiveSessions();
              const sessions = (res as any)?.data ?? res ?? [];
              setActiveSessions(Array.isArray(sessions) ? sessions : []);
              setSuccess('Active sessions loaded successfully.');
            } catch (err: any) {
              setError(err?.response?.data?.message || 'Failed to load active sessions.');
            } finally {
              setSecurityLoading(false);
            }
          }}
          className="rounded-lg border border-calm-sage/20 bg-white px-3 py-2 text-sm text-charcoal/80"
        >
          Active Sessions
        </button>
        <button
          type="button"
          onClick={async () => {
            setSecurityLoading(true);
            setError(null);
            try {
              await patientApi.revokeAllSessions();
              setSuccess('All devices logged out successfully.');
              await logout();
            } catch (err: any) {
              setError(err?.response?.data?.message || 'Failed to logout all devices.');
            } finally {
              setSecurityLoading(false);
            }
          }}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          Logout All Devices
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="text-sm text-charcoal/80">
          Current Password
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm text-charcoal/80">
          New Password
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm text-charcoal/80">
          Confirm Password
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-calm-sage/25 bg-white px-3 py-2"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={securityLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
        onClick={async () => {
          setSecurityLoading(true);
          setError(null);
          try {
            await patientApi.changePassword(passwordForm);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setSuccess('Password changed successfully.');
          } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to change password.');
          } finally {
            setSecurityLoading(false);
          }
        }}
        className="rounded-lg bg-calm-sage px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {securityLoading ? 'Please wait...' : 'Update Password'}
      </button>

      {activeSessions.length > 0 && (
        <div className="space-y-2 rounded-xl border border-calm-sage/20 bg-white/80 p-3">
          <p className="text-sm font-semibold text-charcoal">Active Sessions</p>
          {activeSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between gap-3 rounded-lg border border-calm-sage/15 bg-white px-3 py-2">
              <div>
                <p className="text-sm font-medium text-charcoal">{session.device || 'Unknown device'} {session.isCurrent ? '(Current)' : ''}</p>
                <p className="text-xs text-charcoal/60">{session.ipAddress || 'IP unavailable'} • Last active {session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString() : 'N/A'}</p>
              </div>
              {!session.isCurrent && (
                <button
                  type="button"
                  onClick={async () => {
                    setSecurityLoading(true);
                    setError(null);
                    try {
                      await patientApi.revokeSession(session.id);
                      setActiveSessions((prev) => prev.filter((item) => item.id !== session.id));
                      setSuccess('Session revoked successfully.');
                    } catch (err: any) {
                      setError(err?.response?.data?.message || 'Failed to revoke session.');
                    } finally {
                      setSecurityLoading(false);
                    }
                  }}
                  className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                >
                  Logout device
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSection = (section: SectionId) => {
    switch (section) {
      case 'profile': return renderProfile();
      case 'notifications': return renderNotifications();
      case 'privacy': return renderPrivacy();
      case 'therapy': return renderTherapy();
      case 'aiAssistant': return renderAIAssistant();
      case 'billing': return renderBilling();
      case 'security': return renderSecurity();
      default: return null;
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-calm-sage/15 bg-white/80 p-6">Loading settings...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 pb-20 lg:pb-6">
      <section className="rounded-2xl border border-calm-sage/20 bg-white/95 px-5 py-4 shadow-soft-sm">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-calm-sage" />
          <h1 className="text-xl font-semibold text-charcoal">Settings</h1>
        </div>
        <p className="mt-1 text-sm text-charcoal/65">Manage your profile, AI assistant preferences, privacy, and security in one place.</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      {anyDirty && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have unsaved changes in one or more settings sections.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[64px_1fr] xl:grid-cols-[240px_1fr]">
        <aside className="hidden self-start md:sticky md:top-24 md:block">
          <div className="max-h-[calc(100vh-7.5rem)] rounded-2xl border border-calm-sage/20 bg-white/95 p-2 shadow-soft-sm xl:p-3">
            <nav className="max-h-[calc(100vh-9rem)] space-y-1 overflow-y-auto pr-1" aria-label="Settings sections">
              {sectionMeta.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleSelectSection(section.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition xl:px-3 ${
                      active ? 'bg-[#E8EFE6] text-charcoal' : 'text-charcoal/70 hover:bg-calm-sage/10'
                    }`}
                    title={section.label}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden xl:inline">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="hidden md:block rounded-2xl border border-calm-sage/20 bg-white/95 p-4 shadow-soft-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-charcoal">{sectionMeta.find((section) => section.id === activeSection)?.label}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => discardSection(activeSection)}
                disabled={!sectionDirty(activeSection) || saving}
                className="rounded-lg border border-calm-sage/20 bg-white px-3 py-2 text-sm text-charcoal/80 disabled:opacity-40"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => void saveSection(activeSection)}
                disabled={!sectionDirty(activeSection) || saving}
                className="rounded-lg bg-calm-sage px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          {renderSection(activeSection)}
        </section>

        <section className="space-y-2 md:hidden">
          {sectionMeta.map((section) => {
            const Icon = section.icon;
            const open = mobileOpen === section.id;
            return (
              <div key={section.id} className="overflow-hidden rounded-2xl border border-calm-sage/20 bg-white/95 shadow-soft-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen((prev) => {
                      const next = prev === section.id ? null : section.id;
                      if (next) setSectionInUrl(next);
                      return next;
                    });
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal">
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </span>
                  {open ? <ChevronUp className="h-4 w-4 text-charcoal/60" /> : <ChevronDown className="h-4 w-4 text-charcoal/60" />}
                </button>
                {open && (
                  <div className="space-y-3 border-t border-calm-sage/15 px-4 py-3">
                    {renderSection(section.id)}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => discardSection(section.id)}
                        disabled={!sectionDirty(section.id) || saving}
                        className="flex-1 rounded-lg border border-calm-sage/20 bg-white px-3 py-2 text-sm text-charcoal/80 disabled:opacity-40"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveSection(section.id)}
                        disabled={!sectionDirty(section.id) || saving}
                        className="flex-1 rounded-lg bg-calm-sage px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>

      {String(user?.role || '').toLowerCase() !== 'patient' && (
        <div className="rounded-xl border border-calm-sage/20 bg-[#E8EFE6] px-4 py-3 text-sm text-charcoal/75">
          Role-based settings are active. Additional role-specific sections can be enabled for your account type.
        </div>
      )}
    </div>
  );
}
