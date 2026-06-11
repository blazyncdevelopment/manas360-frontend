import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { corporateApi } from '../../api/corporate.api';
import { useAuth } from '../../context/AuthContext';

type Step = 'details' | 'otp' | 'done';

const INPUT = 'w-full rounded-xl border border-[#D9E0DA] bg-white px-4 py-2.5 text-sm text-[#18302E] outline-none transition focus:border-[#4E8F86] focus:ring-2 focus:ring-[#4E8F86]/20';
const LABEL = 'block text-xs font-semibold uppercase tracking-[0.14em] text-[#3B766E] mb-1';

export default function CorporateEmployeeSignupPage() {
  const navigate = useNavigate();
  const { syncSessionAfterOtp } = useAuth();

  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null);

  const handleDetails = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const validation = await corporateApi.validateEmployeeClientId(clientId.trim().toUpperCase(), workEmail.trim().toLowerCase());
      setCompanyName(validation.companyName);
      setSeatsLeft(validation.seatsLeft);

      await corporateApi.requestEmployeeB2bOtp({
        clientId: clientId.trim().toUpperCase(),
        workEmail: workEmail.trim().toLowerCase(),
        phone: phone.trim(),
        name: name.trim(),
      });
      setStep('otp');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Validation failed. Check your Client ID and email.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await corporateApi.verifyEmployeeB2bRegistration({
        clientId: clientId.trim().toUpperCase(),
        workEmail: workEmail.trim().toLowerCase(),
        phone: phone.trim(),
        otp: otp.trim(),
        name: name.trim(),
      }) as any;

      const user = result?.user;
      if (user?.id) {
        await syncSessionAfterOtp(user);
      }
      navigate('/patient/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-10">
      <div className="mx-auto max-w-md">

        <div className="mt-6 overflow-hidden rounded-3xl border border-[#D5E0DA] bg-white shadow-[0_20px_60px_rgba(8,57,53,0.1)]">
          <div className="bg-gradient-to-r from-teal-700 to-emerald-600 px-7 py-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Corporate Wellness</p>
            <h1 className="mt-1.5 text-2xl font-bold text-white">Employee Registration</h1>
            <p className="mt-1 text-sm text-white/80">
              {step === 'details'
                ? 'Enter your company Client ID and work email to get started.'
                : step === 'otp'
                ? `Enter the OTP sent to ${phone}`
                : 'You are registered!'}
            </p>
          </div>

          <div className="px-7 py-6">
            {/* Steps indicator */}
            <div className="mb-6 flex items-center gap-2">
              {(['details', 'otp'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    s === step ? 'bg-teal-600 text-white' :
                    (step === 'otp' && i === 0) || step === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {(step === 'otp' && i === 0) || step === 'done' ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-medium text-gray-500">{s === 'details' ? 'Details' : 'Verify'}</span>
                  {i === 0 && <span className="text-gray-200">—</span>}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            )}

            {step === 'details' && (
              <form onSubmit={handleDetails} className="space-y-4">
                <div>
                  <label className={LABEL}>Company Client ID</label>
                  <input
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value.toUpperCase())}
                    placeholder="CORP-ACME-2026"
                    className={INPUT}
                    required
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-gray-400">Provided by your HR team in the welcome email.</p>
                </div>
                <div>
                  <label className={LABEL}>Work Email</label>
                  <input
                    type="email"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder="you@company.com"
                    className={INPUT}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL}>Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Priya Sharma"
                    className={INPUT}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL}>Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="flex items-center rounded-xl border border-[#D9E0DA] bg-gray-50 px-3 text-sm font-semibold text-gray-500">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className={`${INPUT} flex-1`}
                      required
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-xs text-teal-800">
                  ✓ Your employer covers the cost · ₹0 for you · Completely confidential
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {loading ? 'Validating...' : 'Continue →'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleOtp} className="space-y-4">
                {companyName && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm font-semibold text-emerald-800">✓ Verified: {companyName}</p>
                    {seatsLeft !== null && <p className="text-xs text-emerald-700">{seatsLeft} seats remaining</p>}
                  </div>
                )}
                <div>
                  <label className={LABEL}>Enter OTP</label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]{4,6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="4–6 digit OTP"
                    className={INPUT}
                    required
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-gray-400">Sent to +91 {phone}</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {loading ? 'Verifying...' : 'Verify & Access Platform'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('details'); setOtp(''); setError(null); }}
                  className="w-full text-xs text-teal-600 underline hover:text-teal-800"
                >
                  Change details
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
              Are you an HR admin?{' '}
              <Link to="/corporate" className="font-semibold text-teal-600 hover:underline">Create corporate account →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
