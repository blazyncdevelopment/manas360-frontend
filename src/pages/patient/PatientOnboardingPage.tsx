import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/auth';
import { patientApi } from '../../api/patient';
import { http } from '../../lib/http';

const NRI_ZONES = [
  { id: 'us_east',   code: 'US', label: 'US East',   sub: 'EDT/EST (UTC-4/-5)',    pool: 'C' },
  { id: 'us_west',   code: 'US', label: 'US West',   sub: 'PDT/PST (UTC-7/-8)',    pool: 'D' },
  { id: 'uk',        code: 'GB', label: 'UK',         sub: 'BST/GMT (UTC+1/0)',     pool: 'B' },
  { id: 'australia', code: 'AU', label: 'Australia',  sub: 'AEST/AEDT (UTC+10/+11)', pool: 'A' },
  { id: 'singapore', code: 'SG', label: 'Singapore',  sub: 'SGT (UTC+8)',           pool: 'B' },
  { id: 'uae',       code: 'AE', label: 'UAE / Gulf', sub: 'GST (UTC+4)',           pool: 'B' },
];

export default function PatientOnboardingPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const next      = new URLSearchParams(location.search).get('next') || '/patient/preferences';

  const [age,            setAge]            = useState('25');
  const [gender,         setGender]         = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [carrier,        setCarrier]        = useState('');
  const [isNri,          setIsNri]          = useState(false);
  const [nriPool,        setNriPool]        = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [nriStdPrice,    setNriStdPrice]    = useState<number | null>(null);
  const [nriVideoPrice,  setNriVideoPrice]  = useState<number | null>(null);

  useEffect(() => {
    patientApi.getPricing({ mode: 'nri' }).then((res: any) => {
      const sessions: any[] = res?.data?.sessionPricing ?? res?.sessionPricing ?? [];
      // Show the lowest NRI session price (coach/psychologist base rate)
      const prices = sessions.map((s: any) => Number(s.price)).filter((p) => p > 0);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        setNriStdPrice(minPrice);
        setNriVideoPrice(Math.round(minPrice * 1.1));
      }
    }).catch(() => {
      setNriStdPrice(2999);
      setNriVideoPrice(3299);
    });
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setError('Please enter a valid age between 1 and 120.');
      return;
    }
    if (isNri && !nriPool) {
      setError('Please select your timezone region.');
      return;
    }

    setSaving(true);
    try {
      await patientApi.createProfile({
        age: parsedAge,
        gender,
        medicalHistory: medicalHistory.trim() || undefined,
        carrier: carrier.trim() || undefined,
      });

      if (isNri) {
        await http.patch('/v1/users/me', {
          nri_declared: true,
          nri_timezone_pool: nriPool,
        });
      }

      navigate(next, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to complete onboarding.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="responsive-page">
      <div className="responsive-container py-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-calm-sage/20 bg-wellness-surface p-5 shadow-soft-md sm:p-8">
          <h1 className="text-2xl font-semibold text-wellness-text sm:text-3xl">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-wellness-muted sm:text-base">
            A few details to personalise your care experience.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-wellness-text">Age</span>
                <input
                  type="number" min={1} max={120} value={age} required
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-xl border border-calm-sage/25 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-wellness-text">Gender</span>
                <select
                  value={gender} required
                  onChange={(e) => setGender(e.target.value as typeof gender)}
                  className="w-full rounded-xl border border-calm-sage/25 px-3 py-2 text-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-wellness-text">Medical history <span className="font-normal text-wellness-muted">(optional)</span></span>
              <textarea
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="min-h-[80px] w-full rounded-xl border border-calm-sage/25 px-3 py-2 text-sm"
                placeholder="Allergies, chronic conditions, medications..."
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-wellness-text">Carrier <span className="font-normal text-wellness-muted">(optional)</span></span>
              <input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full rounded-xl border border-calm-sage/25 px-3 py-2 text-sm"
                placeholder="Airtel, Jio, VI..."
              />
            </label>

            {/* NRI declaration */}
            <div className={`rounded-xl border px-4 py-3.5 transition-colors ${isNri ? 'border-orange-300 bg-orange-50' : 'border-calm-sage/20 bg-white/60'}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isNri}
                  onChange={(e) => { setIsNri(e.target.checked); if (!e.target.checked) setNriPool(''); }}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
                />
                <div>
                  <p className="text-sm font-semibold text-wellness-text">I am an NRI / living outside India</p>
                  <p className="mt-0.5 text-xs text-wellness-muted">
                    We will match you with therapists available in your timezone at NRI rates.
                    {nriStdPrice && (
                      <span className="ml-1 font-medium text-orange-700">
                        Standard ₹{nriStdPrice.toLocaleString('en-IN')} · Video ₹{nriVideoPrice?.toLocaleString('en-IN')} per session.
                      </span>
                    )}
                  </p>
                </div>
              </label>

              {isNri && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-orange-700">Select your timezone region</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {NRI_ZONES.map((zone) => {
                      const sel = nriPool === zone.id;
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => setNriPool(zone.id)}
                          className={`rounded-xl border px-3 py-3 text-center transition ${sel ? 'border-orange-400 bg-orange-100 ring-1 ring-orange-400' : 'border-calm-sage/20 bg-white hover:border-orange-200 hover:bg-orange-50'}`}
                        >
                          <div className={`text-[11px] font-bold tracking-widest ${sel ? 'text-orange-600' : 'text-wellness-muted/60'}`}>{zone.code}</div>
                          <div className={`mt-0.5 text-xs font-semibold ${sel ? 'text-orange-900' : 'text-wellness-text'}`}>{zone.label}</div>
                          <div className="text-[10px] text-wellness-muted">{zone.sub}</div>
                          <div className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${sel ? 'bg-orange-400 text-white' : 'bg-calm-sage/10 text-wellness-muted'}`}>
                            Pool {zone.pool}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-charcoal px-4 text-sm font-semibold text-cream transition hover:bg-charcoal/90 disabled:opacity-60"
            >
              {saving ? 'Setting up your profile...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
